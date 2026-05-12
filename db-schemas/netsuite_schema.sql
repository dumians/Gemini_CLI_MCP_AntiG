-- NetSuite ERP SuiteTalk Schema (Financials, Orders & AI Connector mapped records)

CREATE TABLE netsuite_customers (
    customer_id STRING(MAX) NOT NULL,
    company_name STRING(255) NOT NULL,
    email STRING(255),
    subsidiary STRING(100),
    credit_limit FLOAT64
) PRIMARY KEY (customer_id);

CREATE TABLE netsuite_inventory_items (
    item_id STRING(MAX) NOT NULL,
    display_name STRING(255),
    available_quantity INT64,
    base_price FLOAT64,
    ai_connector_summary STRING(MAX),
    -- Vector embedding representing precomputed AI context summary
    ai_embedding ARRAY<FLOAT32>
) PRIMARY KEY (item_id);

CREATE TABLE netsuite_sales_orders (
    order_id STRING(MAX) NOT NULL,
    customer_id STRING(MAX) NOT NULL REFERENCES netsuite_customers(customer_id),
    item_id STRING(MAX) REFERENCES netsuite_inventory_items(item_id),
    status STRING(50),
    total_amount FLOAT64,
    created_date TIMESTAMP,
    fulfillment_status STRING(50),
    ai_summary STRING(MAX)
) PRIMARY KEY (order_id);

-- Property Graph representing relational structures inside NetSuite ERP
CREATE PROPERTY GRAPH netsuite_erp_graph NODE TABLES (
    netsuite_customers LABEL Customer,
    netsuite_inventory_items LABEL InventoryItem,
    netsuite_sales_orders LABEL SalesOrder
) EDGE TABLES (
    netsuite_sales_orders AS ORDERED_BY 
        SOURCE KEY (order_id) REFERENCES netsuite_sales_orders(order_id)
        DESTINATION KEY (customer_id) REFERENCES netsuite_customers(customer_id)
        LABEL ORDERED_BY
);

-- Index for efficient semantic vector retrieval by NetSuite AI connector
CREATE VECTOR INDEX netsuite_ai_idx ON netsuite_inventory_items(ai_embedding) OPTIONS (
    distance_type = 'COSINE',
    vector_length = 768
);
