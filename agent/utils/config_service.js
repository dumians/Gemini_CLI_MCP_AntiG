import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '../../');
const CONFIG_DIR = path.join(ROOT_DIR, 'config');

/**
 * ConfigService: Centralized configuration management for the Agentic Data Mesh.
 * Loads JSON configs and allows environment variable Japanese-style "Overlays".
 */
class ConfigService {
    constructor() {
        this.configs = {};
    }

    /**
     * Loads a configuration file by name (e.g., 'orchestrator').
     * @param {string} componentName 
     */
    getConfig(componentName) {
        if (this.configs[componentName]) {
            return this.configs[componentName];
        }

        const filePath = path.join(CONFIG_DIR, `${componentName}.json`);
        let config = {};

        if (fs.existsSync(filePath)) {
            try {
                const rawData = fs.readFileSync(filePath, 'utf8');
                config = JSON.parse(rawData);
            } catch (error) {
                console.error(`[ConfigService] Error reading config for ${componentName}:`, error);
            }
        }

        // Apply Environment Variable Overrides
        // Logic: CONFIG_{COMPONENT}_{KEY} (e.g., CONFIG_ORCHESTRATOR_MODEL)
        Object.keys(process.env).forEach(envKey => {
            const prefix = `CONFIG_${componentName.toUpperCase()}_`;
            if (envKey.startsWith(prefix)) {
                const key = envKey.replace(prefix, '').toLowerCase();
                config[key] = process.env[envKey];
            }
        });

        this.configs[componentName] = config;
        return config;
    }
}

export const configService = new ConfigService();
