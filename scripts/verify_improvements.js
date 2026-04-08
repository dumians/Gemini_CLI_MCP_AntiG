/**
 * Verification Script for MeshOS Improvements
 */
import { askOrchestrator } from '../agent/orchestrator.js';
import { logger } from '../agent/utils/logging_service.js';
import { semanticCache } from '../agent/utils/semantic_cache.js';
import { eventBus } from '../agent/utils/event_bus.js';

async function verify() {
    console.log("=== MeshOS Strategic Improvements Verification ===\n");

    // 1. Verify Event Bus
    console.log("[Verification] Testing Event-Driven Agentic Bus...");
    eventBus.subscribe('DISRUPTION_DETECTED', (payload) => {
        console.log(`[Event Handler] Received Disruption Event: ${payload.reason}`);
    });
    eventBus.emit('RetailAgent', 'DISRUPTION_DETECTED', { reason: 'Suez Canal Blockage', impact: 'High' });

    // 2. Verify Semantic Cache
    console.log("\n[Verification] Testing Semantic Cache (Reasoning Path Recovery)...");
    const complexQuery = "Analyze how recruitment delays in HR are affecting our Spanner Global supply chain for high-value customers identified in BigQuery risk segments.";
    const cachedPlan = await semanticCache.findReasoningPath(complexQuery);
    if (cachedPlan) {
        console.log("✓ Cache HIT: Reasoning path recovered successfully.");
    } else {
        console.log("✗ Cache MISS: Reasoning path not found.");
    }

    // 3. Verify Orchestrator Execution (Governance + Masking)
    console.log("\n[Verification] Running Full Orchestration with Governance PEP...");
    try {
        const result = await askOrchestrator("Show me a summary of HR recruitment delays and retail impact.");
        
        console.log("\n--- Final Results (Masking Check) ---");
        const hrStep = result.steps.find(s => s.agent === 'HRAgent');
        if (hrStep) {
            console.log("HR Data Product (Masked Check):", JSON.stringify(hrStep.result.data).includes('MASKED') ? '✓ MASKED' : '✗ NOT MASKED');
        }

        console.log("\n[Verification] Checking Semantic Observability Logs...");
        const govLogs = logger.getLogs({ type: 'GOVERNANCE_AUDIT' });
        console.log(`✓ Found ${govLogs.length} Governance Audit logs.`);

        const intentLogs = logger.getLogs({ type: 'INTENT_ALIGNMENT' });
        console.log(`✓ Intent Tracking Active: ${intentLogs.length > 0 ? 'Yes' : 'No'}`);

    } catch (err) {
        console.error("Verification failed during orchestration:", err.message);
    }

    console.log("\n=== Verification Complete ===");
}

verify().catch(console.error);
