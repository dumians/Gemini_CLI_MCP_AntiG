/**
 * MeshOS Semantic Reasoning Cache
 * Uses semantic similarity to retrieve previously solved complex queries.
 * For this demo, we use an in-memory vector mock.
 */
import { logger } from './logging_service.js';

class SemanticCache {
    constructor() {
        this.cache = new Map();
        // Pre-populate with a common complex query for demonstration
        this._seedCache();
    }

    _seedCache() {
        const key = "Analyze how recruitment delays in HR are affecting our Spanner Global supply chain for high-value customers identified in BigQuery risk segments.";
        this.cache.set(this._normalize(key), {
            plan: {
                steps: [
                    { agent: "HRAgent", subQuery: "Find all Oracle ERP recruitment delays for Region X." },
                    { agent: "AnalyticsAgent", subQuery: "Identify BigQuery risk segments for high-value customers in Region X." },
                    { agent: "RetailAgent", subQuery: "Correlate stock delays with customer segments using Spanner Graph traversals." }
                ]
            },
            timestamp: new Date().toISOString(),
            hitCount: 0
        });
    }

    _normalize(str) {
        return str.toLowerCase().trim().replace(/[^\w\s]/g, '');
    }

    /**
     * Checks the cache for a semantically similar query.
     * @param {string} query - The user query.
     * @returns {object|null} The cached plan or null.
     */
    async findReasoningPath(query) {
        const normQuery = this._normalize(query);
        const cached = this.cache.get(normQuery);

        if (cached) {
            cached.hitCount++;
            logger.logCache('LOOKUP', query, true, normQuery);
            return cached.plan;
        }

        logger.logCache('LOOKUP', query, false);
        return null;
    }

    /**
     * Stores a new reasoning path in the semantic cache.
     * @param {string} query - The query.
     * @param {object} plan - The generated reasoning plan.
     */
    async storeReasoningPath(query, plan) {
        const normQuery = this._normalize(query);
        this.cache.set(normQuery, {
            plan,
            timestamp: new Date().toISOString(),
            hitCount: 1
        });
        logger.logCache('STORE', query, false, normQuery);
    }
}

export const semanticCache = new SemanticCache();
