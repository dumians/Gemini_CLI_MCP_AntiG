import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { metadataCatalog } from '../../agent/utils/catalog.js';
import { catalogAgent } from '../../agent/catalog_agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('MetadataCatalog - Generate Valid W3C / Schema.org JSON-LD Open Knowledge Graph', () => {
    const okGraph = metadataCatalog.getOpenKnowledgeGraph();
    assert.ok(okGraph['@context'], 'Must contain Linked Data @context');
    assert.strictEqual(okGraph['@context']['schema'], 'https://schema.org/');
    assert.strictEqual(okGraph['@context']['dcat'], 'http://www.w3.org/ns/dcat#');
    assert.ok(Array.isArray(okGraph['@graph']), '@graph must be an array of semantic entities');
    assert.ok(okGraph['@graph'].length > 0, 'Graph must contain discovered sources, tables, and links');

    // Verify DataService nodes and Dataset nodes exist
    const hasDataService = okGraph['@graph'].some(node =>
        Array.isArray(node['@type']) && node['@type'].includes('dcat:DataService')
    );
    const hasDataset = okGraph['@graph'].some(node =>
        Array.isArray(node['@type']) && node['@type'].includes('schema:Dataset')
    );
    assert.ok(hasDataService, 'Must represent data sources as DCAT DataService nodes');
    assert.ok(hasDataset, 'Must represent data entities as Schema.org Dataset nodes');
});

test('MetadataCatalog - Export DCAT v3 Compliant Catalog Overview', () => {
    const dcat = metadataCatalog.exportDcatCatalog();
    assert.strictEqual(dcat.dcatVersion, '3.0');
    assert.strictEqual(dcat.format, 'JSON-LD / Schema.org');
    assert.ok(dcat.datasetCount > 0);
    assert.ok(Array.isArray(dcat.domainServices));
    assert.ok(dcat.openKnowledgeGraph);
});

test('Dataplex Aspect Schema - Dataplex Data Product Open Knowledge Validation', () => {
    const schemaPath = path.resolve(__dirname, '../../db-schemas/data_product_aspect_schema.json');
    const schemaContent = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const fieldNames = schemaContent.metadataTemplate.recordFields.map(f => f.name);

    assert.ok(fieldNames.includes('linked_data_uri'), 'Aspect schema must support linked_data_uri');
    assert.ok(fieldNames.includes('dcat_type'), 'Aspect schema must support dcat_type');
    assert.ok(fieldNames.includes('semantic_terms'), 'Aspect schema must support semantic_terms');
});

test('CatalogAgent - Open Knowledge Tool Registration', () => {
    assert.strictEqual(typeof catalogAgent.tools.get_open_knowledge_graph, 'function');
    assert.strictEqual(typeof catalogAgent.tools.export_dcat_catalog, 'function');

    const openKgResult = catalogAgent.tools.get_open_knowledge_graph();
    assert.ok(openKgResult['@context']);
    const dcatResult = catalogAgent.tools.export_dcat_catalog();
    assert.strictEqual(dcatResult.dcatVersion, '3.0');
});
