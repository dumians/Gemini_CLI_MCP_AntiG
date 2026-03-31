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
const config = configService.getConfig("flexcube_agent");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function handleFlexCubeRequest(query, context = {}, traceId = null) {
    logger.log("FlexCubeAgent", `Processing FlexCube query: ${query}`, "INFO", null, traceId);

    const catalogContext = metadataCatalog.getGroundingContext("FlexCube");

    const systemInstruction = `You are an Oracle FlexCube (Core Banking) Data Specialist Agent. 
    You have access to the FlexCube schema (Accounts, Transactions, Customers).
    
    ${catalogContext}
    
    Current Mesh Context (Data from other domains):
    ${JSON.stringify(context, null, 2)}
    
    Use this context to answer the query.
    Return a response that follows the Data Product Contract (handled by return structure).
    
    If you need actual data for FlexCube transactions or accounts, call the 'read_csv' tool to read test data from file.`;

    const model = genAI.getGenerativeModel({
        model: config.model || "gemini-2.5-flash",
        systemInstruction,
        tools: [{
            functionDeclarations: [{
                name: "read_csv",
                description: "Reads the content of the FlexCube transactions CSV file containing account data.",
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
                const csvPath = path.join(__dirname, '../test-data/flexcube_transactions.csv');
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
            domain: "FlexCube",
            data: responseText,
            metadata: {
                confidence: 0.9,
                source: "Simulated FlexCube Schema + CSV Tool"
            },
            insights: "FlexCube data analyzed with tool assistance."
        };
    } catch (err) {
        logger.log("FlexCubeAgent", `Error: ${err.message}`, "ERROR", null, traceId);
        throw err;
    }
}
