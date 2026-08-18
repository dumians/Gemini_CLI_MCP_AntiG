# Enterprise Data Agents - GCP Production Deployment Blueprint

This document outlines the professional deployment blueprint for the **MeshOS** Multi-Domain Agentic Data Mesh orchestration system on Google Cloud Platform (GCP). It encompasses serverless compute, managed persistence, zero-trust MCP gateway topology, Knowledge Catalog governance and discovery services, networking, and CI/CD best practices.

![MeshOS Enterprise Architecture](images/gcp_agentic_mesh_unified_architecture.png)

---

## 1. High-Level Component Deployment Architecture

```mermaid
graph TD
    User((Enterprise Users)) --> |HTTPS / TLS 1.3| GLB[Cloud Global Load Balancer + Cloud Armor WAF]
    GLB --> |Serverless NEG| UIRun[Cloud Run: React UIX Studio]
    GLB --> |Serverless NEG| APIGW[Cloud Run: Express Mesh API]

    subgraph "Compute & Orchestration Layer (Serverless Cloud Run)"
        APIGW --> |Direct VPC Egress| ORCH[Cloud Run: Master Orchestrator (Gemini 2.5)]
        ORCH --> |Internal gRPC/HTTP| OneMCP[Cloud Run: GCP One-MCP Unified Gateway]
        
        OneMCP --> GovAgent[Cloud Run: Knowledge Catalog Governance Agent]
        OneMCP --> DiscAgent[Cloud Run: Knowledge Catalog Discovery Agent]
        OneMCP --> DomainAgents[Cloud Run: 9 Domain Specialists]
    end

    subgraph "Data Persistence & Metadata Layer (GCP Managed Services)"
        DomainAgents -.-> |VPC Peering| OracleDB[(Oracle DB@GCP Exadata / BMS)]
        DomainAgents -.-> |Private API| Spanner[(Cloud Spanner Multi-Region)]
        DomainAgents -.-> |Private API| BigQuery[(BigQuery Analytics EDW)]
        DomainAgents -.-> |Private Service Connect| AlloyDB[(AlloyDB PostgreSQL + pgvector)]
        GovAgent & DiscAgent -.-> |Private API| KnowledgeCatalog[(Google Cloud Knowledge Catalog)]
    end

    subgraph "Security & Operational Governance"
        SecretManager[Google Secret Manager]
        CloudLogging[Cloud Logging: CLOUD_LOGGING_ONLY]
        CloudTrace[Cloud Trace Distributed Tracing]
    end
    
    ORCH -.-> SecretManager
    OneMCP -.-> SecretManager
    APIGW -.-> CloudLogging
    ORCH -.-> CloudTrace
```

---

## 2. Serverless Compute Layer (Google Cloud Run)

All compute components run on **Google Cloud Run** to achieve automatic scaling, cost optimization (scale-to-zero during off-hours), and microsecond elasticity during query surges:

1. **React UIX Studio**: Deployed as a containerized SPA served via NGINX or Firebase App Hosting.
2. **Express Mesh API Server**: Exposes REST and WebSocket endpoints for agent coordination and client streaming.
3. **Master Orchestrator**: Containerized Node.js service running the Gemini 2.5 Flash / Pro reasoning engine, Context Fusion, and Data Contract validation.
4. **GCP One-MCP Unified Gateway**: Runs on Cloud Run configured with SSE transport enabled on port 8088 (`/sse` and `/messages`) or stdio in sidecar deployments.
5. **Knowledge Catalog Governance & Discovery Agents**: Dedicated background workers for document ingestion RAG, lineage propagation, policy tag auditing, and multi-query decomposition.
6. **9 Domain Specialists**: Microservices with isolated service accounts, enforcing least-privilege data access per domain.

---

## 3. Database & Persistence Layer

* **Cloud Spanner (Retail Domain)**: Multi-region configuration with Spanner Graph schemas and native Vector search (`ARRAY<FLOAT32>`).
* **BigQuery (Analytics Domain)**: Serverless analytical warehouse housing `marketing_edw` datasets with BigQuery ML models for churn scoring.
* **AlloyDB for PostgreSQL (CRM Domain)**: High-availability AlloyDB cluster with the `pgvector` extension for customer ticket similarity analysis, connected via Private Service Connect (PSC).
* **Oracle Database@Google Cloud (ERP & HR Domains)**: Oracle Exadata Database Service / Bare Metal Solution connected over dedicated VPC Peering with TCPS / mTLS encryption.
* **Google Cloud Knowledge Catalog (Catalog & Governance)**: Centralized metadata catalog managing custom Aspect Types (`governance`, `data_quality`, `security_privacy`), entry groups, and Data Quality scans.

---

## 4. Enterprise CI/CD with Cloud Build

The deployment pipeline is fully automated using **Cloud Build** with enforced regional user-owned logging and service account security:

### `cloudbuild.yaml`
```yaml
steps:
  # 1. Install dependencies & Run Integration Test Suite
  - name: 'node:20-alpine'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        npm ci
        npm test
        cd UIX && npm ci && npm run build

  # 2. Build Container Image with Cloud Native Buildpacks / Docker
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'europe-west3-docker.pkg.dev/$PROJECT_ID/meshos-repo/agenticmesh:$COMMIT_SHA'
      - '-t'
      - 'europe-west3-docker.pkg.dev/$PROJECT_ID/meshos-repo/agenticmesh:latest'
      - '.'

  # 3. Push to Google Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - 'europe-west3-docker.pkg.dev/$PROJECT_ID/meshos-repo/agenticmesh'

  # 4. Deploy Express Mesh Gateway & Orchestrator to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'meshos-gateway'
      - '--image=europe-west3-docker.pkg.dev/$PROJECT_ID/meshos-repo/agenticmesh:$COMMIT_SHA'
      - '--region=europe-west3'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--set-env-vars=NODE_ENV=production,GCP_ONE_MCP_ENABLED=true,ONE_MCP_MODE=unified'
      - '--set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest'

# Explicit Service Account and Cloud Logging Configuration
serviceAccount: 'projects/$PROJECT_ID/serviceAccounts/cloudbuild-deployer@$PROJECT_ID.iam.gserviceaccount.com'
options:
  logging: CLOUD_LOGGING_ONLY
```

---

## 5. Security & IAM Governance

* **Zero-Trust Tool Scoping**: The GCP One-MCP Gateway checks bearer tokens and agent identity to ensure domain isolation.
* **Secret Management**: Google Secret Manager injects database credentials, API tokens, and private keys dynamically into memory at container startup.
* **Least Privilege IAM**:
  - `meshos-orchestrator@`: Has `roles/run.invoker` and `roles/aiplatform.user`.
  - `meshos-analytics@`: Has `roles/bigquery.dataViewer` and `roles/bigquery.jobUser`.
  - `meshos-knowledge-catalog@`: Has `roles/dataplex.admin` and `roles/datacatalog.tagEditor`.
