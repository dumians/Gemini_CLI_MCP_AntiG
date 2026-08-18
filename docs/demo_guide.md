# Enterprise Agentic Data Mesh (MeshOS) Demo & Exploration Guide

This guide walks through running and evaluating **MeshOS**, the Enterprise Agentic Data Mesh platform built on Google Cloud Platform (GCP).

MeshOS showcases multi-agent orchestration, the **GCP One-MCP Gateway**, and **Google Cloud Dataplex Labs** data governance and discovery capabilities across 9 enterprise domains:
- **Oracle ERP**: `ERP_PURCHASE_ORDERS`, `ERP_SUPPLIERS`, `ERP_EXPENSES`
- **Spanner Retail**: `Inventory`, `Transactions`, `Stores`, `Products`
- **BigQuery Analytics**: `marketing_edw.customer_segments`, `churn_risk`
- **AlloyDB CRM**: `CRM_LEADS`, `SUPPORT_TICKETS`
- **NetSuite ERP**: `SalesOrders`, `Invoices`, `Fulfillment`
- **Warehouse**: `StockBatches`, `AisleBins`, `PalletMovements`
- **HR & Talent**: `Employees`, `Departments`, `HeadcountRequisitions`
- **Catalog**: Dataplex Aspects, Lineage, W3C DCAT v3
- **API Domain**: Dynamic external OpenAPI products

---

## 🛠️ Quick Setup

### 1. Environment Preparation
Ensure your `.env` is configured in the repository root:
```env
PORT=3000
GCP_PROJECT_ID="your-gcp-project-id"
GEMINI_API_KEY="your-gemini-api-key"
GCP_ONE_MCP_ENABLED="true"
ONE_MCP_MODE="unified"
DATAPLEX_ZONE_ID="europe-west3"
BIGQUERY_DATASET_ID="marketing_edw"
USE_REAL_CONNECTIONS="false"
```

### 2. Launching the System
```bash
# Start backend API + One-MCP Gateway + React UIX Studio
npm run start:all
```
- **Web UI Dashboard**: `http://localhost:5173`
- **Mesh Gateway API**: `http://localhost:3000`
- **One-MCP Server**: `http://localhost:8088/sse`

---

## 🎯 Guided Demo Scenarios

### Scenario 1: Cross-Domain Strategic Reasoning (Oracle + Spanner + BigQuery + AlloyDB)

**Prompt to submit in UI Search Bar:**
> *"Find VIP customers in BigQuery with high churn risk, check if their recent orders in Spanner Retail suffered stockouts, trace supplier delivery delays in Oracle ERP, and identify unresolved support tickets in AlloyDB CRM."*

**What MeshOS Demonstrates:**
1. **Master Orchestrator Delegation**: Gemini 2.5 decomposes the question into targeted sub-agent tasks.
2. **One-MCP Routing**: Routes requests through the Zero-Trust gateway.
3. **Data Product Contracts**: Standardizes outputs from 4 different databases into a unified JSON contract.
4. **GraphRAG Fact Grounding**: Cites immutable path relationships (`Supplier -> Purchase Order -> Inventory -> Customer`).
5. **Interactive UI Visualization**: Displays the real-time agent execution timeline and rendered force-directed graph.

---

### Scenario 2: Dataplex Labs AI Discovery Agent (Semantic Decomposition & Multi-Search)

**Navigation:** Open the **Discovery & Drift** tab in the UI.

**Prompt to submit in AI Discovery Search:**
> *"Locate omnichannel retail revenue, store inventory shortages, and customer acquisition metrics in BigQuery and Spanner tables."*

**What MeshOS Demonstrates:**
1. **Semantic Question Decomposition**: The Discovery Agent decomposes the business question into 3 distinct search variations:
   - *Direct Synonyms*: `omnichannel retail revenue store inventory`
   - *Technical Schema Translation*: `spend OR total_amount OR gross_revenue warehouse_stock`
   - *Category Breadth*: `omnichannel retail sales transaction store`
2. **Predicate Extraction**: Extracts qualifiers (`type=table`, `system=bigquery`, `system=spanner`, `projectid=...`).
3. **Knowledge Catalog Multi-Search**: Executes concurrent semantic searches with `semantic_search: true`.
4. **Context Lookup (`lookupContext`)**: Fetches deep lineage, aspect schemas, and trust scores.
5. **Asset Reranking**: Reranks assets by relevance and metadata quality score.

---

### Scenario 3: Dataplex Labs Data Governance Agent (Lineage Propagation & AutoDQ Trust Center)

**Navigation:** Open the **Lineage & Descriptions** and **Data Trust Center** tabs in the UI.

**Actions to Perform:**
1. **Document RAG Ingestion**: Upload a markdown data dictionary (e.g. `retail_data_dictionary.md`).
   - Gemini multimodal extraction automatically indexes table schemas and column descriptions.
2. **Lineage-Based Metadata Propagation**:
   - Preview propagation from `raw_orders` to `curated_customer_revenue`.
   - Inspect automated SQL transformation explanations (`SUM`, `COALESCE`, `SAFE_CAST`).
3. **Data Trust Center Calculation**:
   - Trigger derived DQ score calculations.
   - Inspect automated SQL remediation bonuses (`COALESCE` $+8\%$, `DISTINCT` $+4\%$, `SAFE_CAST` $+5\%$).
   - Review historical drift trends (`Improving`, `Stable`, `Degrading`).

---

### Scenario 4: GCP One-MCP Gateway Runtime Modes

Test dynamic switching between MCP operational modes in the UI or CLI:
- **`unified`**: All 31+ tools routed through a single zero-trust endpoint.
- **`microservices`**: Standalone microservices per domain (`servers/bigquery-mcp`, `servers/spanner-mcp`, etc.).
- **`local`**: In-process driver execution.
- **`toolbox`**: MCP Toolbox for Databases integration.
