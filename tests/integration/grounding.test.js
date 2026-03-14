import test from "node:test";
import assert from "node:assert";
import { metadataCatalog } from "../../agent/utils/catalog.js";

test("Grounding Integration: Metadata Catalog Initialization", async () => {
    metadataCatalog.initialize();
    const catalog = metadataCatalog.getCatalog();
    assert.ok(Object.keys(catalog.sources).length > 0, "Catalog should have data sources");
    assert.ok(Object.keys(catalog.entities).length > 0, "Catalog should have entities");
});

test("Grounding Integration: Retail (Spanner) Graph Metadata", async () => {
    metadataCatalog.initialize();
    const context = metadataCatalog.getGroundingContext("Retail");
    
    assert.ok(context.includes("[CATALOG CONTEXT - RETAIL]"), "Context should have Retail header");
    assert.ok(context.includes("Graphs:"), "Retail context should contain Graphs section");
    assert.ok(context.includes("RetailGraph"), "Retail context should contain RetailGraph");
});

test("Grounding Integration: Finance (Oracle) Graph Metadata", async () => {
    metadataCatalog.initialize();
    const context = metadataCatalog.getGroundingContext("Finance");
    
    assert.ok(context.includes("[CATALOG CONTEXT - FINANCE]"), "Context should have Finance header");
    assert.ok(context.includes("Graphs:"), "Finance context should contain Graphs section");
    assert.ok(context.includes("erp_supply_graph"), "Finance context should contain erp_supply_graph");
});

test("Grounding Integration: Analytics (BigQuery/AlloyDB) Metadata", async () => {
    metadataCatalog.initialize();
    const context = metadataCatalog.getGroundingContext("Analytics");
    
    assert.ok(context.includes("[CATALOG CONTEXT - ANALYTICS]"), "Context should have Analytics header");
    assert.ok(context.includes("Tables:"), "Analytics context should contain Tables section");
    // Verify common tables in analytics domain if known
});
