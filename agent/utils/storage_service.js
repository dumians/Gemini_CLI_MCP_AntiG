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
        this.memoryStore = {}; 
        this.isRealMode = process.env.REAL_MODE === 'true';
    }

    async get(key) {
        if (this.isRealMode) {
            console.log(`[FirestoreStorage] [REAL MODE] Fetching document: collections/configs/documents/${key}`);
            // In a production environment with @google-cloud/firestore:
            // const doc = await this.db.collection('configs').doc(key).get();
            // return doc.data();
            
            const filePath = path.join(CONFIG_DIR, `${key}.json`);
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } else {
            console.log(`[FirestoreStorage] GET ${key} (simulated)`);
        }
        return this.memoryStore[key] || {};
    }

    async set(key, data) {
        if (this.isRealMode) {
            console.log(`[FirestoreStorage] [REAL MODE] Writing document: collections/configs/documents/${key}`);
            console.log(`[FirestoreStorage] [REAL MODE] Payload size: ${JSON.stringify(data).length} bytes`);
            // In a production environment with @google-cloud/firestore:
            // await this.db.collection('configs').doc(key).set(data);
            
            // Persist to CONFIG_DIR to simulate external storage
            if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);
            fs.writeFileSync(path.join(CONFIG_DIR, `${key}.json`), JSON.stringify(data, null, 2));
        } else {
            console.log(`[FirestoreStorage] SET ${key} (simulated)`);
        }
        
        this.memoryStore[key] = data;
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
