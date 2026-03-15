import { metadataCatalog } from '../agent/utils/catalog.js';

async function verify() {
    console.log("--- Starting MetadataCatalog Verification ---");
    
    // Initialize the catalog
    metadataCatalog.initialize();
    
    // Check Retail domain (Spanner)
    console.log("\n[Verification] Checking Retail (Spanner) Graph Metadata...");
    const retailContext = metadataCatalog.getGroundingContext("Retail");
    console.log("Retail Context:\n", retailContext);
    
    if (retailContext.includes("Graphs:") && retailContext.includes("RetailGraph")) {
        console.log("✅ Retail Graph Metadata: Found RetailGraph");
    } else {
        console.log("❌ Retail Graph Metadata: RetailGraph NOT FOUND");
    }
    
    // Check Finance domain (Oracle)
    console.log("\n[Verification] Checking Finance (Oracle) Graph Metadata...");
    const financeContext = metadataCatalog.getGroundingContext("Finance");
    console.log("Finance Context:\n", financeContext);
    
    if (financeContext.includes("Graphs:") && financeContext.includes("erp_supply_graph")) {
        console.log("✅ Finance Graph Metadata: Found erp_supply_graph");
    } else {
        console.log("❌ Finance Graph Metadata: erp_supply_graph NOT FOUND");
    }
    
    console.log("\n--- Verification Complete ---");
}


verify().catch(err => {
    console.error("Verification failed:", err);
    process.exit(1);
});
