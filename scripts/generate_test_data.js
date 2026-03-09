import fs from 'fs';
import path from 'path';

/**
 * Generates interconnected test data for:
 * 1. BigQuery (Analytical segments)
 * 2. AlloyDB (CRM/Support)
 * 3. Spanner (Global Inventory/Transactions)
 * 4. Oracle DB@GCP (ERP/Suppliers)
 */

const TEST_DATA_DIR = path.resolve('test-data');
if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR);
}

const customerIds = ['CUST-001', 'CUST-002', 'CUST-003', 'CUST-004', 'CUST-005'];
const itemIds = ['ITEM-X1', 'ITEM-Y2', 'ITEM-Z3'];
const supplierIds = [101, 102, 103];

// 1. BigQuery Data (customer_segments.csv)
const bqData = [
    'customer_id,segment_name,lifetime_value,last_interaction',
    `${customerIds[0]},VIP,150000.00,2024-03-01T10:00:00Z`,
    `${customerIds[1]},VIP,120000.00,2024-03-02T11:30:00Z`,
    `${customerIds[2]},Standard,5000.00,2024-03-03T09:15:00Z`,
    `${customerIds[3]},Churn Risk,1200.00,2024-02-15T14:45:00Z`,
    `${customerIds[4]},VIP,200000.00,2024-03-05T16:20:00Z`,
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'bigquery_segments.csv'), bqData);

// 2. AlloyDB Data (support_tickets.csv)
const alloyDbData = [
    'ticket_id,customer_id,status,subject,description',
    `1,${customerIds[0]},Open,Delayed shipment,Customer is upset about ITEM-X1 delay`,
    `2,${customerIds[1]},Resolved,Refund request,Issue with product quality on ITEM-Y2`,
    `3,${customerIds[4]},In Progress,Technical support,Integration issues with the supply chain API`,
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'alloydb_tickets.csv'), alloyDbData);

// 3. Spanner Data (transactions_inventory.csv)
const spannerData = [
    'transaction_id,item_id,customer_id,store_id,quantity_sold,timestamp',
    `TR-101,${itemIds[0]},${customerIds[0]},NYC-01,1,2024-03-06T08:00:00Z`,
    `TR-102,${itemIds[1]},${customerIds[1]},LDN-05,2,2024-03-07T09:20:00Z`,
    `TR-103,${itemIds[0]},${customerIds[4]},NYC-01,1,2024-03-08T10:45:00Z`,
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'spanner_transactions.csv'), spannerData);

// 4. Oracle Data (suppliers_orders.csv)
const oracleData = [
    'po_id,supplier_id,item_id,status,total_amount',
    `PO-9001,${supplierIds[0]},${itemIds[0]},Delayed,50000.00`,
    `PO-9002,${supplierIds[1]},${itemIds[1]},Shipped,25000.00`,
    `PO-9003,${supplierIds[2]},${itemIds[2]},Pending,15000.00`,
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'oracle_orders.csv'), oracleData);

console.log('Interconnected test data generated in ./test-data directory.');
