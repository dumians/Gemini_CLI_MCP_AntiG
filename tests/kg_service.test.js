import { kgService } from '../agent/utils/kg_service.js';

async function testKG() {
    console.log("Starting KG Service Test...");
    
    // 1. Create Intent
    const traceId = "test-trace-123";
    const intentId = kgService.createIntentNode("Find warehouse delays in Retail domain", traceId);
    console.log(`Created Intent Node: ${intentId}`);
    
    // 2. Create Context (Data Product)
    const ctxId = kgService.createContextNode('DATA_PRODUCT', {
        agent: 'RetailAgent',
        domain: 'Retail',
        insight: 'Delay found in Warehouse 402'
    });
    console.log(`Created Context Node: ${ctxId}`);
    
    // 3. Link them
    kgService.addEdge(intentId, ctxId, 'SATISFIED_BY');
    console.log("Linked Intent to Context.");
    
    // 4. Verify Summary
    const summary = kgService.getHorizontalContextSummary();
    console.log("\n--- Generated Summary ---");
    console.log(summary);
    
    if (summary.includes("Find warehouse delays") && summary.includes("RetailAgent")) {
        console.log("\nPASS: KG logic verified.");
    } else {
        console.error("\nFAIL: Summary did not include expected data.");
        process.exit(1);
    }
}

testKG().catch(err => {
    console.error(err);
    process.exit(1);
});
