import { askOrchestrator } from '../agent/orchestrator.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const query = process.argv[2];
    if (!query) {
        console.error("Usage: node scripts/query_runner.js \"<query>\"");
        process.exit(1);
    }

    console.log(`\n🚀 Dispatching Query to Multi-Agent Mesh: "${query}"\n`);
    console.log("--------------------------------------------------------------------------------");
    console.log("Processing... (Resolving Cross-Domain Dependencies)");
    console.log("--------------------------------------------------------------------------------\n");

    try {
        const startTime = Date.now();
        const result = await askOrchestrator(query);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n✅ Query successfully resolved in ${duration}s!\n`);

        if (result.steps && result.steps.length > 0) {
            console.log("🔍 --- Agentic Execution Chain (A2A Steps) ---");
            result.steps.forEach((step, index) => {
                console.log(`\n[Step ${index + 1}] Agent: ${step.agent}`);
                console.log(`   Sub-Query : ${step.query}`);
                console.log(`   Domain    : ${step.result.domain}`);
                console.log(`   Confidence: ${(step.result.metadata.confidence * 100).toFixed(1)}%`);
                console.log(`   Insights  : ${step.result.insights}`);
                
                // Print a preview of data returned
                let dataSummary = "";
                if (typeof step.result.data === 'string') {
                    dataSummary = step.result.data.substring(0, 200);
                } else {
                    dataSummary = JSON.stringify(step.result.data).substring(0, 200);
                }
                console.log(`   Data (Preview): ${dataSummary}...`);
            });
            console.log("\n--------------------------------------------\n");
        }

        console.log("👑 --- Master Orchestrator Synthesis ---");
        console.log(result.text);
        console.log("--------------------------------------------\n");

        if (result.reflection) {
            console.log("🛡️  --- Self-Correction Reflection ---");
            console.log(result.reflection);
            console.log("--------------------------------------------\n");
        }

    } catch (err) {
        console.error("\n❌ Orchestration Error:", err.message);
        process.exit(1);
    }
}

main();
