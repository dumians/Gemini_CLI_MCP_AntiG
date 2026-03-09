/**
 * GraphRAG Grounding Utility
 * Synchronizes Graph Traversal results with LLM context for verifiable reasoning.
 */

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
    // Logic to turn DB-specific graph objects into natural language pointers
    // Example: { source: 'SupplierA', edge: 'HAS_PO', target: 'PO_123' }
    if (typeof result === 'string') return result;

    const parts = [];
    for (const [key, value] of Object.entries(result)) {
        parts.push(`${key}: ${value}`);
    }
    return parts.join(' -> ');
}

export const groundingInstructions = `
When using Graph tools, you MUST ground your final answer in the paths returned.
If a graph traversal shows a connection between Node A and Node B, explicitly state this relationship as a verified fact from the database graph.
`;
