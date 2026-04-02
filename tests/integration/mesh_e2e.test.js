/**
 * Mesh End-to-End Integration Test Suite
 * Validates cross-domain logic and Knowledge Graph lineage.
 */
import test from "node:test";
import assert from "node:assert";
import dotenv from "dotenv";

import { kgService } from "../../agent/utils/kg_service.js";
import { metadataCatalog } from "../../agent/utils/catalog.js";
import { validateDataProduct } from "../../agent/utils/catalog.js";

dotenv.config();

test("Mesh Verification: Knowledge Graph Lineage Logic", async (t) => {
    metadataCatalog.initialize();
    
    // Reset KG
    kgService.intents = [];
    kgService.context = [];
    kgService.edges = [];

    const traceId = "test-verification-trace";
    const query = "Analyze logistics impact on finance.";
    
    // 1. Simulate Orchestrator starting
    const intentId = kgService.createIntentNode(query, traceId);
    
    // 2. Simulate Agent returning a Data Product
    const mockDataProduct = {
        domain: "Spanner Retail",
        data: "Bottleneck at port X",
        metadata: { confidence: 0.95, source: "Spanner" },
        insights: "Delay expected."
    };
    
    const validatedProduct = validateDataProduct(mockDataProduct, "RetailAgent");
    
    // 3. Simulate Orchestrator linking context
    const ctxId = kgService.createContextNode("DATA_PRODUCT", {
        agent: "RetailAgent",
        domain: "Spanner Retail",
        confidence: validatedProduct.metadata.confidence,
        traceId
    });
    kgService.addEdge(intentId, ctxId, "SATISFIED_BY", { subQuery: "Logistics status" });

    // 4. Assertions
    assert.strictEqual(kgService.intents.length, 1);
    assert.strictEqual(kgService.edges.length, 1);
    assert.strictEqual(kgService.edges[0].type, "SATISFIED_BY");
    
    const summary = kgService.getHorizontalContextSummary();
    assert.ok(summary.includes("RetailAgent"), "Summary must reflect horizontal context");
    
    console.log("PASS: Knowledge Graph Lineage logic verified.");
});

test("Mesh Verification: Data Product Consumer View", async (t) => {
    // Consumer expects specific fields for 'trust but verify'
    const product = {
        domain: "Oracle ERP",
        data: { risk: "high" },
        metadata: { confidence: 0.88, source: "Oracle" },
        insights: "Financial risk elevated due to retail delay."
    };
    
    const validated = validateDataProduct(product, "FinancialAgent");
    
    assert.ok(validated.insights, "Product must contain insights for synthesis");
    assert.ok(validated.metadata.confidence >= 0, "Product must have confidence score");
    assert.strictEqual(validated.domain, "Oracle ERP");
    
    console.log("PASS: Data Product consumer view verified.");
});
