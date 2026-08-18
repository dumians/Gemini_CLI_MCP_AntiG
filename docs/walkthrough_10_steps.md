summary: Comprehensive 10-step walkthrough for building, governing, and exploring the Enterprise Agentic Data Mesh (MeshOS) on GCP.
id: agentic-data-mesh-mcp
categories: AI, Data, GCP, KnowledgeCatalog
tags: Gemini, MCP, OneMCP, DataMesh, Spanner, BigQuery, Oracle, AlloyDB, KnowledgeCatalog
status: Published
authors: Google Cloud AI & Data Architect Team

# Building and Governing an Enterprise Agentic Data Mesh with Gemini and GCP One-MCP

![MeshOS Enterprise Architecture](images/gcp_agentic_mesh_unified_architecture.png)

## 0. Executive Overview
Duration: 3:00

**MeshOS** is an enterprise-grade **Autonomous Agentic Data Mesh platform** on Google Cloud Platform (GCP). It unifies relational, graph, vector, analytics, and SaaS ERP systems into a decentralized, collaborative multi-agent mesh.

In this walkthrough, you will explore:
1. **Multi-Agent Orchestration**: Master Orchestrator powered by Gemini 2.5 Flash / Pro.
2. **GCP One-MCP Gateway**: Centralized, Zero-Trust Model Context Protocol gateway.
3. **9 Enterprise Data Domains**: Oracle ERP, Spanner Retail, BigQuery Analytics, AlloyDB CRM, NetSuite, Warehouse, HR, Catalog, and API.
4. **Google Cloud Knowledge Catalog Governance Agent**: Document RAG data stewardship, lineage-based column description propagation, and AutoDQ Trust Center.
5. **Google Cloud Knowledge Catalog Discovery Agent**: Semantic query decomposition, multi-search with `semantic_search: true`, and `lookupContext` API enrichment.
6. **Cross-Domain Force Graph & UI Studio**: Interactive real-time canvas, policy tag inspector, and W3C DCAT v3 JSON-LD export.

---

## 1. Environment Setup & Configuration
Duration: 5:00

1. **Clone the Repository & Install Dependencies**:
   ```bash
   git clone https://github.com/GoogleCloudPlatform/agenticmesh.git
   cd agenticmesh
   npm install
   cd UIX && npm install && cd ..
   ```

2. **Configure `.env`**:
   ```env
   PORT=3000
   GCP_PROJECT_ID="your-gcp-project-id"
   GEMINI_API_KEY="your-gemini-api-key"
   GCP_ONE_MCP_ENABLED="true"
   ONE_MCP_MODE="unified"
   KNOWLEDGE_CATALOG_LOCATION="europe-west3"
   BIGQUERY_DATASET_ID="marketing_edw"
   USE_REAL_CONNECTIONS="false"
   ```

3. **Launch the Mesh Stack**:
   ```bash
   npm run start:all
   ```

---

## 2. The Decentralized 9 Data Mesh Domains
Duration: 7:00

MeshOS organizes enterprise data into 9 decentralized, contract-bounded domains:
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

## 3. GCP One-MCP Unified Gateway Topology
Duration: 8:00

Explore the **GCP One-MCP Gateway** (`servers/one-mcp/index.js`):
- **Universal Tool Aggregation**: Aggregates 31+ domain tools into a single endpoint (`http://localhost:8088/sse`).
- **Zero-Trust Scoping**: Prevents cross-domain lateral access by filtering tools dynamically according to agent identity.
- **4 Runtime Modes**: `unified`, `microservices`, `local`, and `toolbox`.

---

## 4. Knowledge Catalog Labs AI Discovery Agent
Duration: 10:00

Navigate to the **Discovery & Drift** tab in the UI:
1. Enter a natural language request: *"Find customer revenue, churn risk, and billing data in BigQuery and Spanner."*
2. Inspect the **Semantic Question Decomposition**:
   - *Variation 1 (Direct Synonyms)*: `customer revenue marketing_edw`
   - *Variation 2 (Technical Schema Translation)*: `spend OR total_amount OR gross_revenue`
   - *Variation 3 (Category Breadth)*: `omnichannel retail sales transaction store`
   - *Extracted Predicates*: `type=table`, `system=bigquery`, `system=spanner`
3. View the **Context Lookup** and **Reranked Matches** with match score percentages.

---

## 5. Knowledge Catalog Labs Data Governance & Document RAG
Duration: 10:00

Open the **Document RAG** and **Lineage & Descriptions** tabs:
1. **Upload Data Dictionaries**: Ingest Markdown or PDF data dictionaries. Gemini automatically extracts table schemas and column definitions.
2. **Preview Lineage Description Propagation**: Propagate upstream column definitions down to curated views with automated SQL transformation explanations (`COALESCE`, `SUM`, `SAFE_CAST`).
3. **AI Business Glossary**: Bind standardized glossary terms to Knowledge Catalog entry schemas.

---

## 6. Data Trust Center & AutoDQ Scoring
Duration: 7:00

Open the **Data Trust Center** tab:
1. Inspect the derived Data Quality (DQ) score across multi-hop lineage.
2. Review automatic **SQL Remediation Bonuses** (`COALESCE` $+8\%$, `DISTINCT` $+4\%$, `SAFE_CAST` $+5\%$).
3. Monitor historical drift trends (`Improving`, `Stable`, `Degrading`).
4. Dispatch and track **Knowledge Catalog Data Quality & Profile Scans**.

---

## 7. Master Orchestrator Context Fusion & GraphRAG Grounding
Duration: 10:00

Submit a cross-domain strategic query in the main dashboard:
> *"Analyze how supplier delivery delays in Oracle ERP and stockouts in Spanner Retail correlate with VIP customer churn risk in BigQuery."*

1. **Context Fusion**: Intermediate domain data products are shared across sequential agent calls.
2. **GraphRAG Grounding**: The Orchestrator cites verifiable database graph paths (`Supplier -> PO -> Inventory -> Customer`), eliminating AI hallucinations.

---

## 8. Cross-Domain Inventory & Force-Directed Graph
Duration: 8:00

Open the **Cross-Domain Inventory** in the UI:
- Interactive **Force-Directed Graph** rendering cross-domain links.
- Click nodes to inspect schema attributes, policy tags (`PII`, `FINANCIAL`, `RESTRICTED`), and SLA contracts.
- Export metadata as **W3C DCAT v3 / JSON-LD**.

---

## 9. Cloud Run & Cloud Build Production Deployment
Duration: 8:00

Deploy the complete stack to Google Cloud:
1. Use `cloudbuild.yaml` with regional logging:
   ```yaml
   options:
     logging: CLOUD_LOGGING_ONLY
   ```
2. Deploy the Express Gateway, One-MCP Gateway, and React UIX Studio to **Cloud Run**.
3. Enforce **Google Secret Manager** runtime secret mounting.

---

## 10. Verification & Test Suite
Duration: 5:00

Verify system integrity across all 17 integration suites:
```bash
# Run all 99 automated integration tests
npm test

# Build production React frontend
cd UIX && npm run build
```

**Congratulations! You have completed the comprehensive walkthrough of the Enterprise Agentic Data Mesh.**
