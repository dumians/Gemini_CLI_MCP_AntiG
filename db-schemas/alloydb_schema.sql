-- AlloyDB CRM Schema (PostgreSQL) - aqy5e17;]`Az7,uS
-- Enable pgvector extension for AI similarity search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE support_tickets (
    ticket_id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(customer_id),
    status VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    resolution_notes TEXT,
    -- Store vector embeddings of the resolution notes to find similar solved cases
    resolution_embedding vector(768),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
-- Create an HNSW index on the vector column for fast approximate nearest neighbor search
CREATE INDEX ON support_tickets USING hnsw (resolution_embedding vector_l2_ops);
-- Insert sample data
INSERT INTO customers (customer_id, name, email, subscription_tier)
VALUES (
        'CUST-999',
        'Acme Corp VIP',
        'admin@acme.example.com',
        'Enterprise'
    ),
    (
        'CUST-100',
        'Globex',
        'contact@globex.example.com',
        'Standard'
    );