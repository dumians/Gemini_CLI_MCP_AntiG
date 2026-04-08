import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { StorageProviderFactory } from '../agent/utils/storage_service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '../');
const CONFIG_DIR = path.join(ROOT_DIR, 'config');

async function run() {
    // Force STORAGE_PROVIDER to 'firestore' for initialization to ensure we use the firestore provider
    process.env.STORAGE_PROVIDER = 'firestore';
    
    const provider = StorageProviderFactory.getProvider();
    console.log(`[InitFirestore] Initializing StorageProvider in ${process.env.STORAGE_PROVIDER} mode...\n`);

    const configs = [
        'data_sources',
        'data_products',
        'data_contracts',
        'agents',
        'lineage',
        'metrics',
        'policies'
    ];

    for (const key of configs) {
        const filePath = path.join(CONFIG_DIR, `${key}.json`);
        if (!fs.existsSync(filePath)) {
            console.warn(`[InitFirestore] Skipping ${key}.json (file not found)`);
            continue;
        }

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`[InitFirestore] Pushing ${key} to StorageProvider...`);
            await provider.set(key, data);
            console.log(`[InitFirestore] ✓ Successfully initialized ${key}\n`);
        } catch (error) {
            console.error(`[InitFirestore] ✗ Failed to parse or set ${key}: ${error.message}\n`);
        }
    }

    console.log(`[InitFirestore] Initialization complete!`);
}

run().catch(console.error);
