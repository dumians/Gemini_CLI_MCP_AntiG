-- Unified Metadata Catalog Schema
-- This represents the logical model that the Catalog Agent maintains in-memory.
-- In production, this could be materialized in BigQuery or Dataplex.

-- Registered Data Sources across the Agentic Mesh
CREATE TABLE catalog_sources (
    source_id VARCHAR(50) PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,         -- 'oracle', 'spanner', 'bigquery', 'alloydb'
    domain VARCHAR(100) NOT NULL,             -- 'Finance', 'Retail', 'Analytics', 'HR'
    connection_mode VARCHAR(20) DEFAULT 'local', -- 'local' or 'remote'
    endpoint_url VARCHAR(500),
    owner_agent VARCHAR(100),                 -- which agent owns this source
    status VARCHAR(20) DEFAULT 'active',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tables, Views, Graphs discovered across all sources
CREATE TABLE catalog_entities (
    entity_id VARCHAR(100) PRIMARY KEY,
    source_id VARCHAR(50) REFERENCES catalog_sources(source_id),
    entity_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,         -- 'TABLE', 'VIEW', 'GRAPH', 'INDEX'
    description TEXT,
    row_estimate BIGINT,
    last_profiled TIMESTAMP
);

-- Columns / Attributes within each entity
CREATE TABLE catalog_attributes (
    attribute_id VARCHAR(150) PRIMARY KEY,
    entity_id VARCHAR(100) REFERENCES catalog_entities(entity_id),
    attribute_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(100),
    is_nullable BOOLEAN DEFAULT TRUE,
    is_primary_key BOOLEAN DEFAULT FALSE,
    is_foreign_key BOOLEAN DEFAULT FALSE,
    semantic_tag VARCHAR(100),                -- 'identifier', 'metric', 'dimension', 'vector', 'timestamp'
    references_entity VARCHAR(100),           -- FK target entity
    references_attribute VARCHAR(150)         -- FK target attribute
);

-- Cross-Domain Relationships (FK-like links between different data sources)
CREATE TABLE catalog_relationships (
    relationship_id VARCHAR(200) PRIMARY KEY,
    source_entity_id VARCHAR(100) REFERENCES catalog_entities(entity_id),
    source_attribute VARCHAR(255),
    target_entity_id VARCHAR(100) REFERENCES catalog_entities(entity_id),
    target_attribute VARCHAR(255),
    relationship_type VARCHAR(50),            -- 'FK', 'GRAPH_EDGE', 'SEMANTIC_MATCH', 'CROSS_DOMAIN'
    confidence DECIMAL(3,2) DEFAULT 1.00
);

-- Lineage: tracks which agents produce/consume which entities
CREATE TABLE catalog_lineage (
    lineage_id VARCHAR(200) PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) REFERENCES catalog_entities(entity_id),
    direction VARCHAR(20) NOT NULL,           -- 'PRODUCES' or 'CONSUMES'
    access_pattern VARCHAR(50),               -- 'SQL', 'GRAPH', 'VECTOR', 'API'
    last_accessed TIMESTAMP
);
