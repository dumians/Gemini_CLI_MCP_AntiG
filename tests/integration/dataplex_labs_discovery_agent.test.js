process.env.NODE_ENV = 'test';
process.env.USE_REAL_CONNECTIONS = 'false';

import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import { kcDiscoveryService } from '../../agent/utils/knowledge_catalog_discovery_service.js';
import { DataplexAgent } from '../../agent/dataplex_agent.js';
import { catalogAgent } from '../../agent/catalog_agent.js';
import { gateway } from '../../agent/utils/one_mcp_gateway.js';

describe('Dataplex Labs Knowledge Catalog Discovery Agent Integration', () => {

    it('1. should perform semantic decomposition and extract predicates from natural language query', async () => {
        const query = "Find customer revenue, churn risk, and billing data in BigQuery and Spanner tables";
        const decomp = await kcDiscoveryService.decomposeQuery(query);

        assert.ok(decomp);
        assert.strictEqual(decomp.originalQuery, query);
        assert.ok(Array.isArray(decomp.variations));
        assert.ok(decomp.variations.length >= 2, "Should produce multiple query variations");
        assert.ok(Array.isArray(decomp.predicates));
        assert.ok(decomp.predicates.includes('type=table'), "Should extract type=table predicate");
        assert.ok(decomp.predicates.includes('system=bigquery') || decomp.predicates.includes('system=spanner'), "Should extract system predicates");
    });

    it('2. should execute multi-search across query variations and return reranked catalog entries', async () => {
        const queries = [
            "customer revenue marketing_edw",
            "spend OR total_amount OR gross_revenue",
            "omnichannel retail sales transaction store"
        ];
        const searchResult = await kcDiscoveryService.multiSearch(queries);

        assert.ok(searchResult);
        assert.ok(Array.isArray(searchResult.results));
        assert.ok(searchResult.results.length > 0, "Should return matching catalog results");
        
        const topResult = searchResult.results[0];
        assert.ok(topResult.name);
        assert.ok(topResult.domain);
        assert.ok(topResult.score !== undefined);
        assert.ok(topResult.score <= 1.0 && topResult.score >= 0);
    });

    it('3. should call lookupContext to retrieve deep lineage and aspect schemas', async () => {
        const batchEntries = [
            "projects/test-project/locations/global/entryGroups/@bigquery/entries/customer_360",
            "projects/test-project/locations/global/entryGroups/@spanner/entries/orders"
        ];
        const contextData = await kcDiscoveryService.lookupContext('global', batchEntries);

        assert.ok(contextData);
        assert.strictEqual(contextData.region, 'global');
        assert.deepStrictEqual(contextData.batchEntries, batchEntries);
        assert.ok(contextData.context && contextData.context.length > 0);
    });

    it('4. should execute end-to-end discovery pipeline with decomposition, multi-search, context lookup and reranking', async () => {
        const query = "Locate all customer profile and loyalty transactions";
        const discovery = await kcDiscoveryService.discoverAssets(query);

        assert.ok(discovery);
        assert.strictEqual(discovery.userQuery, query);
        assert.ok(discovery.decomposition);
        assert.ok(discovery.decomposition.variations.length > 0);
        assert.ok(Array.isArray(discovery.rankedResults));
        assert.ok(discovery.rankedResults.length > 0);
        assert.ok(discovery.contextSummary);
        assert.ok(discovery.timestamp);
    });

    it('5. should expose discovery tools through DataplexAgent', async () => {
        const agent = new DataplexAgent();
        const tools = agent.getTools();
        
        const toolNames = tools.map(t => t.name);
        assert.ok(toolNames.includes('knowledge_catalog_multi_search'));
        assert.ok(toolNames.includes('decompose_and_discover_assets'));
        assert.ok(toolNames.includes('lookup_knowledge_context'));

        const toolRes = await agent.callTool('decompose_and_discover_assets', {
            query: "Show retail transaction inventory"
        }, 'test-trace-id');

        assert.ok(toolRes);
        assert.ok(toolRes.rankedResults.length > 0);
    });

    it('6. should expose discovery tools through CatalogAgent', async () => {
        const tools = catalogAgent.tools;
        assert.ok(typeof tools.knowledge_catalog_multi_search === 'function');
        assert.ok(typeof tools.decompose_and_discover_assets === 'function');
        assert.ok(typeof tools.lookup_knowledge_context === 'function');

        const res = await tools.decompose_and_discover_assets({
            query: "Search for high risk customer churn in CRM"
        });
        assert.ok(res);
        assert.ok(res.rankedResults);
    });

    it('7. should expose and execute discovery tools through GCP One-MCP Gateway', async () => {
        gateway.setMode('unified');
        const tools = await gateway.listTools('Universal', []);
        const toolNames = tools.map(t => t.name);

        assert.ok(toolNames.includes('knowledge_catalog_multi_search'));
        assert.ok(toolNames.includes('decompose_and_discover_assets'));
        assert.ok(toolNames.includes('lookup_knowledge_context'));

        const targetTool = tools.find(t => t.name === 'decompose_and_discover_assets');
        assert.ok(targetTool);

        const execRes = await gateway.callTool(targetTool, {
            query: "Omnichannel inventory status"
        });

        assert.ok(execRes && execRes.content && execRes.content[0]);
        const parsed = JSON.parse(execRes.content[0].text);
        assert.ok(parsed.rankedResults.length > 0);
    });

    after(async () => {
        await gateway.closeAll();
    });
});
