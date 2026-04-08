/**
 * GraphRAG Grounding Utility
 * Synchronizes Graph Traversal results with LLM context for verifiable reasoning.
 * Enhanced with catalog-aware schema context injection.
 */
import { metadataCatalog } from './catalog.js';

export function groundGraphContext(domain, graphResults) {
    if (!graphResults || graphResults.length === 0) return "";

    let groundingStr = `\n[GRAPH GROUNDING - ${domain.toUpperCase()}]\n`;

    // Convert raw graph nodes/edges into a readable knowledge snippet
    graphResults.forEach((result, index) => {
        groundingStr += `Path ${index + 1}: ${formatGraphResult(result)}\n`;
    });

    return groundingStr;
}

function formatGraphResult(result) {
    if (typeof result === 'string') return result;

    const parts = [];
    for (const [key, value] of Object.entries(result)) {
        parts.push(`${key}: ${value}`);
    }
    return parts.join(' -> ');
}

/**
 * Document Grounding Utility (Multi-Modal)
 * Anchors insights in unstructured documents (PDFs, Contracts, Scanned Images).
 */
export function groundDocumentContext(source, contentSnippet) {
    if (!contentSnippet) return "";
    return `\n[DOCUMENT GROUNDING - ${source.toUpperCase()}]\nVerified Content: "${contentSnippet}"\nSource: ${source}\n`;
}

/**
 * Enriches an agent's system instruction with catalog metadata for its domain.
 * Gives the agent awareness of all available tables, columns, and cross-domain links.
 * @param {string} domain - The domain to get context for (e.g., 'Finance', 'Retail')
 * @returns {string} Context string to inject into system instructions
 */
export function groundWithCatalogContext(domain) {
    try {
        return metadataCatalog.getGroundingContext(domain);
    } catch (e) {
        console.error(`[Grounding] Failed to get catalog context for ${domain}:`, e.message);
        return '';
    }
}

export const groundingInstructions = `
When using Graph tools, you MUST ground your final answer in the paths returned.
If a graph traversal shows a connection between Node A and Node B, explicitly state this relationship as a verified fact from the database graph.
If catalog context is provided, use it to understand the full schema landscape (including tables, columns, and graph NODE/EDGE definitions) and identify relevant cross-domain relationships. 
Use the Graphs section in the catalog context to ensure your GQL/PGQL queries use the correct labels and relationships.
`;

