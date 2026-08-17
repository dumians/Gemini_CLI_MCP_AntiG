import { test } from 'node:test';
import assert from 'node:assert';
import { knowledgeCatalogService } from '../../agent/utils/knowledge_catalog_service.js';
import { discoveryService } from '../../agent/utils/discovery_service.js';
import { catalogAgent } from '../../agent/catalog_agent.js';

test('KnowledgeCatalog - Aspect Types Registry', () => {
    const aspectTypes = knowledgeCatalogService.getAspectTypes();
    assert.ok(aspectTypes.governance, 'Must have governance aspect type');
    assert.ok(aspectTypes.data_quality, 'Must have data_quality aspect type');
    assert.ok(aspectTypes.security_privacy, 'Must have security_privacy aspect type');
    assert.ok(aspectTypes.data_product_contract, 'Must have data_product_contract aspect type');
});

test('KnowledgeCatalog - Entity Aspects Retrieval & Update', () => {
    const aspects = knowledgeCatalogService.getEntityAspects('oracle.suppliers');
    assert.ok(aspects.governance, 'Must have governance aspect for oracle.suppliers');
    assert.strictEqual(aspects.governance.classification, 'Confidential');

    // Update aspect
    const updateRes = knowledgeCatalogService.updateEntityAspect('oracle.suppliers', 'governance', {
        classification: 'Confidential',
        retentionPeriod: '7 Years'
    });
    assert.ok(updateRes.success);
    assert.strictEqual(updateRes.aspects.governance.classification, 'Confidential');
});

test('KnowledgeCatalog - Aspect-Based Advanced Search Engine', () => {
    // 1. Free text search
    const textSearch = knowledgeCatalogService.searchCatalog({ query: 'suppliers' });
    assert.ok(textSearch.entries.length > 0);
    assert.strictEqual(textSearch.entries[0].name.toLowerCase(), 'suppliers');

    // 2. Aspect predicate search
    const aspectSearch = knowledgeCatalogService.searchCatalog({ aspectFilter: 'aspect:governance.classification=Confidential' });
    assert.ok(aspectSearch.entries.length > 0);
    const hasConfidential = aspectSearch.entries.every(e => e.aspects?.governance?.classification?.toLowerCase().includes('confidential'));
    assert.ok(hasConfidential, 'All returned entries must match aspect filter');

    // 3. Domain filter search
    const domainSearch = knowledgeCatalogService.searchCatalog({ domain: 'ERP' });
    assert.ok(domainSearch.entries.length > 0);
});

test('DiscoveryService - Autonomous Metadata Discovery & PII Profiling', async () => {
    const scanResults = await discoveryService.runDiscoveryScan();
    assert.ok(scanResults.entitiesProfiled > 0, 'Must profile entities');
    assert.ok(scanResults.attributesProfiled > 0, 'Must profile attributes');
    assert.ok(Array.isArray(scanResults.piiFindings), 'Must return PII findings array');
    assert.ok(scanResults.piiFindings.length > 0, 'Must detect PII attributes in mock/schema data');

    // Check PII rule classifications
    const piiColumns = scanResults.piiFindings.map(f => f.columnName.toLowerCase());
    assert.ok(piiColumns.some(c => c.includes('card') || c.includes('email') || c.includes('salary') || c.includes('phone')), 'Must identify sensitive fields');
});

test('KnowledgeCatalog - Governance Compliance Audit & Remediation', async () => {
    const audit = knowledgeCatalogService.auditMeshGovernance();
    assert.ok(typeof audit.complianceScorePct === 'number');
    assert.ok(audit.totalChecks > 0);
    assert.ok(Array.isArray(audit.issues));

    // Test remediation execution
    const remRes = await knowledgeCatalogService.executeRemediation(['ALL']);
    assert.ok(remRes.success);
    assert.ok(typeof remRes.remediatedCount === 'number');
});

test('CatalogAgent - New GCP Knowledge Catalog Tools Registered', () => {
    assert.strictEqual(typeof catalogAgent.tools.search_knowledge_catalog, 'function');
    assert.strictEqual(typeof catalogAgent.tools.run_metadata_discovery, 'function');
    assert.strictEqual(typeof catalogAgent.tools.get_entity_aspects, 'function');
    assert.strictEqual(typeof catalogAgent.tools.audit_mesh_governance, 'function');
});
