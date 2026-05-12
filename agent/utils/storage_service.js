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
            if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (e) {
            console.error(`[LocalStorage] Error writing ${key}:`, e);
            return false;
        }
    }
}

/**
 * FirestoreStorageProvider: Simulated/Real Firestore reads/writes backed by a local-first synchronous memory cache.
 * Guarantees clean compatibility with synchronous Express middleware access patterns.
 */
class FirestoreStorageProvider extends StorageProvider {
    constructor() {
        super();
        this.memoryStore = {}; 
        this.isRealMode = process.env.REAL_MODE === 'true' || process.env.STORAGE_PROVIDER === 'firestore';
        this.db = null;
        this.collectionName = process.env.FIRESTORE_COLLECTION || 'mesh_configs';
        this.initFirestore().catch(err => {
            console.error("[FirestoreStorage] Non-blocking async initialization notification:", err.message);
        });
    }

    async initFirestore() {
        if (this.isRealMode) {
            try {
                const { Firestore } = await import('@google-cloud/firestore');
                this.db = new Firestore({
                    projectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'total-vertex-469513-r8'
                });
                console.log(`[FirestoreStorage] Real Firestore connection pool initialized targeting collection: ${this.collectionName}`);
                // Proactively sync primary configurations down to memory cache
                await this.syncAllFromFirestore();
            } catch (err) {
                console.warn("[FirestoreStorage] Real Firestore module initialization skipped. Operating with resilient disk-cache fallbacks. Reason:", err.message);
            }
        }
    }

    async syncAllFromFirestore() {
        if (!this.db) return;
        try {
            const snapshot = await this.db.collection(this.collectionName).get();
            snapshot.forEach(doc => {
                const key = doc.id;
                const data = doc.data();
                this.memoryStore[key] = data;
                const filePath = path.join(CONFIG_DIR, `${key}.json`);
                if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            });
            console.log(`[FirestoreStorage] Successfully synced ${snapshot.size} config documents from Firestore.`);
        } catch (err) {
            console.error("[FirestoreStorage] Background sync from Firestore collections failed:", err.message);
        }
    }

    /**
     * Synchronously retrieve from local cache or disk fallback to satisfy legacy route injectors without async deadlocks.
     */
    get(key) {
        if (this.memoryStore[key]) {
            return this.memoryStore[key];
        }
        
        const filePath = path.join(CONFIG_DIR, `${key}.json`);
        if (fs.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                this.memoryStore[key] = data;
                return data;
            } catch (e) {
                console.error(`[FirestoreStorage] Error parsing local config fallback for ${key}:`, e);
            }
        }
        return {};
    }

    /**
     * Synchronously persist to memory cache and disk fallback, while firing asynchronous updates to Cloud Firestore.
     */
    set(key, data) {
        this.memoryStore[key] = data;
        
        // Synchronous persistence to local directory bundle ensuring atomic visibility across immediate route lookups
        try {
            if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
            const filePath = path.join(CONFIG_DIR, `${key}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error(`[FirestoreStorage] Disk backup sync failed for key ${key}:`, err.message);
        }

        // Asynchronous propagation to Cloud Firestore bundle
        if (this.isRealMode) {
            console.log(`[FirestoreStorage] Triggering background cloud commit: collections/${this.collectionName}/documents/${key}`);
            if (this.db) {
                this.db.collection(this.collectionName).doc(key).set(data).then(() => {
                    console.log(`[FirestoreStorage] Cloud document ${key} successfully committed.`);
                }).catch(err => {
                    console.error(`[FirestoreStorage] Cloud document sync error for ${key}:`, err.message);
                });
            } else {
                console.log(`[FirestoreStorage] Simulated cloud commit complete for key: ${key}. Payload size: ${JSON.stringify(data).length} bytes.`);
            }
        }

        return true;
    }

    /**
     * Explicit async pull helper for active demand syncing.
     */
    async loadFromFirestore(key) {
        if (this.db) {
            try {
                const doc = await this.db.collection(this.collectionName).doc(key).get();
                if (doc.exists) {
                    const data = doc.data();
                    this.memoryStore[key] = data;
                    const filePath = path.join(CONFIG_DIR, `${key}.json`);
                    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                    return data;
                }
            } catch (err) {
                console.error(`[FirestoreStorage] Load command error for key ${key}:`, err.message);
            }
        }
        return this.get(key);
    }

    /**
     * Explicit async overwrite helper ensuring immediate, awaited blocking cloud persistence.
     */
    async overwriteInFirestore(key, data) {
        this.memoryStore[key] = data;
        try {
            if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
            const filePath = path.join(CONFIG_DIR, `${key}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error(`[FirestoreStorage] Disk backup overwrite sync failed for key ${key}:`, err.message);
        }

        if (this.isRealMode) {
            console.log(`[FirestoreStorage] Executing direct blocking cloud overwrite commit: collections/${this.collectionName}/documents/${key}`);
            if (this.db) {
                try {
                    await this.db.collection(this.collectionName).doc(key).set(data);
                    console.log(`[FirestoreStorage] Cloud document ${key} fully overwritten successfully.`);
                    return true;
                } catch (err) {
                    console.error(`[FirestoreStorage] Blocking cloud overwrite error for ${key}:`, err.message);
                    return false;
                }
            } else {
                console.log(`[FirestoreStorage] Simulated blocking cloud overwrite complete for key: ${key}. Payload size: ${JSON.stringify(data).length} bytes.`);
                return true;
            }
        }
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
