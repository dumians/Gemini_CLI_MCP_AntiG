import { dataplex } from '../agent/utils/dataplex.js';

async function run() {
    console.log("=== Querying Live Dataplex Contracts ===");
    try {
        const contracts = await dataplex.listDataContracts();
        console.log("\nResults:");
        console.log(JSON.stringify(contracts, null, 2));
    } catch (e) {
        console.error("Verification failed:", e.message);
    }
}

run();
