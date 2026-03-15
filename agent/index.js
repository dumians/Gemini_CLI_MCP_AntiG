import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import * as readline from "readline/promises";
import { handleFinancialRequest } from "./financial_agent.js";
import { handleRetailRequest } from "./retail_agent.js";
import { handleAnalyticsRequest } from "./analytics_agent.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    console.error("Please set GEMINI_API_KEY environment variable.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function startOrchestrator() {
    console.log("Starting Enterprise A2A Data Orchestrator...");

    const systemInstruction = `You are the Master Data Orchestrator. Your job is to receive complex enterprise data queries and delegate them to specialized sub-agents:
  - FinancialAgent: Handles Oracle DB@GCP (ERP, Invoices, Suppliers).
  - RetailAgent: Handles Spanner (Global Inventory, Transactions, Supply Chain).
  - AnalyticsAgent: Handles BigQuery (EDW) and AlloyDB (CRM).
  
  When you receive a query, break it down and call the appropriate sub-agent tools. You should coordinate their responses and provide a final synthesized answer to the user.
  
  Available Tools (Delegations):
  - call_financial_agent(query): Delegates a financial/Oracle query.
  - call_retail_agent(query): Delegates a retail/Spanner query.
  - call_analytics_agent(query): Delegates an analytics/BigQuery/AlloyDB query.`;

    const geminiTools = [
        {
            functionDeclarations: [
                {
                    name: "call_financial_agent",
                    description: "Delegate a query to the Financial Specialist (Oracle DB@GCP).",
                    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
                },
                {
                    name: "call_retail_agent",
                    description: "Delegate a query to the Retail/Supply Chain Specialist (Spanner).",
                    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
                },
                {
                    name: "call_analytics_agent",
                    description: "Delegate a query to the Analytics Specialist (BigQuery/AlloyDB).",
                    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
                }
            ]
        }
    ];

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
        tools: geminiTools
    });

    const chat = model.startChat();

    console.log("\nOrchestrator Ready. Enter your complex query (or type 'exit' to quit):");

    while (true) {
        const query = await rl.question("> ");
        if (query.toLowerCase() === "exit") break;
        if (!query.trim()) continue;

        console.log("\nOrchestrator is delegating...");

        try {
            let result = await chat.sendMessage(query);
            let response = result.response;

            while (response.functionCalls() && response.functionCalls().length > 0) {
                const toolCallParts = [];
                for (const call of response.functionCalls()) {
                    let agentResult = "";
                    if (call.name === "call_financial_agent") {
                        agentResult = await handleFinancialRequest(call.args.query);
                    } else if (call.name === "call_retail_agent") {
                        agentResult = await handleRetailRequest(call.args.query);
                    } else if (call.name === "call_analytics_agent") {
                        agentResult = await handleAnalyticsRequest(call.args.query);
                    }

                    toolCallParts.push({
                        functionResponse: {
                            name: call.name,
                            response: { result: agentResult }
                        }
                    });
                }
                result = await chat.sendMessage(toolCallParts);
                response = result.response;
            }

            console.log("\n--- Master Orchestrator Final Response ---");
            console.log(response.text());
            console.log("------------------------------------------\n");

        } catch (err) {
            console.error("Orchestration Error:", err.message);
        }
    }

    rl.close();
    process.exit(0);
}

startOrchestrator().catch(console.error);
