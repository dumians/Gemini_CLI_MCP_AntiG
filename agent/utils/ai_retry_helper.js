/**
 * AI Operation Retry Helper
 * Centralized retry policy with Exponential Backoff for Gemini AI API requests.
 */
import { logger } from './logging_service.js';

/**
 * Executes any AI SDK operation (e.g. generateContent, sendMessage) with transient error retries.
 * @param {Function} operation - The asynchronous AI operation lambda to execute.
 * @param {number} maxRetries - Maximum number of retry attempts.
 * @param {number} initialDelay - Starting delay in milliseconds.
 * @returns {Promise<any>} The AI operation result.
 */
export async function callAiOperationWithRetry(operation, maxRetries = 3, initialDelay = 1000) {
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await operation();
            return result;
        } catch (err) {
            const errStatus = err.status || (err.message && err.message.match(/\b(503|429)\b/) ? parseInt(err.message.match(/\b(503|429)\b/)[0]) : null);
            const isTransient = errStatus === 503 || errStatus === 429 || 
                                err.message?.includes('503') || 
                                err.message?.includes('429') ||
                                err.message?.includes('experiencing high demand') ||
                                err.message?.includes('Service Unavailable');

            if (isTransient && i < maxRetries - 1) {
                logger.log('AIRetryHelper', `Gemini API transient error detected (${errStatus || '503/429'}). Retrying in ${delay}ms (Attempt ${i + 1}/${maxRetries})...`, 'WARNING');
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                logger.log('AIRetryHelper', `Gemini API operation failed permanently: ${err.message}`, 'ERROR');
                throw err;
            }
        }
    }
}
