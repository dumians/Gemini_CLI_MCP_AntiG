/**
 * Agentic Data Mesh: Knowledge Graph Service
 * Manages the Context & Intent KG for horizontal GraphRAG grounding.
 * In-memory implementation (persistable to Spanner Graph).
 */
import { logger } from './logging_service.js';

class KnowledgeGraphService {
    constructor() {
        this.nodes = new Map(); // id -> node
        this.edges = [];       // array of {from, to, type, properties}
        this.intents = [];     // chronological list of intent node IDs
    }

    /**
     * Registers a new Intent node.
     * @param {string} query The natural language query.
     * @param {string} traceId Transaction trace ID.
     * @returns {string} The node ID.
     */
    createIntentNode(query, traceId) {
        const id = `intent_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const node = {
            id,
            type: 'INTENT',
            properties: {
                query,
                timestamp: new Date().toISOString(),
                traceId
            }
        };
        this.nodes.set(id, node);
        this.intents.push(id);
        logger.log('KGService', `Registered Intent: ${id}`, 'INFO', null, traceId);
        return id;
    }

    /**
     * Registers a Context node (e.g., a Data Product result or Entity state).
     * @param {string} type Type of context (DATA_PRODUCT, ENTITY_LINK).
     * @param {object} properties Metadata properties.
     * @returns {string} The node ID.
     */
    createContextNode(type, properties) {
        const id = `ctx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const node = {
            id,
            type: 'CONTEXT',
            contextType: type,
            properties
        };
        this.nodes.set(id, node);
        return id;
    }

    /**
     * Links two nodes in the KG.
     */
    addEdge(fromId, toId, type, properties = {}) {
        if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
            console.warn(`[KGService] Attempted to link non-existent nodes: ${fromId} -> ${toId}`);
            return;
        }
        this.edges.push({ from: fromId, to: toId, type, properties });
    }

    /**
     * Simple semantic retrieval: finds recent intents that might be related.
     * (Placeholder for vector similarity search).
     */
    findRelatedIntents(query, limit = 3) {
        // In a real implementation, this would use embeddings
        // For now, we return the N most recent intents to provide temporal context
        return this.intents.slice(-limit).map(id => this.nodes.get(id));
    }

    /**
     * Traverses the graph to find grounding evidence for an intent.
     */
    getGroundingPath(intentId) {
        const relatedEdges = this.edges.filter(e => e.from === intentId);
        return relatedEdges.map(e => ({
            relationship: e.type,
            target: this.nodes.get(e.to)
        }));
    }

    /**
     * Returns a horizontal summary of the KG for prompting.
     */
    getHorizontalContextSummary() {
        const recentIntents = this.intents.slice(-5);
        if (recentIntents.length === 0) return "No prior context.";

        let summary = "--- Horizontal Context Intent Graph ---\n";
        recentIntents.forEach(id => {
            const node = this.nodes.get(id);
            summary += `Intent: ${node.properties.query}\n`;
            const evidence = this.getGroundingPath(id);
            evidence.forEach(ev => {
                summary += `  - Linked to ${ev.target.contextType}: ${JSON.stringify(ev.target.properties).substring(0, 100)}...\n`;
            });
        });
        return summary;
    }
}

export const kgService = new KnowledgeGraphService();
