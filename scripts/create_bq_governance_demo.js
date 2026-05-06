import { BigQuery } from '@google-cloud/bigquery';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projectId = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID;
const bqDataset = process.env.BIGQUERY_DATASET_ID || 'marketing_edw';
const govDataset = process.env.GOVERNANCE_DATASET_ID || 'governance_results';
const bqLocation = process.env.BIGQUERY_LOCATION || 'EU';

const bigquery = projectId ? new BigQuery({ projectId }) : null;

async function setupBigQuery() {
    if (!bigquery) {
        console.error("GCP_PROJECT_ID not set or running in offline mode. Real BigQuery resource creation skipped.");
        return;
    }

    console.log(`Starting BigQuery Governance Setup on Project: ${projectId} (Location: ${bqLocation})...`);

    try {
        // 1. Create Main Dataset
        console.log(`Checking dataset ${bqDataset}...`);
        const [datasetExists] = await bigquery.dataset(bqDataset).exists();
        if (!datasetExists) {
            await bigquery.createDataset(bqDataset, { location: bqLocation });
            console.log(`Created dataset ${bqDataset}`);
        } else {
            console.log(`Dataset ${bqDataset} already exists.`);
        }

        // 2. Create Governance Dataset
        console.log(`Checking dataset ${govDataset}...`);
        const [govExists] = await bigquery.dataset(govDataset).exists();
        if (!govExists) {
            await bigquery.createDataset(govDataset, { location: bqLocation });
            console.log(`Created dataset ${govDataset}`);
        } else {
            console.log(`Dataset ${govDataset} already exists.`);
        }

        // 3. Create dq_propagation_history table
        const historyTableId = 'dq_propagation_history';
        const historyTableRef = bigquery.dataset(govDataset).table(historyTableId);
        const [historyTableExists] = await historyTableRef.exists();

        if (!historyTableExists) {
            const schema = [
                { name: 'table_fqn', type: 'STRING', mode: 'REQUIRED' },
                { name: 'column_name', type: 'STRING', mode: 'REQUIRED' },
                { name: 'snapshot_time', type: 'TIMESTAMP', mode: 'REQUIRED' },
                { name: 'dq_score', type: 'FLOAT', mode: 'REQUIRED' },
                { name: 'dimensions', type: 'STRING', mode: 'NULLABLE' },
                { name: 'source_type', type: 'STRING', mode: 'NULLABLE' }
            ];
            await bigquery.dataset(govDataset).createTable(historyTableId, { schema });
            console.log(`Created table ${govDataset}.${historyTableId}`);
        } else {
            console.log(`Table ${govDataset}.${historyTableId} already exists.`);
        }

        // 4. Load Raw CSVs to serve as Source Lineage contributors
        await loadCsvTable('alloydb_crm_customers.csv', 'raw_customers');
        await loadCsvTable('spanner_transactions.csv', 'raw_transactions');

        // 5. Create Derived Lineage Tables (Customers & Transactions)
        console.log("Creating derived tables for Column-Level Lineage tracking...");
        
        const customersQuery = `
            CREATE OR REPLACE TABLE \`${projectId}.${bqDataset}.customers\` AS
            SELECT 
                customer_id,
                name,
                email,
                lifetime_value,
                support_tier as membership_level,
                created_at as registration_date
            FROM \`${projectId}.${bqDataset}.raw_customers\`
        `;
        await runQuery(customersQuery);
        console.log("Created table: customers (Source Lineage linked)");

        const transactionsQuery = `
            CREATE OR REPLACE TABLE \`${projectId}.${bqDataset}.transactions\` AS
            SELECT 
                transaction_id,
                item_id as product_id,
                customer_id,
                store_id,
                quantity_sold,
                quantity_sold * 10.5 as amount_discounted,
                quantity_sold * 12.0 as amount_taxed,
                timestamp
            FROM \`${projectId}.${bqDataset}.raw_transactions\`
        `;
        await runQuery(transactionsQuery);
        console.log("Created table: transactions (Source Lineage linked)");

        console.log("✅ BigQuery Governance resources successfully configured!");
    } catch (err) {
        console.error("❌ Failed to configure BigQuery resources:", err.message);
    }
}

async function loadCsvTable(csvFilename, bqTableId) {
    const csvPath = path.resolve(__dirname, '../test-data', csvFilename);
    if (!fs.existsSync(csvPath)) {
        console.warn(`[WARNING] CSV source not found at ${csvPath}. Skipping raw load.`);
        return;
    }

    console.log(`Loading ${csvFilename} into raw table: ${bqTableId}...`);
    try {
        const metadata = {
            sourceFormat: 'CSV',
            skipLeadingRows: 1,
            autodetect: true,
            writeDisposition: 'WRITE_TRUNCATE',
            location: bqLocation
        };
        
        const [job] = await bigquery
            .dataset(bqDataset)
            .table(bqTableId)
            .load(csvPath, metadata);

        // Wrap manually to support standard Job instance methods
        const jobInstance = bigquery.job(job.jobReference.jobId, { location: job.jobReference.location });

        // Wait for the load job to complete by polling getMetadata
        let [jobMetadata] = await jobInstance.getMetadata();
        while (jobMetadata.status.state === 'RUNNING') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            [jobMetadata] = await jobInstance.getMetadata();
        }
        
        if (jobMetadata.status.errorResult) {
            throw new Error(jobMetadata.status.errorResult.message);
        }
        
        console.log(`Loaded ${csvFilename} to ${bqDataset}.${bqTableId}`);
    } catch (e) {
        console.error(`Failed to load CSV to BigQuery: ${e.message}`);
    }
}

async function runQuery(query) {
    const options = {
        query: query,
        location: bqLocation,
    };
    const [job] = await bigquery.createQueryJob(options);
    await job.getQueryResults();
}

setupBigQuery();
