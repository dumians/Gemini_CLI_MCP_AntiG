-- Spanner Global Retail Schema (Includes Vector and Graph)
CREATE TABLE stores (
    store_id STRING(MAX) NOT NULL,
    location STRING(MAX),
    region STRING(50)
) PRIMARY KEY (store_id);
CREATE TABLE global_inventory (
    item_id STRING(MAX) NOT NULL,
    store_id STRING(MAX) NOT NULL,
    stock_quantity INT64,
    product_name STRING(255),
    -- Spanner Vector Search: Exact/ANN 768-D representation of product
    product_embedding ARRAY < FLOAT32 >,
    CONSTRAINT embedding_length_check CHECK (ARRAY_LENGTH(product_embedding) = 768)
) PRIMARY KEY (store_id, item_id),
INTERLEAVE IN PARENT stores ON DELETE CASCADE;
CREATE TABLE realtime_transactions (
    transaction_id STRING(MAX) NOT NULL,
    item_id STRING(MAX) NOT NULL,
    store_id STRING(MAX) NOT NULL,
    quantity_sold INT64,
    timestamp TIMESTAMP
) PRIMARY KEY (store_id, transaction_id),
INTERLEAVE IN PARENT stores ON DELETE CASCADE;

-- Add a supplier reference to link back to the Oracle ERP system
ALTER TABLE global_inventory ADD COLUMN supplier_id STRING(MAX);

-- Spanner Graph: Create a Property Graph to trace inventory to transactions
CREATE PROPERTY GRAPH RetailGraph NODE TABLES (
    stores,
    global_inventory,
    realtime_transactions
) EDGE TABLES (
    global_inventory AS INVENTORY_AT_STORE SOURCE KEY (store_id) REFERENCES stores(store_id) DESTINATION KEY(store_id, item_id) REFERENCES global_inventory(store_id, item_id),
    realtime_transactions AS TRANSACTION_FOR_ITEM SOURCE KEY (store_id, item_id) REFERENCES global_inventory(store_id, item_id) DESTINATION KEY(store_id, transaction_id) REFERENCES realtime_transactions(store_id, transaction_id)
);
-- Create a Vector Index on Spanner for ANN search
CREATE VECTOR INDEX product_similarity_idx ON global_inventory(product_embedding) OPTIONS (
    distance_type = 'COSINE',
    algorithm = 'TREE_AH',
    vector_length = 768,
    tree_depth = 2,
    num_leaves = 1000
);