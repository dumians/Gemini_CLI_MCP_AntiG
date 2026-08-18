# Technical Deployment Blueprint: Agentic Data Mesh on GCP

![GCP Agentic Data Mesh Unified Architecture](images/gcp_agentic_mesh_unified_architecture.png)
*High-definition architectural blueprint of the MeshOS Agentic Data Mesh on Google Cloud Platform.*

This document provides a deep-dive into the technical service configuration, reactive data flows, and zero-trust security boundaries for the **MeshOS** Agentic Data Mesh on Google Cloud Platform.

---

## 1. System Component Mapping

| Layer | Component | GCP Service | Configuration & Enterprise Role |
| :--- | :--- | :--- | :--- |
| **Ingress & Perimeter** | Global Entry Point | **Cloud Armor + Global Load Balancer** | Layer 7 WAF, DDoS protection, SSL termination, and CDN caching. |
| | API Gateway | **Cloud Run Gateway / Apigee** | JWT validation, rate limiting, and request tracing with Cloud Trace. |
| **Orchestration Plane** | Master Orchestrator | **Cloud Run (Serverless)** | Runs Gemini 2.5 Flash / Pro reasoning engine, Context Fusion, and Data Contract validation. |
| **Unified Access Gateway** | GCP One-MCP Gateway | **Cloud Run (SSE on Port 8088 / Stdio)** | Centralized MCP server aggregating 31+ tools across 9 domains with zero-trust domain scoping. |
| **Governance & Discovery** | Knowledge Catalog Governance Agent | **Cloud Run + Knowledge Catalog v1** | Document RAG engine, lineage-based description propagation, policy tags, and AutoDQ Trust Center. |
| | Knowledge Catalog Discovery Agent | **Cloud Run + Vertex AI** | Semantic query decomposition, multi-search with `semantic_search: true`, and `lookupContext` API calls. |
| **Decentralized Domains** | 9 Domain Specialists | **Cloud Run Microservices** | Specialized domain agents (BigQuery, Spanner, AlloyDB, Oracle DB, NetSuite, Warehouse, HR, Catalog, API). |
| **Persistence Tier** | Analytical Warehouse | **BigQuery** | Serverless data warehouse with BigQuery ML models for churn risk. |
| | Global Relational & Graph | **Cloud Spanner** | Multi-region globally distributed database with Spanner Graph and native Vector indexing (`ARRAY<FLOAT32>`). |
| | Operational CRM | **AlloyDB for PostgreSQL** | Managed high-performance database with `pgvector` indexing for ticket semantic similarity. |
| | Mission-Critical ERP | **Oracle DB@GCP / BMS** | Oracle Exadata Database Service / Bare Metal Solution with Oracle AI Vector Search & Graph. |
| | SaaS Cloud ERP | **NetSuite SuiteTalk** | Secure REST/OAuth2 connector for sales orders and inventory receipts. |
| **Security & Observability**| Identity Management | **Cloud IAM + Workload Identity** | Least-privilege service accounts per domain; Zero-Trust tool authorization. |
| | Secret Management | **Google Secret Manager** | Secure storage and runtime mounting of API keys, DB credentials, and OAuth tokens. |
| | Logging & Audit | **Cloud Logging + Cloud Monitoring** | Unified logging with `CLOUD_LOGGING_ONLY` and Cloud Trace distributed tracing. |

---

## 2. Technical Data Flow & Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant U as User / Web Dashboard
    participant LB as Cloud Load Balancer (Cloud Armor)
    participant AG as Express API Gateway (Cloud Run)
    participant OR as Master Orchestrator (Cloud Run)
    participant MCP as GCP One-MCP Gateway (Cloud Run)
    participant GOV as Knowledge Catalog Governance Agent
    participant SA as Domain Specialist (Cloud Run)
    participant DB as GCP Persistence Tier (BQ / Spanner / AlloyDB / Oracle)

    U->>LB: 1. Send Natural Language Query (HTTPS)
    LB->>AG: 2. Route via Serverless NEG to API Gateway
    AG->>OR: 3. Invoke Master Orchestrator with Context Trace ID

    rect rgb(20, 30, 50)
        Note over OR,GOV: AI Semantic Discovery & Lineage Grounding
        OR->>MCP: decompose_and_discover_assets(query)
        MCP->>GOV: Run Semantic Question Decomposition (3 variations + predicates)
        GOV-->>MCP: Return Ranked Assets + Knowledge Catalog Context
        MCP-->>OR: Grounded Metadata, Schemas & Constraints
    end

    rect rgb(30, 45, 70)
        Note over OR,SA: Cross-Domain A2A Reasoning & Execution
        OR->>MCP: call_financial_agent("Retrieve overdue POs")
        MCP->>SA: Route to Financial Specialist (Scoped Token)
        SA->>DB: Query Oracle ERP (SQL & Graph)
        DB-->>SA: Return Delayed Suppliers & PO Lines
        SA-->>MCP: Formatted Data Product (Financials)
        MCP-->>OR: Grounded Financial Insight

        OR->>MCP: call_retail_agent("Check stock for delayed SKUs")
        MCP->>SA: Route to Retail Specialist (Inherited Context)
        SA->>DB: Query Cloud Spanner (Graph Traversal & SQL)
        DB-->>SA: Return Store Stockouts & Alternate Hubs
        SA-->>MCP: Formatted Data Product (Retail)
        MCP-->>OR: Grounded Supply Chain Insight

        OR->>MCP: call_analytics_agent("Correlate Churn & Support Tickets")
        MCP->>SA: Route to Analytics Specialist
        SA->>DB: BigQuery EDW + AlloyDB CRM
        DB-->>SA: Churn Risk Scores & Open Escalations
        SA-->>MCP: Formatted Data Product (Analytics & CRM)
        MCP-->>OR: Grounded Customer Impact Insight
    end

    rect rgb(25, 40, 60)
        Note over OR,GOV: Governance Verification & Trust Scoring
        OR->>MCP: calculate_data_trust_scores()
        MCP->>GOV: Run AutoDQ Multi-Hop Scoring
        GOV-->>MCP: Attestation Report (96% Trust Index)
        MCP-->>OR: Governance Verified
    end

    OR->>AG: 4. Synthesize Final Executive Response + Cross-Domain Graph
    AG->>LB: 5. Stream JSON Response
    LB->>U: 6. Render Strategic Dashboard, Timeline & Graph
```

---

## 3. GraphRAG Grounding & Anti-Guessing Protocol

MeshOS prevents generative hallucinations through strict **GraphRAG Grounding**:

1. **Path-Based Evidence Extraction**: When querying across domains, agents execute graph traversals across **Cloud Spanner Graph** (`(Store)-[:STOCKS]->(Inventory)-[:SOURCED_FROM]->(Supplier)`) and **Oracle Graph**.
2. **Context Passing across Sub-Agents**: Sub-agents pass intermediate factual graph nodes as structured inputs to downstream specialists.
3. **Data Product Contracts**: Outputs must conform to the `DataProductContract` JSON schema, validating domain source, confidence scores, and lineage hashes.
4. **Immutable Fact Citations**: The Master Orchestrator synthesizes answers while explicitly citing verified graph paths, eliminating hallucination.

---

## 4. Zero-Trust Security & Network Architecture

```mermaid
graph TD
    subgraph "Public Ingress Zone"
        Internet((Internet)) --> WAF[Cloud Armor WAF]
        WAF --> GLB[Global External HTTP(S) Load Balancer]
        GLB --> UIXService[Cloud Run: React UIX Studio]
        GLB --> APIService[Cloud Run: Express Mesh API]
    end

    subgraph "Private Serverless VPC Network (10.0.0.0/16)"
        APIService -->|Direct VPC Egress| OrchestratorService[Cloud Run: Master Orchestrator]
        OrchestratorService -->|Internal IAM Authenticated| OneMCPService[Cloud Run: GCP One-MCP Gateway]
        
        OneMCPService --> GovService[Cloud Run: Knowledge Catalog Governance Agent]
        OneMCPService --> DiscService[Cloud Run: Knowledge Catalog Discovery Agent]
        OneMCPService --> DomainServices[Cloud Run: 9 Domain Specialists]
    end

    subgraph "GCP Private Data Services"
        DomainServices -.->|Private Service Connect| AlloyDBPSC[AlloyDB Cluster]
        DomainServices -.->|VPC Network Peering| OracleVPC[Oracle DB@GCP Exadata]
        DomainServices -.->|Google Private APIs| SpannerPrivate[Cloud Spanner Instance]
        DomainServices -.->|Google Private APIs| BigQueryPrivate[BigQuery Enterprise Datasets]
        GovService & DiscService -.->|Google Private APIs| DataplexPrivate[Knowledge Catalog API]
    end
```

### Security Guardrails
- **Service-to-Service Authentication**: Internal Cloud Run services require Google OIDC authentication tokens with `roles/run.invoker`.
- **Domain Tool Isolation**: MCP Gateway inspects agent identity tokens to restrict tool execution strictly to authorized domains.
- **Dynamic Policy Tags & DLP Masking**: Sensitive fields (`EMAIL`, `CREDIT_CARD`, `SALARY`) are tagged with Knowledge Catalog Taxonomy Policy Tags and masked in transit.
- **Secret Zero-Exposure**: Secret Manager injects database credentials dynamically into memory without storing tokens on disk or in container layers.
