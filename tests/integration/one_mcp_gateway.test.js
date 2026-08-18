process.env.NODE_ENV = 'test';
process.env.USE_REAL_CONNECTIONS = 'false';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { gateway } from '../../agent/utils/one_mcp_gateway.js';

describe('GCP One-MCP Unified Gateway & Multi-Service Integration Tests', () => {

    test('1. Gateway initializes with unified mode support and status reporting', async () => {
        const initialMode = gateway.getMode();
        assert.ok(['unified', 'microservices', 'local', 'toolbox'].includes(initialMode), `Mode should be valid: ${initialMode}`);

        // Set to unified mode
        const switchRes = gateway.setMode('unified');
        assert.strictEqual(switchRes.success, true);
        assert.strictEqual(gateway.getMode(), 'unified');

        const status = await gateway.getGatewayStatus();
        assert.strictEqual(status.status, 'ONLINE');
        assert.strictEqual(status.mode, 'unified');
        assert.strictEqual(status.gcpOneMcpEnabled, true);
        assert.ok(status.supportedServices.length >= 5, 'Should support at least 5 enterprise GCP services');
    });

    test('2. Unified GCP One-MCP lists and scopes tools for BigQuery Analytics domain', async () => {
        gateway.setMode('unified');
        const bqTools = await gateway.listTools('BigQuery Analytics', []);
        assert.ok(bqTools.length > 0, 'BigQuery domain should receive tools from GCP One-MCP');

        const toolNames = bqTools.map(t => t.name);
        assert.ok(toolNames.some(n => n.includes('bigquery') || n.includes('alloydb')), 'Should contain BigQuery or AlloyDB tools');
        assert.strictEqual(bqTools[0]._serverName, 'gcp-one-mcp');
    });

    test('3. Unified GCP One-MCP lists and scopes tools for Spanner Retail domain', async () => {
        gateway.setMode('unified');
        const spannerTools = await gateway.listTools('Spanner Retail', []);
        assert.ok(spannerTools.length > 0, 'Spanner domain should receive tools from GCP One-MCP');

        const toolNames = spannerTools.map(t => t.name);
        assert.ok(toolNames.some(n => n.includes('spanner')), 'Should contain Spanner tools');
    });

    test('4. Unified GCP One-MCP lists and scopes tools for Oracle ERP domain', async () => {
        gateway.setMode('unified');
        const oracleTools = await gateway.listTools('Oracle ERP', []);
        assert.ok(oracleTools.length > 0, 'Oracle domain should receive tools from GCP One-MCP');

        const toolNames = oracleTools.map(t => t.name);
        assert.ok(toolNames.some(n => n.includes('oracle')), 'Should contain Oracle tools');
    });

    test('5. Unified GCP One-MCP lists all tools for Universal / Cross-Domain scope', async () => {
        gateway.setMode('unified');
        const universalTools = await gateway.listTools('Universal', []);
        assert.ok(universalTools.length >= 10, 'Universal domain should have access to all unified MCP tools');

        const toolNames = universalTools.map(t => t.name);
        assert.ok(toolNames.includes('get_gcp_one_mcp_catalog'), 'Should contain catalog summary tool');
        assert.ok(toolNames.includes('get_gcp_services_health'), 'Should contain service health check tool');
    });

    test('6. Execute get_gcp_one_mcp_catalog tool via One-MCP Gateway', async () => {
        gateway.setMode('unified');
        const universalTools = await gateway.listTools('Universal', []);
        const catalogTool = universalTools.find(t => t.name === 'get_gcp_one_mcp_catalog');
        assert.ok(catalogTool, 'get_gcp_one_mcp_catalog tool must exist');

        const result = await gateway.callTool(catalogTool, {});
        assert.ok(result && result.content && result.content[0], 'Result should contain text content');
        const parsed = JSON.parse(result.content[0].text);
        assert.strictEqual(parsed.gateway, 'GCP One MCP Unified Service');
        assert.ok(parsed.totalToolsCount >= 10, 'Catalog should list all tools');
    });

    test('7. Execute query_bigquery tool via One-MCP Gateway', async () => {
        gateway.setMode('unified');
        const bqTools = await gateway.listTools('BigQuery Analytics', []);
        const bqQueryTool = bqTools.find(t => t.name === 'query_bigquery');
        assert.ok(bqQueryTool, 'query_bigquery tool must exist');

        const result = await gateway.callTool(bqQueryTool, { query: 'SELECT * FROM marketing_edw.customer_segments LIMIT 5' });
        assert.ok(result && result.content && result.content[0]);
        assert.ok(result.content[0].text.length > 0);
    });

    test('8. Execute query_spanner_sql tool via One-MCP Gateway', async () => {
        gateway.setMode('unified');
        const spannerTools = await gateway.listTools('Spanner Retail', []);
        const spannerTool = spannerTools.find(t => t.name === 'query_spanner_sql');
        assert.ok(spannerTool, 'query_spanner_sql tool must exist');

        const result = await gateway.callTool(spannerTool, { query: 'SELECT * FROM Inventory WHERE stock_quantity < 2000' });
        assert.ok(result && result.content && result.content[0]);
        assert.ok(result.content[0].text.length > 0);
    });

    test('9. Execute query_oracle_sql tool via One-MCP Gateway', async () => {
        gateway.setMode('unified');
        const oracleTools = await gateway.listTools('Oracle ERP', []);
        const oracleTool = oracleTools.find(t => t.name === 'query_oracle_sql');
        assert.ok(oracleTool, 'query_oracle_sql tool must exist');

        const result = await gateway.callTool(oracleTool, { query: 'SELECT * FROM ERP_SUPPLIERS' });
        assert.ok(result && result.content && result.content[0]);
        assert.ok(result.content[0].text.length > 0);
    });

    test('10. Gateway mode toggle transitions cleanly between unified and microservices', async () => {
        const switch1 = gateway.setMode('microservices');
        assert.strictEqual(switch1.mode, 'microservices');
        assert.strictEqual(gateway.getMode(), 'microservices');

        const switch2 = gateway.setMode('unified');
        assert.strictEqual(switch2.mode, 'unified');
        assert.strictEqual(gateway.getMode(), 'unified');
    });

    after(async () => {
        await gateway.closeAll();
    });
});
