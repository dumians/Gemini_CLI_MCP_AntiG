/**
 * MeshOS Event Bus (Pub/Sub Simulation)
 * Facilitates proactive reasoning by allowing domains to emit events.
 */
import { logger } from './logging_service.js';

class EventBus {
    constructor() {
        this.subscribers = {};
    }

    /**
     * Subscribe to a domain event.
     * @param {string} eventType - The type of event.
     * @param {function} callback - The handler.
     */
    subscribe(eventType, callback) {
        if (!this.subscribers[eventType]) {
            this.subscribers[eventType] = [];
        }
        this.subscribers[eventType].push(callback);
    }

    /**
     * Emit a domain event.
     * @param {string} domain - The emitting domain.
     * @param {string} eventType - The type of event.
     * @param {object} payload - Structured event data.
     */
    emit(domain, eventType, payload) {
        logger.log(domain, `Emitting Event: ${eventType}`, 'INFO', payload);
        
        if (this.subscribers[eventType]) {
            this.subscribers[eventType].forEach(handler => {
                handler(payload);
            });
        }
    }
}

export const eventBus = new EventBus();
