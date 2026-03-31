import { GoogleGenerativeAI } from "@google/generative-ai";
import { metadataCatalog } from "./utils/catalog.js";
import { logger } from "./utils/logging_service.js";
import { configService } from "./utils/config_service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = configService.getConfig("brm_agent");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function handleBRMRequest(query, context = {}, traceId = null) {
    logger.log("BRMAgent", `Processing BRM query: ${query}`, "INFO", null, traceId);

    const catalogContext = metadataCatalog.getGroundingContext("BRM");

    const systemInstruction = `You are an Oracle BRM (Billing and Revenue Management) Data Specialist Agent. 
    You have access to the BRM schema (Accounts, Invoices, Services).
    
    ${catalogContext}
    
    Current Mesh Context (Data from other domains):
    ${JSON.stringify(context, null, 2)}
    
    Use this context to answer the query.
    Return a response that follows the Data Product Contract (handled by return structure).
    
    If you need actual data for BRM invoices or accounts, call the 'read_csv' tool to read test data from file.`;

    const model = genAI.getGenerativeModel({
        model: config.model || "gemini-2.5-flash",
        systemInstruction,
        tools: [{
            functionDeclarations: [{
                name: "read_csv",
                description: "Reads the content of the BRM invoices CSV file containing billing data.",
                parameters: { type: "OBJECT", properties: {} }
            }]
        }]
    });

    try {
        const chat = model.startChat();
        let result = await chat.sendMessage(query);
        let response = result.response;

        if (response.functionCalls() && response.functionCalls().length > 0) {
            const call = response.functionCalls()[0];
            if (call.name === "read_csv") {
                const csvPath = path.join(__dirname, '../test-data/brm_invoices.csv');
                let fileContent = "File not found";
                if (fs.existsSync(csvPath)) {
                    fileContent = fs.readFileSync(csvPath, 'utf8');
                }
                
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: "read_csv",
                        response: { result: fileContent }
                    }
                }]);
                response = result.response;
            }
        }

        const responseText = response.text();

        return {
            domain: "BRM",
            data: responseText,
            metadata: {
                confidence: 0.9,
                source: "Simulated BRM Schema + CSV Tool"
            },
            insights: "BRM data analyzed with tool assistance."
        };
    } catch (err) {
        logger.log("BRMAgent", `Error: ${err.message}`, "ERROR", null, traceId);
        throw err;
    }
}
