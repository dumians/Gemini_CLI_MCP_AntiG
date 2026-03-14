# MCP Tool Design: GraphRAG Traversal & Grounding

This document outlines the specific **Model Context Protocol (MCP)** tool definitions used to facilitate GraphRAG traversal across the Agentic Data Mesh.

## 1. Overview

The GraphRAG flow uses MCP tools to bridge the gap between LLM reasoning and structured graph/relational data. Tools are designed to be "atomic" enough for the model to chain them, but powerful enough to handle complex traversals.

## 2. Spanner Graph MCP Tools (Domain Agents)

These tools are exposed by agents managing **Cloud Spanner** graph instances.

### `query_graph_path`

- **Description**: Executes a GQL (Graph Query Language) pathfinding query to find relationships between two or more entities.
- **Parameters**:
  - `start_nodes`: Array of entity IDs/types.
  - `target_nodes`: Array of target entity IDs/types.
  - `max_depth`: Integer (default 3).
  - `relationship_types`: Array of strings (e.g., ["SUPPLIED_BY", "STOCKED_IN"]).
- **Output**: JSON graph path including properties of intermediate edges and nodes.

### `lookup_entity_context`

- **Description**: Retrieves technical and semantic metadata for a specific entity to populate the agent's context.
- **Parameters**:
  - `entity_id`: UUID or URI.
  - `include_vector_summary`: Boolean.
- **Output**: Full entity properties + reference to related analytical clusters in BigQuery.

## 3. BigQuery Analytical Tools (Analytics Agent)

### `search_analytical_patterns`

- **Description**: Queries BigQuery ML or Analytics Hub to find historical patterns matching the current graph traversal.
- **Parameters**:
  - `semantic_query`: String (Natural Language intent).
  - `domain_filters`: Array of domain IDs.
- **Output**: Summary of historical correlations (e.g., "90% of HR recruitment delays in Region X led to Logistics bottlenecks within 14 days").

## 4. Oracle DB@GCP MCP Tools (Legacy Operational Agent)

These tools facilitate communication between the mesh and mission-critical Oracle workloads.

### `query_oracle_vector`

- **Description**: Executes semantic similarity search using Oracle AI Vector Search against legacy operational records.
- **Parameters**:
  - `query_vector`: Array of floats (embeddings).
  - `limit`: Integer (default 5).
- **Output**: Closest matching operational records (e.g., finding historical purchase orders semantically similar to a new procurement request).

### `extract_erp_entities`

- **Description**: Inspects Oracle ERP schemas to identify cross-domain identifiers (e.g., mapping an Oracle `ORD_ID` to a BigQuery `transaction_hash`).
- **Parameters**:
  - `entity_type`: String.
- **Output**: Mapping schema for Master Orchestrator context fusion.

## 5. Context Fusion Tool (Master Orchestrator)

### `fuse_domain_context`

- **Description**: Injects the output of one agent into the prompt of another while maintaining provenance.
- **Parameters**:
  - `source_insight`: JSON output from a sub-agent.
  - `target_agent_id`: The ID of the agent to receive the context.
  - `fusion_instruction`: Specific instruction on how to use the insight (e.g., "Use this stock delay to calculate financial impact").
- **Output**: A grounded tool-call to the target agent.

## 5. Implementation Schema (Example)

```json
{
  "name": "query_graph_path",
  "description": "Traverse the supply chain graph to find potential delay correlations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "start_nodes": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Entities to start traversal from (e.g., 'warehouse_402')"
      },
      "max_depth": {
        "type": "number",
        "description": "Maximum hops in the graph."
      }
    },
    "required": ["start_nodes"]
  }
}
```

## 6. Security and Governance Integration

Every tool call is wrapped in a **Workload Identity** token. The MCP Server validates the caller's identity against **Dataplex** access policies before executing the underlying GQL/SQL.
