# Enterprise Agentic Data Mesh (MeshOS) - Architectural Walkthrough

This document outlines the complete architectural evolution and usage guidelines for **MeshOS**, the Multi-Domain Autonomous Agentic Data Mesh on Google Cloud Platform (GCP).

![MeshOS Enterprise Architecture](images/gcp_agentic_mesh_unified_architecture.png)

---

## 🏛️ Architecture Highlights

### 1. The 9 Mesh Data Domains
The platform organizes enterprise data into 9 decentralized, contract-bounded domains:
- **Oracle ERP**: `ERP_PURCHASE_ORDERS`, `ERP_SUPPLIERS`, `ERP_EXPENSES`
- **Spanner Retail**: `Inventory`, `Transactions`, `Stores`, `Products`
- **BigQuery Analytics**: `marketing_edw.customer_segments`, `churn_risk`
- **AlloyDB CRM**: `CRM_LEADS`, `CRM_ACCOUNTS`, `SUPPORT_TICKETS`
- **NetSuite ERP**: `SalesOrders`, `Invoices`, `Fulfillment`
- **Warehouse**: `StockBatches`, `AisleBins`, `PalletMovements`
- **HR & Talent**: `Employees`, `Departments`, `HeadcountRequisitions`
- **Catalog & Knowledge**: Knowledge Catalog Aspects, Lineage, W3C DCAT v3
- **API Domain**: Dynamic external OpenAPI products

---

### 2. GCP One-MCP Unified Gateway
The **GCP One-MCP Gateway** (`servers/one-mcp/index.js`, `agent/utils/one_mcp_gateway.js`) establishes a single Zero-Trust entry point:
- **Universal Tool Federation**: Exposes 31+ domain tools over Server-Sent Events (SSE) on port 8088 or stdio.
- **Dynamic Domain Scoping**: Restricts available tools based on the calling agent's domain identity, preventing lateral security vulnerabilities.
- **Flexible Modes**: Seamlessly switches between `unified`, `microservices`, `local`, and `toolbox`.

---

### 3. Google Cloud Knowledge Catalog Governance Agent
Integrated from the Google Cloud Knowledge Catalog (Dataplex Labs) reference specification:
- **Document RAG Engine**: Gemini multimodal extraction pipeline converting unstructured Markdown, PDFs, and schema dictionaries into structured table schemas and column definitions.
- **Lineage-Based Metadata Propagation**: Propagates upstream column descriptions downstream with SQL transformation analysis (`COALESCE`, `SUM`, `CASE WHEN`).
- **AI Business Glossary & EntryLinks**: Binds standardized glossary terms to Knowledge Catalog entries.
- **Data Trust Center (AutoDQ)**: Derives multi-hop Data Quality scores with automated SQL remediation bonuses and historical trend tracking.
- **Knowledge Catalog Scans Runner**: Dispatches and tracks Data Quality and Profile scans.
- **Estate Dashboard**: Real-time visibility into mesh-wide documentation gaps and trust indices.

---

### 4. Google Cloud Knowledge Catalog Discovery Agent
- **Semantic Question Decomposition**: Translates natural language inquiries into 3 distinct search variations (synonyms, technical database translations, and category breadth).
- **Predicate Extraction**: Extracts qualifiers (`type=table`, `system=bigquery`, `system=spanner`, `projectid=...`).
- **Knowledge Catalog Multi-Search**: Executes concurrent semantic searches with `semantic_search: true`.
- **Context Lookup (`lookupContext`)**: Calls Knowledge Catalog APIs to retrieve deep lineage, aspect schemas, and trust scores.

---

### 5. React UIX Studio & Cross-Domain Inventory
- **Real-Time Orchestration Console**: Interactive natural language query interface with live A2A timeline and confidence score badges.
- **Force-Directed Graph**: Visualizes cross-domain relationships, policy tags (`PII`, `FINANCIAL`), and data contract SLAs.
- **Data Trust Center & Document RAG**: Complete web UI for managing metadata propagation, data quality, and aspect schemas.
- **W3C DCAT v3 / JSON-LD Export**: Enterprise-standard linked data catalog export.

---

## 🧪 Verification & Execution
- **Integration Test Suite**: `npm test` runs 17 test suites (**99 / 99 tests passing**).
- **Frontend Production Build**: `cd UIX && npm run build` compiles with 0 errors.
- **Launch Command**: `npm run start:all`.
