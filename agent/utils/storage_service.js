import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '../../');
const CONFIG_DIR = path.join(ROOT_DIR, 'config');

/**
 * StorageProvider Interface
 * Methods: get(key), set(key, data)
 */
class StorageProvider {
    get(key) { throw new Error("Method not implemented"); }
    set(key, data) { throw new Error("Method not implemented"); }
}

/**
 * LocalStorageProvider: Reads/Writes to local config JSON files.
 */
class LocalStorageProvider extends StorageProvider {
    get(key) {
        const filePath = path.join(CONFIG_DIR, `${key}.json`);
        if (!fs.existsSync(filePath)) return {};
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`[LocalStorage] Error reading ${key}:`, e);
            return {};
        }
    }

    set(key, data) {
        const filePath = path.join(CONFIG_DIR, `${key}.json`);
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (e) {
            console.error(`[LocalStorage] Error writing ${key}:`, e);
            return false;
        }
    }
}

/**
 * FirestoreStorageProvider: Simulated/Real Firestore reads/writes.
 */
class FirestoreStorageProvider extends StorageProvider {
    constructor() {
        super();
        this.memoryStore = {}; // Memory fallback if Firestore is unavailable
    }

    get(key) {
        console.log(`[FirestoreStorage] GET ${key} (simulated)`);
        // In a real implementation: `const doc = await db.collection('configs').doc(key).get(); return doc.data();`
        const filePath = path.join(CONFIG_DIR, `${key}.json`);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8')); // Read initial from local as bootstrap
        }
        return this.memoryStore[key] || {};
    }

    set(key, data) {
        console.log(`[FirestoreStorage] SET ${key} (simulated)`);
        this.memoryStore[key] = data;
        // In a real implementation: `await db.collection('configs').doc(key).set(data);`
        return true;
    }
}

/**
 * StorageProviderFactory
 */
export class StorageProviderFactory {
    static getProvider() {
        const mode = process.env.STORAGE_PROVIDER || 'local';
        if (mode === 'firestore') {
            return new FirestoreStorageProvider();
        }
        return new LocalStorageProvider();
    }
}

export const storageProvider = StorageProviderFactory.getProvider();
