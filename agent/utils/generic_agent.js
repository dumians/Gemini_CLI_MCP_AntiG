import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logging_service.js";
import { groundGraphContext, groundingInstructions, groundWithCatalogContext } from "./grounding.js";
import dotenv from "dotenv";
import { ModelArmorClient } from "@google-cloud/modelarmor";
import { gateway } from "./one_mcp_gateway.js";
import { mcpToolbox } from "./mcp_toolbox.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelArmorClient = new ModelArmorClient();
const MODEL_ARMOR_TEMPLATE = process.env.MODEL_ARMOR_TEMPLATE || `projects/${process.env.GCP_PROJECT_ID || 'PROJECT_ID'}/locations/global/templates/default`;

class GenericAgent {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.domain = config.domain;
        this.systemInstruction = config.systemInstruction || "";
        this.mcpServers = config.mcpServers || [];
        this.groundingDomain = config.groundingDomain || config.domain;
    }

    async process(query, meshContext = {}, traceId = null) {
        logger.log(this.name, `Processing query via One MCP Gateway: ${query}`, "INFO", null, traceId);

        // 1. Proactive Security Shielding (Model Armor)
        try {
            const [armorResponse] = await modelArmorClient.sanitizeUserPrompt({
                template: MODEL_ARMOR_TEMPLATE,
                text: query
            });
            if (armorResponse.blocked) {
                logger.log(this.name, `Query blocked by Model Armor: ${armorResponse.reason}`, "WARNING", null, traceId);
                return {
                    domain: this.domain,
                    data: "Content blocked by security policy.",
                    metadata: { confidence: 0, source: this.name },
                    insights: "Query blocked by security policy."
                };
            }
            query = armorResponse.text || query;
        } catch (error) {
            logger.log(this.name, `Model Armor prompt sanitization failed: ${error.message}`, "WARNING", null, traceId);
        }

        // 2. Retrieve capabilities via One MCP Gateway
        let allTools = await gateway.listTools(this.domain, this.mcpServers);
        
        // 3. Inject standardized fallback tools from MCP Toolbox if needed
        allTools = mcpToolbox.injectStandardTools(allTools, this.id, this.domain);

        if (allTools.length === 0) {
            throw new Error(`No tools available for ${this.name} within domain ${this.domain}. Check Gateway routing.`);
        }

        const geminiTools = [
            {
                functionDeclarations: allTools.map(t => ({
                    name: t.name,
                    description: t.description,
                    parameters: t.inputSchema
                }))
            }
        ];

        const catalogContext = groundWithCatalogContext(this.groundingDomain);

        const finalInstruction = `${this.systemInstruction}
        
        ${groundingInstructions}
        
        ${catalogContext}
        
        Current Mesh Context (Data from other domains):
        ${JSON.stringify(meshContext, null, 2)}
        
        Use this context to enrich your analysis if relevant.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: finalInstruction,
            tools: geminiTools
        });

        const chat = model.startChat();
        let result = await chat.sendMessage(query);
        let response = result.response;

        let groundingData = [];

        while (response.functionCalls && response.functionCalls.length > 0) {
            const toolCallParts = [];
            for (const call of response.functionCalls) {
                const startTime = Date.now();
                logger.logToolCall(this.name, call.name, call.args, traceId);

                const tool = allTools.find(t => t.name === call.name);
                if (!tool) {
                     throw new Error(`Gemini called unknown tool: ${call.name}`);
                }

                // Execute tool via client reference (Gateway or Toolbox)
                const toolResult = await tool._client.callTool(call.name, call.args);
                const duration = Date.now() - startTime;

                let formattedResult = toolResult.content[0].text;
                logger.logToolResult(this.name, call.name, formattedResult, duration, traceId);

                if (call.name.includes("graph")) {
                    groundingData.push(formattedResult);
                    formattedResult = groundGraphContext(this.groundingDomain, [formattedResult]);
                }

                toolCallParts.push({
                    functionResponse: {
                        name: call.name,
                        response: { result: formattedResult }
                    }
                });
            }
            result = await chat.sendMessage(toolCallParts);
            response = result.response;
        }

        let resultText = response.text();

        // 4. Proactive Output Sanitization (Model Armor)
        try {
            const [armorResponse] = await modelArmorClient.sanitizeModelResponse({
                template: MODEL_ARMOR_TEMPLATE,
                text: resultText
            });
            if (armorResponse.blocked) {
                logger.log(this.name, `Response blocked by Model Armor: ${armorResponse.reason}`, "WARNING", null, traceId);
                return {
                    domain: this.domain,
                    data: "Content blocked by security policy.",
                    metadata: { confidence: 0, source: this.name },
                    insights: "Response blocked by security policy."
                };
            }
            resultText = armorResponse.text || resultText;
        } catch (error) {
            logger.log(this.name, `Model Armor response sanitization failed: ${error.message}`, "WARNING", null, traceId);
        }

        return {
            domain: this.domain,
            data: resultText,
            metadata: {
                confidence: 0.95,
                source: this.name,
                grounding: groundingData
            },
            insights: `${this.name} analysis complete.`
        };
    }
}

export default GenericAgent;
