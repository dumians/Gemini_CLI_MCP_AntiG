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

// 5. Spanner Performance (spanner_performance.csv)
const spannerPerf = [
    'day,latency,uptime',
    'Mon,12,99.9',
    'Tue,15,99.8',
    'Wed,8,100',
    'Thu,22,99.5',
    'Fri,14,99.9',
    'Sat,10,100',
    'Sun,11,100',
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'spanner_performance.csv'), spannerPerf);

// 6. AlloyDB CRM Customers (alloydb_crm_customers.csv)
const alloyCrmCustomers = [
    'customer_id,name,email,lifetime_value,support_tier,created_at',
    'C-001,John Doe,john.doe@alloydb.example.com,5200.50,Gold,2024-01-15T08:00:00Z',
    'C-002,Jane Smith,jane.smith@alloydb.example.com,1240.20,Silver,2024-02-01T10:00:00Z',
    'C-003,Bob Johnson,bob.johnson@alloydb.example.com,9800.00,Platinum,2023-11-20T11:00:00Z',
    'C-004,Alice Brown,alice.brown@alloydb.example.com,150.75,Bronze,2024-03-10T09:00:00Z',
    'C-005,Charlie Wilson,charlie.wilson@alloydb.example.com,4100.00,Gold,2024-01-22T14:30:00Z',
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'alloydb_crm_customers.csv'), alloyCrmCustomers);

// 7. AlloyDB Sentiment Trends (alloydb_sentiment_trends.csv)
const alloySentiment = [
    'day,positive,neutral,negative',
    'Mon,65,25,10',
    'Tue,70,20,10',
    'Wed,68,22,10',
    'Thu,72,20,8',
    'Fri,75,18,7',
    'Sat,80,15,5',
    'Sun,82,13,5',
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'alloydb_sentiment_trends.csv'), alloySentiment);

// 8. AlloyDB Conversion Funnel (alloydb_conversion_funnel.csv)
const alloyFunnel = [
    'stage,value',
    'Prospects,5000',
    'Qualified,3400',
    'Proposal,1800',
    'Negotiation,900',
    'Won,450',
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'alloydb_conversion_funnel.csv'), alloyFunnel);

// 9. AlloyDB Active Customers (alloydb_active_customers.csv)
const alloyActiveCust = [
    'id,name,tier,health,val',
    'CUST-390,Alpha Corp,Enterprise,Healthy,$120K',
    'CUST-412,Beta Solutions,Mid-Market,At Risk,$45K',
    'CUST-501,Global Industries,Enterprise,Healthy,$230K',
    'CUST-223,Tech Start,SMB,Healthy,$12K',
    'CUST-611,Zeta Finance,Enterprise,Critical,$95K',
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'alloydb_active_customers.csv'), alloyActiveCust);

// 10. Oracle Agent Performance (oracle_agent_performance.csv)
const oracleAgentPerf = [
    'name,queries,success,latency',
    'Agent Alpha,1240,99.2,12',
    'Agent Beta,890,98.5,15',
    'Agent Gamma,2100,99.8,8',
    'Agent Delta,1560,97.4,22',
    'Agent Epsilon,1100,99.5,10',
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'oracle_agent_performance.csv'), oracleAgentPerf);

// 11. Oracle Procurement Status (oracle_procurement_status.csv)
const oracleProcurement = [
    'label,value,color',
    'Pending Approvals,12,orange',
    'Active POs,145,blue',
    'Vendor Disputes,3,red',
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'oracle_procurement_status.csv'), oracleProcurement);

// 12. Oracle Compliance Audit (oracle_compliance_audit.csv)
const oracleCompliance = [
    'score,description',
    '99.8,Global Compliance Score',
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'oracle_compliance_audit.csv'), oracleCompliance);

// 13. Oracle Ledger Entries (oracle_ledger_entries.csv)
const oracleLedger = [
    'id,desc,amount,status',
    'TX-9021,Cloud Infrastructure,-$12,400,Cleared',
    'TX-9022,Vendor Payment: Logistics,-$45,000,Pending',
    'TX-9023,Service Revenue: EMEA,+$128,000,Cleared',
    'TX-9024,Payroll: R&D Dept,-$210,000,Cleared',
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'oracle_ledger_entries.csv'), oracleLedger);

// 14. Federated Governance Policies (federated_governance_policies.csv)
const govPoliciesData = [
    'id,name,status,domain,lastUpdated,classification,dataplexAspect,maskingRule',
    'POL-001,PII Access Control (EMEA),Active,Oracle ERP,2h ago,HIGH,pii_aspect,redact',
    'POL-002,Cross-Border Data Transfer,Restricted,Global,1d ago,HIGH,lineage_rule,none',
    'POL-003,Financial Ledger Retention,Active,Spanner,3d ago,CRITICAL,quality_aspect,nullify',
    'POL-004,Marketing Segment Anonymization,Draft,BigQuery,5h ago,MEDIUM,default,hash',
].join('\n');
fs.writeFileSync(path.join(TEST_DATA_DIR, 'federated_governance_policies.csv'), govPoliciesData);

// Also update config/policies.json for consistency and test compatibility
const policiesJson = {
    rules: [
        {
            id: 'POL-001',
            name: 'PII Access Control (EMEA)',
            status: 'Active',
            domain: 'Oracle ERP',
            lastUpdated: '2h ago',
            classification: 'HIGH',
            dataplexAspect: 'pii_aspect',
            maskingRule: 'redact',
            maskFields: ['salary', 'employee_id']
        },
        {
            id: 'POL-002',
            name: 'Cross-Border Data Transfer',
            status: 'Restricted',
            domain: 'Global',
            lastUpdated: '1d ago',
            classification: 'HIGH',
            dataplexAspect: 'lineage_rule',
            maskingRule: 'none',
            maskFields: ['customer_email', 'phone']
        },
        {
            id: 'POL-003',
            name: 'Financial Ledger Retention',
            status: 'Active',
            domain: 'Spanner',
            lastUpdated: '3d ago',
            classification: 'CRITICAL',
            dataplexAspect: 'quality_aspect',
            maskingRule: 'nullify',
            maskFields: ['card_number', 'revenue']
        },
        {
            id: 'POL-004',
            name: 'Marketing Segment Anonymization',
            status: 'Draft',
            domain: 'BigQuery',
            lastUpdated: '5h ago',
            classification: 'MEDIUM',
            dataplexAspect: 'default',
            maskingRule: 'hash',
            maskFields: ['segment_name']
        }
    ]
};
fs.writeFileSync(path.resolve('config/policies.json'), JSON.stringify(policiesJson, null, 2));

console.log('Interconnected test data generated in ./test-data directory.');


