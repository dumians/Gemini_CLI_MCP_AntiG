/**
 * MeshOS Semantic Reasoning Cache
 * Uses vector embeddings to retrieve previously solved complex queries.
 */
import { logger } from './logging_service.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

class SemanticCache {
    constructor() {
        this.cache = new Map();
        this.genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
        this._seedCache();
    }

    async _getEmbedding(text) {
        const vector = new Array(768).fill(0);
        const clean = text.toLowerCase().replace(/[^\w\s]/g, '');
        for (let i = 0; i < clean.length - 2; i++) {
            const gram = clean.substring(i, i + 3);
            let hash = 0;
            for (let j = 0; j < gram.length; j++) {
                hash = (hash << 5) - hash + gram.charCodeAt(j);
                hash |= 0;
            }
            const idx = Math.abs(hash) % 768;
            vector[idx] += 1;
        }
        return vector;
    }

    async _seedCache() {
        const key = "Analyze how recruitment delays in HR are affecting our Spanner Global supply chain for high-value customers identified in BigQuery risk segments.";
        const embedding = await this._getEmbedding(key);
        
        this.cache.set(this._normalize(key), {
            key,
            embedding,
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

    async findReasoningPath(query) {
        const normQuery = this._normalize(query);
        
        const cachedExact = this.cache.get(normQuery);
        if (cachedExact) {
            cachedExact.hitCount++;
            logger.logCache('LOOKUP_EXACT', query, true, normQuery);
            return cachedExact.plan;
        }

        const queryEmbedding = await this._getEmbedding(query);
        if (queryEmbedding) {
            for (const [key, entry] of this.cache.entries()) {
                if (entry.embedding) {
                    const similarity = this._cosineSimilarity(queryEmbedding, entry.embedding);
                    if (similarity > 0.85) {
                        entry.hitCount++;
                        logger.logCache('LOOKUP_SEMANTIC', query, true, `Similarity: ${similarity.toFixed(2)} against: ${entry.key}`);
                        return entry.plan;
                    }
                }
            }
        }

        logger.logCache('LOOKUP', query, false);
        return null;
    }

    async storeReasoningPath(query, plan) {
        const normQuery = this._normalize(query);
        const embedding = await this._getEmbedding(query);
        
        this.cache.set(normQuery, {
            key: query,
            embedding,
            plan,
            timestamp: new Date().toISOString(),
            hitCount: 1
        });
        logger.logCache('STORE', query, false, normQuery);
    }

    _cosineSimilarity(a, b) {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        return dotProduct / (magnitudeA * magnitudeB);
    }
}

export const semanticCache = new SemanticCache();
