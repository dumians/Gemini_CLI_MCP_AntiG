import { v1 } from '@google-cloud/dataplex';
import dotenv from 'dotenv';

const { CatalogServiceClient } = v1;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const projectId = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DataplexIntegration {
    constructor() {
        // Only attempt to initialize if we have a project ID and are not in test mode
        this.client = (projectId && process.env.NODE_ENV !== 'test') ? new CatalogServiceClient() : null;
        this.simulationMode = !this.client;
        
        if (this.simulationMode) {
            console.error("DataplexServiceClient not initialized or running in test. Running in simulation mode for Dataplex.");
        }
    }

    async ensureEntryGroup(entryGroupId) {
        if (this.simulationMode) return;
        
        const parent = `projects/${projectId}/locations/global`;
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
            if (error.code === 6 || error.message.includes('already exists')) {
                console.log(`[Dataplex] Entry Group ${entryGroupId} already exists.`);
            } else {
                console.error(`[Dataplex] Error creating Entry Group: ${error.message}`);
                throw error;
            }
        }
    }

    async ensureAspectType(aspectTypeId, metadataTemplate) {
        if (this.simulationMode) return;
        
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
        } catch (error) {
            if (error.code === 6 || error.message.includes('already exists')) {
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
        } catch (error) {
            if (error.code === 6 || error.message.includes('already exists')) {
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
        
        const entryGroupId = 'agentic-mesh-group';
        await this.ensureEntryGroup(entryGroupId);
        
        try {
            const schemaPath = join(__dirname, '../../db-schemas/data_product_aspect_schema.json');
            const schemaContent = fs.readFileSync(schemaPath, 'utf8');
            const schema = JSON.parse(schemaContent);
            
            await this.ensureAspectType('data-product-v4', schema.metadataTemplate);
            await this.ensureEntryType('data-product-v4', [`projects/${projectId}/locations/global/aspectTypes/data-product-v4`]);
        } catch (err) {
            console.error("[Dataplex] Failed to load schema or ensure types for Data Product:", err.message);
            throw err;
        }
        
        try {
            const parent = `projects/${projectId}/locations/global/entryGroups/${entryGroupId}`;
            
            const [response] = await this.client.createEntry({
                parent: parent,
                entryId: product.id,
                entry: {
                    entryType: `projects/${projectId}/locations/global/entryTypes/data-product-v4`,
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
            const entryGroupId = 'agentic-mesh-group';
            await this.ensureEntryGroup(entryGroupId);
            
            try {
                const schemaPath = join(__dirname, '../../db-schemas/data_contract_aspect_schema.json');
                const schemaContent = fs.readFileSync(schemaPath, 'utf8');
                const schema = JSON.parse(schemaContent);
                
                await this.ensureAspectType('data-contract-v4', schema.metadataTemplate);
                await this.ensureEntryType('data-contract-v4', [`projects/${projectId}/locations/global/aspectTypes/data-contract-v4`]);
            } catch (err) {
                console.error("[Dataplex] Failed to load schema or ensure types for Data Contract:", err.message);
                throw err;
            }
            
            const parent = `projects/${projectId}/locations/global/entryGroups/${entryGroupId}`;
            
            const [response] = await this.client.createEntry({
                parent: parent,
                entryId: contract.id,
                entry: {
                    entryType: `projects/${projectId}/locations/global/entryTypes/data-contract-v4`,
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
