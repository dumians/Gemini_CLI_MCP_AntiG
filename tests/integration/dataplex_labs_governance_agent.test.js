process.env.NODE_ENV = 'test';
process.env.USE_REAL_CONNECTIONS = 'false';

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { governancePropagator } from '../../agent/utils/governance_metadata_propagator.js';
import { documentRAGEngine } from '../../agent/utils/document_rag_engine.js';
import { DataplexAgent } from '../../agent/dataplex_agent.js';
import { metadataCatalog } from '../../agent/utils/catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Dataplex Labs Governance Agent Integration Tests', () => {
    let dataplexAgent;

    before(() => {
        process.env.NODE_ENV = 'test';
        process.env.USE_REAL_CONNECTIONS = 'false';
        metadataCatalog.initialize();
        dataplexAgent = new DataplexAgent();

        try {
            const linksPath = path.join(__dirname, '../../config/glossary_links.json');
            if (fs.existsSync(linksPath)) {
                const links = JSON.parse(fs.readFileSync(linksPath, 'utf8')).filter(l => l.table !== 'campaign_metrics');
                fs.writeFileSync(linksPath, JSON.stringify(links, null, 2));
            }
        } catch (_) {}
    });

    it('1. Document RAG Engine - Ingest and query unstructured governance documents', async () => {
        const testDoc = await documentRAGEngine.ingestDocument({
            title: 'Test Financial Governance Spec',
            content: `
# Table: invoices
Domain: Oracle ERP
Description: Master customer billing invoices ledger.

**Column Definitions**
- invoice_id: STRING. Unique financial invoice document identifier. Policy: Confidential. Remediation: DISTINCT deduplication. Glossary: Invoice Identifier.
- gross_total: FLOAT. Total invoice amount before sales tax. Policy: Financial. Remediation: ROUND(gross_total, 2). Glossary: Gross Revenue.
            `,
            fileName: 'financial_governance_spec.md'
        });

        assert.ok(testDoc);
        assert.ok(testDoc.id);
        assert.strictEqual(testDoc.title, 'Test Financial Governance Spec');

        // Query RAG for invoice_id
        const matches = documentRAGEngine.queryRelevantMetadata({ tableName: 'invoices', columnName: 'invoice_id' });
        assert.ok(matches.length > 0);
        assert.strictEqual(matches[0].column, 'invoice_id');
        assert.ok(matches[0].description.includes('invoice'));

        // Search documents
        const searchRes = documentRAGEngine.searchDocuments('Financial');
        assert.ok(searchRes.length > 0);
    });

    it('2. Estate Dashboard Summary - Calculates gap metrics and trust index', async () => {
        const summary = await governancePropagator.getEstateSummary();
        assert.ok(summary);
        assert.ok(summary.totalSources >= 4);
        assert.ok(summary.totalEntities >= 5);
        assert.ok(summary.totalColumns >= 10);
        assert.ok(typeof summary.documentationCoverage === 'number');
        assert.ok(typeof summary.overallTrustIndex === 'number');
        assert.ok(summary.governanceDocumentsIndexed >= 1);
    });

    it('3. Lineage Description Propagation - Enriched with RAG and SQL logic', async () => {
        const candidates = await governancePropagator.previewPropagation('marketing_edw', 'campaign_metrics');
        assert.ok(Array.isArray(candidates));
        assert.ok(candidates.length > 0);

        const spendCand = candidates.find(c => c["Target Column"] === 'spend');
        assert.ok(spendCand);
        assert.ok(spendCand["Proposed Description"].includes('expenditure') || spendCand["Proposed Description"].includes('Monetary'));
        assert.ok(spendCand.Confidence >= 0.8);

        // Apply descriptions
        const applyRes = await governancePropagator.applyPropagation('marketing_edw', [
            { table: 'campaign_metrics', column: 'spend', description: spendCand["Proposed Description"] }
        ]);
        assert.strictEqual(applyRes.success, true);
        assert.strictEqual(applyRes.count, 1);
    });

    it('4. AI Business Glossary Mapping - High confidence semantic matching and EntryLinks', async () => {
        const recos = await governancePropagator.recommendGlossaryTerms('marketing_edw', 'campaign_metrics');
        assert.ok(Array.isArray(recos));
        assert.ok(recos.length > 0);

        const custReco = recos.find(r => r.Column === 'customer_id' || r.Column === 'spend');
        assert.ok(custReco);
        assert.ok(custReco["Suggested Term"]);
        assert.ok(custReco.Confidence >= 0.85);

        // Apply Glossary EntryLinks
        const applyRes = await governancePropagator.applyGlossaryTerms('marketing_edw', 'campaign_metrics', [
            { column: custReco.Column, term_id: custReco["Term ID"], term_display: custReco["Suggested Term"] }
        ]);
        assert.strictEqual(applyRes.success, true);
    });

    it('5. Policy Tag Propagation - Evaluates straight pull vs calculated and access summaries', async () => {
        const policies = await governancePropagator.previewPolicyTagPropagation('marketing_edw', 'campaign_metrics');
        assert.ok(Array.isArray(policies));
        assert.ok(policies.length >= 2);

        const emailPolicy = policies.find(p => p["Target Column"] === 'email');
        assert.ok(emailPolicy);
        assert.strictEqual(emailPolicy.Logic, 'Straight Pull');
        assert.ok(emailPolicy["Access Summary"].includes('Authorized Readers'));

        // Apply Policy Tags
        const applyRes = await governancePropagator.applyPolicyTags('marketing_edw', [
            { table: 'campaign_metrics', column: 'email', policy_tag: emailPolicy["Policy Tags"] }
        ]);
        assert.strictEqual(applyRes.success, true);
    });

    it('6. Data Trust Center & DQ Propagation - Detects SQL remediations and calculates bonuses', async () => {
        const dqScores = await governancePropagator.propagateDQScores('marketing_edw', 'campaign_metrics');
        assert.ok(Array.isArray(dqScores));
        assert.ok(dqScores.length > 0);

        const spendScore = dqScores.find(s => s.Column === 'spend');
        assert.ok(spendScore);
        assert.ok(spendScore["Trust Score"] >= 0.7);
        assert.ok(spendScore["Remediation Logic"].includes('SAFE_CAST') || spendScore["Remediation Logic"].includes('Standard'));
        assert.ok(['Improving', 'Stable', 'Degrading'].includes(spendScore.Trend));
    });

    it('7. Dataplex Scans Runner - Manages DQ and Profile Scans', async () => {
        const initialScans = await governancePropagator.listDataplexScans();
        assert.ok(Array.isArray(initialScans));
        assert.ok(initialScans.length >= 2);

        const triggeredScan = await governancePropagator.triggerDataplexScan('scan-test-01', 'DATA_QUALITY', 'marketing_edw.campaign_metrics');
        assert.ok(triggeredScan);
        assert.strictEqual(triggeredScan.status, 'PASSED');
        assert.strictEqual(triggeredScan.type, 'DATA_QUALITY');
        assert.ok(triggeredScan.score >= 0.9);
    });

    it('8. DataplexAgent MCP Tools - Invokes all new governance tools seamlessly', async () => {
        const tools = dataplexAgent.getTools();
        const toolNames = tools.map(t => t.name);

        assert.ok(toolNames.includes('scan_metadata_gaps'));
        assert.ok(toolNames.includes('propagate_lineage_descriptions'));
        assert.ok(toolNames.includes('map_ai_business_glossary'));
        assert.ok(toolNames.includes('propagate_policy_tags'));
        assert.ok(toolNames.includes('calculate_data_trust_scores'));
        assert.ok(toolNames.includes('ingest_governance_document'));
        assert.ok(toolNames.includes('query_governance_rag'));
        assert.ok(toolNames.includes('manage_dataplex_scans'));
        assert.ok(toolNames.includes('get_estate_governance_summary'));

        // Execute scan_metadata_gaps via tool
        const gapsRes = await dataplexAgent.callTool('scan_metadata_gaps', { sourceId: 'spanner' }, 'test-trace');
        assert.ok(Array.isArray(gapsRes));

        // Execute get_estate_governance_summary via tool
        const estateRes = await dataplexAgent.callTool('get_estate_governance_summary', {}, 'test-trace');
        assert.ok(estateRes.totalEntities > 0);
    });
});
