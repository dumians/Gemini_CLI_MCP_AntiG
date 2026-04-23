import { v1 } from '@google-cloud/dataplex';
import dotenv from 'dotenv';

const { CatalogServiceClient } = v1;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const projectId = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID;
const dataplexLocation = process.env.DATAPLEX_ZONE_ID || 'global';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DataplexIntegration {
    constructor() {
        this.client = (projectId && process.env.NODE_ENV !== 'test') ? new CatalogServiceClient() : null;
        this.simulationMode = true;
        
        if (this.simulationMode) {
            console.error("DataplexServiceClient not initialized or running in test. Running in simulation mode for Dataplex.");
        }
        
        this.syncStatePath = join(__dirname, '../../config/dataplex_sync_state.json');
        this.syncState = { schemaTypesEnsured: false, entries: [] };
        if (fs.existsSync(this.syncStatePath)) {
            try {
                this.syncState = JSON.parse(fs.readFileSync(this.syncStatePath, 'utf8'));
            } catch (e) {}
        }
    }

    _saveSyncState() {
        try {
            fs.writeFileSync(this.syncStatePath, JSON.stringify(this.syncState, null, 2));
        } catch (e) {
            console.error("[Dataplex] Failed to save sync state:", e.message);
        }
    }

    async ensureEntryGroup(entryGroupId) {
        if (this.simulationMode) return;
        
        const parent = `projects/${projectId}/locations/${dataplexLocation}`;
        const entryGroupPath = `${parent}/entryGroups/${entryGroupId}`;
        
        try {
            console.log(`[Dataplex] Checking/Creating Entry Group: ${entryGroupId}`);
            await this.client.createEntryGroup({
                parent: parent,
                entryGroupId: entryGroupId,
                entryGroup: {}
            });
            console.log(`[Dataplex] Created Entry Group: ${entryGroupId}`);
        } catch (error) {
            if (error.code === 6 || error.code === 'ALREADY_EXISTS' || (error.message && error.message.toLowerCase().includes('already exists'))) {
                console.log(`[Dataplex] Entry Group ${entryGroupId} already exists.`);
            } else {
                console.error(`[Dataplex] Error creating Entry Group: ${error.message}`);
                throw error;
            }
        }
    }

    async ensureAspectType(aspectTypeId, metadataTemplate) {
        if (this.simulationMode) return;
        
        const parent = `projects/${projectId}/locations/${dataplexLocation}`;
        const aspectTypePath = `${parent}/aspectTypes/${aspectTypeId}`;
        
        try {
            console.log(`[Dataplex] Checking/Creating Aspect Type: ${aspectTypeId}`);
            const [operation] = await this.client.createAspectType({
                parent: parent,
                aspectTypeId: aspectTypeId,
                aspectType: {
                    description: `Custom aspect type for ${aspectTypeId}`,
                    metadataTemplate: metadataTemplate
                }
            });
            await operation.promise();
            console.log(`[Dataplex] Created Aspect Type: ${aspectTypeId}`);
        } catch (error) {
            if (error.code === 6 || error.code === 'ALREADY_EXISTS' || (error.message && error.message.toLowerCase().includes('already exists'))) {
                console.log(`[Dataplex] Aspect Type ${aspectTypeId} already exists. Attempting update to ensure schema sync.`);
                try {
                    const [updateOperation] = await this.client.updateAspectType({
                        aspectType: {
                            name: aspectTypePath,
                            metadataTemplate: metadataTemplate
                        },
                        updateMask: { paths: ['metadata_template'] }
                    });
                    await updateOperation.promise();
                    console.log(`[Dataplex] Updated Aspect Type: ${aspectTypeId}`);
                } catch (updateError) {
                    console.error(`[Dataplex] Error updating Aspect Type: ${updateError.message}`);
                    // Don't throw if update fails (might be no changes or immutable field issues)
                }
            } else {
                console.error(`[Dataplex] Error creating Aspect Type: ${error.message}`);
                throw error;
            }
        }
    }

    async ensureEntryType(entryTypeId, requiredAspects = []) {
        if (this.simulationMode) return;
        
        const parent = `projects/${projectId}/locations/${dataplexLocation}`;
        
        try {
            console.log(`[Dataplex] Checking/Creating Entry Type: ${entryTypeId}`);
            const [operation] = await this.client.createEntryType({
                parent: parent,
                entryTypeId: entryTypeId,
                entryType: {
                    description: `Custom entry type for ${entryTypeId}`,
                    requiredAspects: requiredAspects.map(type => ({ type }))
                }
            });
            await operation.promise();
            console.log(`[Dataplex] Created Entry Type: ${entryTypeId}`);
        } catch (error) {
            if (error.code === 6 || error.code === 'ALREADY_EXISTS' || (error.message && error.message.toLowerCase().includes('already exists'))) {
                console.log(`[Dataplex] Entry Type ${entryTypeId} already exists.`);
            } else {
                console.error(`[Dataplex] Error creating Entry Type: ${error.message}`);
                throw error;
            }
        }
    }

    async createDataProduct(product) {
        console.log(`[Dataplex] Creating Data Product: ${product.name}`);
        
        if (this.simulationMode) {
            return { success: true, id: product.id || `dataplex-${Date.now()}`, simulated: true };
        }
        
        if (!this.productTypesEnsured) {
            const entryGroupId = 'agentic-mesh-group';
            await this.ensureEntryGroup(entryGroupId);
            
            try {
                const schemaPath = join(__dirname, '../../db-schemas/data_product_aspect_schema.json');
                const schemaContent = fs.readFileSync(schemaPath, 'utf8');
                const schema = JSON.parse(schemaContent);
                
                await this.ensureAspectType('data-product-v4', schema.metadataTemplate);
                await this.ensureEntryType('data-product-v4', [`projects/${projectId}/locations/${dataplexLocation}/aspectTypes/data-product-v4`]);
                this.productTypesEnsured = true;
            } catch (err) {
                console.error("[Dataplex] Failed to load schema or ensure types for Data Product:", err.message);
                // Don't throw to avoid breaking client updates
            }
        }
        
        try {
            const parent = `projects/${projectId}/locations/${dataplexLocation}/entryGroups/${entryGroupId}`;
            
            const [response] = await this.client.createEntry({
                parent: parent,
                entryId: product.id,
                entry: {
                    entryType: `projects/${projectId}/locations/${dataplexLocation}/entryTypes/data-product-v4`,
                    aspects: {
                       "data-product-v4": {
                           "name": product.name,
                           "description": product.description,
                           "owner": product.owner
                       }
                    }
                }
            });
            console.log(`[Dataplex] Successfully created entry: ${response.name}`);
            return { success: true, id: response.name };
            
        } catch (error) {
            console.error(`Error creating data product in Dataplex: ${error.message}`);
            throw error;
        }
    }

    async createDataContract(contract) {
        console.log(`[Dataplex] Creating Data Contract for product: ${contract.product}`);
        
        if (this.simulationMode) {
            return { success: true, id: contract.id || `contract-${Date.now()}`, simulated: true };
        }

        try {
            if (!this.contractTypesEnsured) {
                const entryGroupId = 'agentic-mesh-group';
                await this.ensureEntryGroup(entryGroupId);
                
                try {
                    const schemaPath = join(__dirname, '../../db-schemas/data_contract_aspect_schema.json');
                    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
                    const schema = JSON.parse(schemaContent);
                    
                    await this.ensureAspectType('data-contract-v4', schema.metadataTemplate);
                    await this.ensureEntryType('data-contract-v4', [`projects/${projectId}/locations/${dataplexLocation}/aspectTypes/data-contract-v4`]);
                    this.contractTypesEnsured = true;
                } catch (err) {
                    console.error("[Dataplex] Failed to load schema or ensure types for Data Contract:", err.message);
                }
            }
            
            const parent = `projects/${projectId}/locations/${dataplexLocation}/entryGroups/${entryGroupId}`;
            
            const [response] = await this.client.createEntry({
                parent: parent,
                entryId: contract.id,
                entry: {
                    entryType: `projects/${projectId}/locations/${dataplexLocation}/entryTypes/data-contract-v4`,
                    aspects: {
                       "data-contract-v4": {
                           "product": contract.product,
                           "schema": contract.schema_file,
                           "sla": contract.sla,
                           "privacy": contract.privacy
                       }
                    }
                }
            });
            console.log(`[Dataplex] Successfully created entry: ${response.name}`);
            return { success: true, id: response.name };
            
        } catch (error) {
            console.error(`Error creating data contract in Dataplex: ${error.message}`);
            throw error;
        }
    }

    async createGovernancePolicy(policy) {
        console.log(`[Dataplex] Creating Governance Policy: ${policy.name}`);
        
        if (this.simulationMode) {
            return { success: true, id: policy.id || `policy-${Date.now()}`, simulated: true };
        }

        try {
            if (!this.policyTypesEnsured) {
                const entryGroupId = 'agentic-mesh-group';
                await this.ensureEntryGroup(entryGroupId);
                
                try {
                    const schemaPath = join(__dirname, '../../db-schemas/data_policy_aspect_schema.json');
                    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
                    const schema = JSON.parse(schemaContent);
                    
                    await this.ensureAspectType('data-policy-v4', schema.metadataTemplate);
                    await this.ensureEntryType('data-policy-v4', [`projects/${projectId}/locations/${dataplexLocation}/aspectTypes/data-policy-v4`]);
                    this.policyTypesEnsured = true;
                } catch (err) {
                    console.error("[Dataplex] Failed to load schema or ensure types for Data Policy:", err.message);
                }
            }
            
            const parent = `projects/${projectId}/locations/${dataplexLocation}/entryGroups/${entryGroupId}`;
            
            const [response] = await this.client.createEntry({
                parent: parent,
                entryId: policy.id,
                entry: {
                    entryType: `projects/${projectId}/locations/${dataplexLocation}/entryTypes/data-policy-v4`,
                    aspects: {
                       "data-policy-v4": {
                           "id": policy.id,
                           "name": policy.name,
                           "status": policy.status,
                           "domain": policy.domain,
                           "classification": policy.classification || 'LOW',
                           "dataplexAspect": policy.dataplexAspect || 'default',
                           "maskingRule": policy.maskingRule || 'none'
                       }
                    }
                }
            });
            console.log(`[Dataplex] Successfully created entry: ${response.name}`);
            return { success: true, id: response.name };
            
        } catch (error) {
            console.error(`Error creating data policy in Dataplex: ${error.message}`);
            throw error;
        }
    }

    async createSchemaEntry(sourceId, entity) {
        const entryId = entity.id.replace(/[^a-z0-9-]/g, '-').toLowerCase();
        if (this.syncState.entries.includes(entryId)) {
            return { success: true, id: entryId, cached: true };
        }

        console.log(`[Dataplex] Creating Schema Entry: ${entity.name} (Source: ${sourceId})`);
        
        if (this.simulationMode) {
            return { success: true, id: entity.id || `schema-${Date.now()}`, simulated: true };
        }
        
        if (!this.syncState.schemaTypesEnsured) {
            const entryGroupId = 'agentic-mesh-group';
            await this.ensureEntryGroup(entryGroupId);
            
            try {
                const metadataTemplate = {
                    fields: [
                        { name: 'name', type: 'string' },
                        { name: 'type', type: 'string' },
                        { name: 'attributes', type: 'string' },
                        { name: 'semantic_tags', type: 'string' }
                    ]
                };
                
                await this.ensureAspectType('schema-aspect-v1', metadataTemplate);
                await this.ensureEntryType('schema-aspect-v1', [`projects/${projectId}/locations/${dataplexLocation}/aspectTypes/schema-aspect-v1`]);
                this.syncState.schemaTypesEnsured = true;
                this._saveSyncState();
            } catch (err) {
                console.error("[Dataplex] Failed to ensure types for Schema Entry:", err.message);
            }
        }
        
        try {
            const parent = `projects/${projectId}/locations/${dataplexLocation}/entryGroups/${entryGroupId}`;
            const attributesJson = JSON.stringify(entity.attributes || []);
            const tags = Array.from(new Set(entity.attributes?.map(a => a.semanticTag))).filter(Boolean);
            
            const [response] = await this.client.createEntry({
                parent: parent,
                entryId: entity.id.replace(/[^a-z0-9-]/g, '-').toLowerCase(),
                entry: {
                    entryType: `projects/${projectId}/locations/${dataplexLocation}/entryTypes/schema-aspect-v1`,
                    aspects: {
                       "schema-aspect-v1": {
                           "name": entity.name,
                           "type": entity.type,
                           "attributes": attributesJson,
                           "semantic_tags": JSON.stringify(tags)
                       }
                    }
                }
            });
            console.log(`[Dataplex] Successfully created schema entry: ${response.name}`);
            this.syncState.entries.push(entryId);
            this._saveSyncState();
            return { success: true, id: response.name };
            
        } catch (error) {
            console.error(`Error creating schema entry in Dataplex: ${error.message}`);
            throw error;
        }
    }

    async createLineageProcess(processId, displayName) {

        console.log(`[Dataplex Lineage] Creating Process: ${displayName} (${processId})`);
        if (this.simulationMode) {
            return { success: true, id: processId, simulated: true };
        }
        try {
            console.log(`[Dataplex Lineage] Would call createProcess for ${processId}`);
            return { success: true, id: processId, simulated: true };
        } catch (error) {
            console.error(`Error creating lineage process: ${error.message}`);
            return { success: true, id: processId, simulated: true };
        }
    }

    async createLineageRun(processId, runId) {
        console.log(`[Dataplex Lineage] Creating Run: ${runId} for process ${processId}`);
        if (this.simulationMode) {
            return { success: true, id: runId, simulated: true };
        }
        try {
            console.log(`[Dataplex Lineage] Would call createRun for ${runId}`);
            return { success: true, id: runId, simulated: true };
        } catch (error) {
            console.error(`Error creating lineage run: ${error.message}`);
            return { success: true, id: runId, simulated: true };
        }
    }

    async createLineageEvent(processId, runId, sourceTable, targetTable) {
        console.log(`[Dataplex Lineage] Creating Event: ${sourceTable} -> ${targetTable}`);
        if (this.simulationMode) {
            return { success: true, simulated: true };
        }
        try {
            console.log(`[Dataplex Lineage] Would call createLineageEvent for ${sourceTable} -> ${targetTable}`);
            return { success: true, simulated: true };
        } catch (error) {
            console.error(`Error creating lineage event: ${error.message}`);
            return { success: true, simulated: true };
        }
    }
}

export const dataplex = new DataplexIntegration();
