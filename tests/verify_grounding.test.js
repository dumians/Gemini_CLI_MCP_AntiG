import test from "node:test";
import assert from "node:assert";
import { metadataCatalog } from '../agent/utils/catalog.js';

test("MetadataCatalog Verification", async () => {
    metadataCatalog.initialize();
    
    const retailContext = metadataCatalog.getGroundingContext("Retail");
    assert.ok(retailContext.includes("Graphs:") && retailContext.includes("RetailGraph"), "Should find RetailGraph in Retail context");
    
    const financeContext = metadataCatalog.getGroundingContext("Finance");
    assert.ok(financeContext.includes("Graphs:") && financeContext.includes("erp_supply_graph"), "Should find erp_supply_graph in Finance context");
});
