import fs from 'fs';
import path from 'path';
import { dataplex } from '../agent/utils/dataplex.js';

async function main() {
    console.log("=== Populating Dataplex Resources ===");

    // Read Data Products
    const productsPath = path.resolve('config/data_products.json');
    if (fs.existsSync(productsPath)) {
        const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
        console.log(`Found ${productsData.products.length} products.`);
        for (const product of productsData.products) {
            console.log(`\nProcessing Product: ${product.name}`);
            await dataplex.createDataProduct(product);
            
            if (product.composite) {
                console.log(`[Composite] Processing components for ${product.name}`);
                for (const component of product.components) {
                    const sourceDomain = component.domain;
                    const targetProduct = product.name.toLowerCase().replace(/\s/g, '-');
                    const processId = `${sourceDomain.toLowerCase()}-to-${targetProduct}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                    const runId = `run-${Date.now()}`;
                    
                    await dataplex.createLineageProcess(processId, `Composite Lineage: ${sourceDomain} to ${product.name}`);
                    await dataplex.createLineageRun(processId, runId);
                    await dataplex.createLineageEvent(processId, runId, sourceDomain.toLowerCase(), targetProduct);
                }
            } else if (product.domain) {
                await dataplex.createLineageProcess(`domain-${product.domain.toLowerCase()}`, `Domain: ${product.domain}`);
            }
        }
    } else {
        console.log("No data_products.json found.");
    }

    // Read Data Contracts
    const contractsPath = path.resolve('config/data_contracts.json');
    if (fs.existsSync(contractsPath)) {
        const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf-8'));
        console.log(`\nFound ${contractsData.contracts.length} contracts.`);
        for (const contract of contractsData.contracts) {
            console.log(`\nProcessing Contract: ${contract.id}`);
            await dataplex.createDataContract(contract);
            
            // Lineage: Product -> Subscriber
            const source = contract.product.toLowerCase().replace(/\s/g, '-');
            const target = contract.subscriber.toLowerCase().replace(/\s/g, '-');
            
            const processId = `${source}-to-${target}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const runId = `run-${Date.now()}`;
            
            await dataplex.createLineageProcess(processId, `Contract Lineage: ${contract.product} to ${contract.subscriber}`);
            await dataplex.createLineageRun(processId, runId);
            await dataplex.createLineageEvent(processId, runId, source, target);
            
            // Policies based on privacy
            if (contract.privacy) {
                console.log(`[Policy] Applying privacy policy '${contract.privacy}' to contract ${contract.id}`);
            }
        }
    } else {
        console.log("No data_contracts.json found.");
    }

    console.log("\n=== Population Complete ===");
}

main().catch(console.error);
