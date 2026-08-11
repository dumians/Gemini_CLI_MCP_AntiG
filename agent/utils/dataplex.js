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
        this.simulationMode = (process.env.DATAPLEX_SIMULATION_MODE === 'true' || !projectId || process.env.NODE_ENV === 'test');
        
        if (this.simulationMode) {
            console.error("DataplexServiceClient running in simulation mode for Dataplex.");
        } else {
            console.error("DataplexServiceClient initialized. Running in REAL integration mode.");
        }
        
        this.syncStatePath = join(__dirname, '../../config/dataplex_sync_state.json');
        this.syncState = { schemaTypesEnsured: false, entries: [], entryGroups: [], aspectTypes: [], entryTypes: [] };
        if (fs.existsSync(this.syncStatePath)) {
            try {
                const parsed = JSON.parse(fs.readFileSync(this.syncStatePath, 'utf8'));
                this.syncState = {
                    schemaTypesEnsured: parsed.schemaTypesEnsured || false,
                    entries: parsed.entries || [],
                    entryGroups: parsed.entryGroups || [],
                    aspectTypes: parsed.aspectTypes || [],
                    entryTypes: parsed.entryTypes || []
                };
            } catch (e) {}
        }
    }

    _getEntryGroupId(domain) {
        if (!domain) return 'agentic-mesh-group';
        return `domain-${domain.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    }

    _getSourceDomain(sourceId) {
        try {
            const dsPath = join(__dirname, '../../config/data_sources.json');
            if (fs.existsSync(dsPath)) {
                const dataSourcesConfig = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
                if (dataSourcesConfig.sources && dataSourcesConfig.sources[sourceId]) {
                    return dataSourcesConfig.sources[sourceId].domain;
                }
            }
        } catch (e) {
            console.error("[Dataplex] Failed to resolve source domain:", e.message);
        }
        return 'Analytics'; // Default fallback
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
        if (this.syncState.entryGroups.includes(entryGroupId)) {
            console.log(`[Dataplex] Entry Group ${entryGroupId} (cached) already exists.`);
            return;
        }
        
        const parent = `projects/${projectId}/locations/${dataplexLocation}`;
        
        try {
            console.log(`[Dataplex] Checking/Creating Entry Group: ${entryGroupId}`);
            const [operation] = await this.client.createEntryGroup({
                parent: parent,
                entryGroupId: entryGroupId,
                entryGroup: {}
            });
            await operation.promise();
            console.log(`[Dataplex] Created Entry Group: ${entryGroupId}`);
            this.syncState.entryGroups.push(entryGroupId);
            this._saveSyncState();
        } catch (error) {
            if (error.code === 6 || error.code === 'ALREADY_EXISTS' || (error.message && error.message.toLowerCase().includes('already exists'))) {
                console.log(`[Dataplex] Entry Group ${entryGroupId} already exists.`);
                this.syncState.entryGroups.push(entryGroupId);
                this._saveSyncState();
            } else {
                console.log(`[Dataplex Fallback] Group ${entryGroupId} create skipped due to: ${error.message}`);
                this.syncState.entryGroups.push(entryGroupId);
            }
        }
    }

    async ensureAspectType(aspectTypeId, metadataTemplate) {
        if (this.simulationMode) return;
        if (this.syncState.aspectTypes.includes(aspectTypeId)) {
            console.log(`[Dataplex] Aspect Type ${aspectTypeId} (cached) already exists.`);
            return;
        }
        
        const parent = `projects/${projectId}/locations/global`;
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
            this.syncState.aspectTypes.push(aspectTypeId);
            this._saveSyncState();
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
                }
                this.syncState.aspectTypes.push(aspectTypeId);
                this._saveSyncState();
            } else {
                console.log(`[Dataplex Fallback] Aspect Type ${aspectTypeId} create skipped due to: ${error.message}`);
                this.syncState.aspectTypes.push(aspectTypeId);
            }
        }
    }

    async ensureEntryType(entryTypeId, requiredAspects = []) {
        if (this.simulationMode) return;
        if (this.syncState.entryTypes.includes(entryTypeId)) {
            console.log(`[Dataplex] Entry Type ${entryTypeId} (cached) already exists.`);
            return;
        }
        
        const parent = `projects/${projectId}/locations/global`;
        
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
            this.syncState.entryTypes.push(entryTypeId);
            this._saveSyncState();
        } catch (error) {
            if (error.code === 6 || error.code === 'ALREADY_EXISTS' || (error.message && error.message.toLowerCase().includes('already exists'))) {
                console.log(`[Dataplex] Entry Type ${entryTypeId} already exists.`);
                this.syncState.entryTypes.push(entryTypeId);
                this._saveSyncState();
            } else {
                console.log(`[Dataplex Fallback] Entry Type ${entryTypeId} create skipped due to: ${error.message}`);
                this.syncState.entryTypes.push(entryTypeId);
            }
        }
    }

    async createDataProduct(product) {
        console.log(`[Dataplex] Creating Data Product: ${product.name} (Domain: ${product.domain})`);
        
        if (this.simulationMode) {
            return { success: true, id: product.id || `dataplex-${Date.now()}`, simulated: true };
        }
        
        const entryGroupId = this._getEntryGroupId(product.domain);
        await this.ensureEntryGroup(entryGroupId);
        
        if (!this.productTypesEnsured) {
            try {
                const schemaPath = join(__dirname, '../../db-schemas/data_product_aspect_schema.json');
                const schemaContent = fs.readFileSync(schemaPath, 'utf8');
                const schema = JSON.parse(schemaContent);
                
                await this.ensureAspectType('data-product-v4', schema.metadataTemplate);
                await this.ensureEntryType('data-product-v4', [`projects/${projectId}/locations/global/aspectTypes/data-product-v4`]);
                this.productTypesEnsured = true;
            } catch (err) {
                console.error("[Dataplex] Failed to load schema or ensure types for Data Product:", err.message);
                // Don't throw to avoid breaking client updates
            }
        }
        
        try {
            const parent = `projects/${projectId}/locations/${dataplexLocation}/entryGroups/${entryGroupId}`;
            
            const request = {
                parent: parent,
                entryId: product.id,
                entry: {
                    entryType: `projects/${projectId}/locations/global/entryTypes/data-product-v4`,
                    aspects: {
                       [`${projectId}.global.data-product-v4`]: {
                           data: toProtobufStruct({
                               "name": product.name,
                               "description": product.description,
                               "owner": product.owner
                           })
                       }
                    }
                }
            };
            console.log("[Dataplex Debug] Calling createEntry with request:", JSON.stringify(request, null, 2));
            const [response] = await this.client.createEntry(request);
            console.log(`[Dataplex] Successfully created entry: ${response.name}`);
            return { success: true, id: response.name };
            
        } catch (error) {
            if (error.code === 6 || (error.message && error.message.toLowerCase().includes('already exists'))) {
                console.log(`[Dataplex] Data Product entry ${product.id} already exists.`);
                return { success: true, id: `projects/${projectId}/locations/${dataplexLocation}/entryGroups/${entryGroupId}/entries/${product.id}` };
            }
            console.error(`Error creating data product in Dataplex: ${error.message}`);
            throw error;
        }
    }

    async createDataContract(contract) {
        console.log(`[Dataplex] Creating Data Contract for product: ${contract.product} (Domain: ${contract.domain})`);
        
        if (this.simulationMode) {
            return { success: true, id: contract.id || `contract-${Date.now()}`, simulated: true };
        }

        const entryGroupId = this._getEntryGroupId(contract.domain);
        await this.ensureEntryGroup(entryGroupId);

        try {
            if (!this.contractTypesEnsured) {
                try {
                    const schemaPath = join(__dirname, '../../db-schemas/data_contract_aspect_schema.json');
                    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
                    const schema = JSON.parse(schemaContent);
                    
                    await this.ensureAspectType('data-contract-v4', schema.metadataTemplate);
                    await this.ensureEntryType('data-contract-v4', [`projects/${projectId}/locations/global/aspectTypes/data-contract-v4`]);
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
                     entryType: `projects/${projectId}/locations/global/entryTypes/data-contract-v4`,
                     aspects: {
                        [`${projectId}.global.data-contract-v4`]: {
                            data: toProtobufStruct({
                                "product": contract.product,
                                "schema": contract.schema_file || "composite",
                                "sla": contract.sla,
                                "privacy": contract.privacy
                            })
                        }
                     }
                 }
             });
             console.log(`[Dataplex] Successfully created entry: ${response.name}`);
             return { success: true, id: response.name };
             
         } catch (error) {
             if (error.code === 6 || (error.message && error.message.toLowerCase().includes('already exists'))) {
                 console.log(`[Dataplex] Data Contract entry ${contract.id} already exists.`);
                 return { success: true, id: `projects/${projectId}/locations/${dataplexLocation}/entryGroups/${entryGroupId}/entries/${contract.id}` };
             }
             console.error(`Error creating data contract in Dataplex: ${error.message}`);
             throw error;
         }
    }

    async createGovernancePolicy(policy) {
        console.log(`[Dataplex] Creating Governance Policy: ${policy.name} (Domain: ${policy.domain})`);
        
        if (this.simulationMode) {
            return { success: true, id: policy.id || `policy-${Date.now()}`, simulated: true };
        }

        const entryGroupId = this._getEntryGroupId(policy.domain);
        await this.ensureEntryGroup(entryGroupId);

        try {
            if (!this.policyTypesEnsured) {
                try {
                    const schemaPath = join(__dirname, '../../db-schemas/data_policy_aspect_schema.json');
                    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
                    const schema = JSON.parse(schemaContent);
                    
                    await this.ensureAspectType('data-policy-v4', schema.metadataTemplate);
                    await this.ensureEntryType('data-policy-v4', [`projects/${projectId}/locations/global/aspectTypes/data-policy-v4`]);
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
                     entryType: `projects/${projectId}/locations/global/entryTypes/data-policy-v4`,
                     aspects: {
                        [`${projectId}.global.data-policy-v4`]: {
                            data: toProtobufStruct({
                                "id": policy.id,
                                "name": policy.name,
                                "status": policy.status,
                                "domain": policy.domain,
                                "classification": policy.classification || 'LOW',
                                "dataplexAspect": policy.dataplexAspect || 'default',
                                "maskingRule": policy.maskingRule || 'none'
                            })
                        }
                     }
                 }
             });
             console.log(`[Dataplex] Successfully created entry: ${response.name}`);
             return { success: true, id: response.name };
             
         } catch (error) {
             if (error.code === 6 || (error.message && error.message.toLowerCase().includes('already exists'))) {
                 console.log(`[Dataplex] Governance Policy entry ${policy.id} already exists.`);
                 return { success: true, id: `projects/${projectId}/locations/${dataplexLocation}/entryGroups/${entryGroupId}/entries/${policy.id}` };
             }
             console.error(`Error creating data policy in Dataplex: ${error.message}`);
             throw error;
         }
    }

    async createSchemaEntry(sourceId, entity) {
        const entryId = entity.id.replace(/[^a-z0-9-]/g, '-').toLowerCase();
        if (this.syncState.entries.includes(entryId)) {
            return { success: true, id: entryId, cached: true };
        }

        const domain = entity.domain || this._getSourceDomain(sourceId);
        console.log(`[Dataplex] Creating Schema Entry: ${entity.name} (Source: ${sourceId}, Domain: ${domain})`);
        
        if (this.simulationMode) {
            return { success: true, id: entity.id || `schema-${Date.now()}`, simulated: true };
        }
        
        const entryGroupId = this._getEntryGroupId(domain);
        await this.ensureEntryGroup(entryGroupId);

        if (!this.syncState.schemaTypesEnsured) {
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
                await this.ensureEntryType('schema-aspect-v1', [`projects/${projectId}/locations/global/aspectTypes/schema-aspect-v1`]);
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
                     entryType: `projects/${projectId}/locations/global/entryTypes/schema-aspect-v1`,
                     aspects: {
                        [`${projectId}.global.schema-aspect-v1`]: {
                            data: toProtobufStruct({
                                "name": entity.name,
                                "type": entity.type,
                                "attributes": attributesJson,
                                "semantic_tags": JSON.stringify(tags)
                            })
                        }
                     }
                 }
             });
             console.log(`[Dataplex] Successfully created schema entry: ${response.name}`);
             this.syncState.entries.push(entryId);
             this._saveSyncState();
             return { success: true, id: response.name };
             
         } catch (error) {
             if (error.code === 6 || (error.message && error.message.toLowerCase().includes('already exists'))) {
                 console.log(`[Dataplex] Schema entry ${entryId} already exists.`);
                 this.syncState.entries.push(entryId);
                 this._saveSyncState();
                 return { success: true, id: `projects/${projectId}/locations/${dataplexLocation}/entryGroups/${entryGroupId}/entries/${entryId}` };
             }
             if (error.code === 7 || error.code === 8 || (error.message && (error.message.includes('PERMISSION_DENIED') || error.message.includes('RESOURCE_EXHAUSTED')))) {
                 console.log(`[Dataplex Fallback] GCP Dataplex live API returned quota/permission restriction: ${error.message}. Returning simulated schema entry.`);
                 this.syncState.entries.push(entryId);
                 return { success: true, id: entryId, simulated: true };
             }
             console.error(`Error creating schema entry in Dataplex: ${error.message}`);
             return { success: false, error: error.message };
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

    async listDataContracts() {
        console.log(`[Dataplex] Listing all Data Contracts from Catalog...`);
        if (this.simulationMode) {
            try {
                const contractsPath = join(__dirname, '../../config/data_contracts.json');
                if (fs.existsSync(contractsPath)) {
                    const data = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
                    return data.contracts || [];
                }
            } catch (err) {
                console.error("[Dataplex] Simulation: Failed to read local data contracts:", err.message);
            }
            return [];
        }

        try {
            const name = `projects/${projectId}/locations/europe-west3`;
            const query = `type=projects/${projectId}/locations/global/entryTypes/data-contract-v4`;
            console.log(`[Dataplex] Executing search query on ${name}: "${query}"`);
            
            const [results] = await this.client.searchEntries({
                name: name,
                query: query
            });

            const entryNames = results
                .map(r => r.dataplexEntry?.name)
                .filter(Boolean);

            console.log(`[Dataplex] Found ${entryNames.length} contract entry paths. Fetching details...`);

            const entries = await Promise.all(
                entryNames.map(async (entryName) => {
                    try {
                        const [entry] = await this.client.getEntry({ name: entryName });
                        return entry;
                    } catch (e) {
                        console.error(`[Dataplex] Failed to fetch entry ${entryName}:`, e.message);
                        return null;
                    }
                })
            );

            const contracts = [];
            for (const entry of entries) {
                if (!entry || !entry.name) continue;
                
                const parts = entry.name.split('/');
                const entryId = parts[parts.length - 1];
                const entryGroupId = parts[parts.length - 3];
                
                let domain = 'Analytics';
                if (entryGroupId && entryGroupId.startsWith('domain-')) {
                    domain = entryGroupId.substring(7)
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                }

                const aspects = entry.aspects || {};
                const aspectKey = Object.keys(aspects).find(k => k.endsWith('.global.data-contract-v4'));
                const aspect = aspectKey ? aspects[aspectKey] : {};
                const data = fromProtobufStruct(aspect.data);
                
                contracts.push({
                    id: entryId,
                    product: data.product || 'Unknown Product',
                    domain: domain,
                    schema_file: data.schema || 'composite',
                    subscriber: 'Internal Subscribers',
                    status: 'Active',
                    sla: data.sla || '99.9%',
                    privacy: data.privacy || 'Standard'
                });
            }

            console.log(`[Dataplex] Successfully retrieved ${contracts.length} Data Contracts.`);
            return contracts;

        } catch (error) {
            console.error(`Error listing data contracts from Dataplex: ${error.message}`);
            throw error;
        }
    }
}

function toProtobufStruct(obj) {
    const fields = {};
    for (const [key, val] of Object.entries(obj)) {
        if (val === null || val === undefined) {
            continue;
        } else if (typeof val === 'string') {
            fields[key] = { stringValue: val };
        } else if (typeof val === 'number') {
            fields[key] = { numberValue: val };
        } else if (typeof val === 'boolean') {
            fields[key] = { boolValue: val };
        } else if (Array.isArray(val)) {
            fields[key] = {
                listValue: {
                    values: val.map(item => {
                        if (typeof item === 'string') return { stringValue: item };
                        if (typeof item === 'number') return { numberValue: item };
                        if (typeof item === 'boolean') return { boolValue: item };
                        return {};
                    })
                }
            };
        } else if (typeof val === 'object') {
            fields[key] = { structValue: toProtobufStruct(val) };
        }
    }
    return { fields };
}

function fromProtobufStruct(struct) {
    if (!struct || !struct.fields) return {};
    const obj = {};
    for (const [key, val] of Object.entries(struct.fields)) {
        if (val.stringValue !== undefined) {
            obj[key] = val.stringValue;
        } else if (val.numberValue !== undefined) {
            obj[key] = val.numberValue;
        } else if (val.boolValue !== undefined) {
            obj[key] = val.boolValue;
        } else if (val.nullValue !== undefined) {
            obj[key] = null;
        } else if (val.structValue !== undefined) {
            obj[key] = fromProtobufStruct(val.structValue);
        } else if (val.listValue !== undefined && val.listValue.values) {
            obj[key] = val.listValue.values.map(item => {
                if (item.stringValue !== undefined) return item.stringValue;
                if (item.numberValue !== undefined) return item.numberValue;
                if (item.boolValue !== undefined) return item.boolValue;
                return null;
            });
        }
    }
    return obj;
}

export const dataplex = new DataplexIntegration();
