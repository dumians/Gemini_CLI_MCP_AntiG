# Enterprise Data Agents Solution Architecture

This document provides a high-level overview of the Multi-Domain Data Agent (A2A) orchestration system, including the system architecture and the process flow for a typical user query.

## Systems Architecture

The system is built on a modular, Agent-to-Agent (A2A) architecture. A Master Orchestrator delegates specialized tasks to sub-agents, each responsible for a specific data domain.

```mermaid
graph TD
    User((User)) -->|NL Query| WebUI["Web Dashboard (React/Vite)"]
    WebUI -->|API Request| API["Express API Server"]
    API -->|Ask| Orchestrator["Master Orchestrator (Gemini 1.5 Flash)"]

    subgraph "A2A Orchestration Layer"
        Orchestrator -->|Delegate| FinAgent["Financial Agent (Specialist)"]
        Orchestrator -->|Delegate| RetailAgent["Retail Agent (Specialist)"]
        Orchestrator -->|Delegate| AnalyticsAgent["Analytics Agent (Specialist)"]
        Orchestrator -->|Delegate| HRAgent["HR Agent (Specialist)"]
    end

    subgraph "MCP Infrastructure Layer"
        FinAgent -->|MCP Protocol| OracleMCP["Oracle MCP Server"]
        RetailAgent -->|MCP Protocol| SpannerMCP["Spanner MCP Server"]
        AnalyticsAgent -->|MCP Protocol| BQMCP["BigQuery MCP Server"]
        AnalyticsAgent -->|MCP Protocol| AlloyMCP["AlloyDB MCP Server"]
        HRAgent -->|MCP Protocol| OracleMCP["Oracle MCP Server"]
    end

    subgraph "Data Persistence (GCP)"
        OracleMCP --> OracleDB[("Oracle DB @GCP (ERP)")]
        SpannerMCP --> SpannerDB[("Spanner (Global Retail)")]
        BQMCP --> BigQuery[("BigQuery (EDW)")]
        AlloyMCP --> AlloyDB[("AlloyDB (CRM)")]
    end

    classDef agent fill:#f9f,stroke:#333,stroke-width:2px;
    classDef mcp fill:#bbf,stroke:#333,stroke-width:2px;
    classDef db fill:#dfd,stroke:#333,stroke-width:2px;
    
    class Orchestrator,FinAgent,RetailAgent,AnalyticsAgent,HRAgent agent;
    class OracleMCP,SpannerMCP,BQMCP,AlloyMCP mcp;
    class OracleDB,SpannerDB,BigQuery,AlloyDB db;
```

## Process Flow: Cross-Domain Query

The following sequence diagram illustrates the end-to-end flow of a complex, cross-domain query (e.g., "Analyze how recruitment delays in Oracle are affecting the Spanner Global supply chain based on BigQuery churn risk").

```mermaid
sequenceDiagram
    participant User
    participant UI as Web Dashboard
    participant API as Express API
    participant ORCH as Master Orchestrator
    participant FIN as Financial Agent
    participant RET as Retail Agent
    participant ANA as Analytics Agent

    User->>UI: Submits Query
    UI->>API: POST /api/query
    API->>ORCH: askOrchestrator(query)
    
    rect rgb(240, 240, 240)
        Note over ORCH: Reasoning: Needs HR (Oracle), Inventory (Spanner), & Risk (BQ)
        
        ORCH->>FIN: call_financial_agent(HR query)
        FIN->>ORCH: Return Oracle ERP data
        
        ORCH->>RET: call_retail_agent(Stock query)
        RET->>ORCH: Return Spanner Inventory data
        
        ORCH->>ANA: call_analytics_agent(Churn query)
        ANA->>ORCH: Return BigQuery segments
    end

    Note over ORCH: Synthesizing final response...
    ORCH->>API: Return { text, steps }
    API->>UI: JSON Response
    UI->>User: Displays Answer + Agent Chain + Graph
```

## Key Components

### 1. Web Dashboard (React + Vite)

- **Search Component:** Captures natural language queries.
- **Agent Chain:** Real-time visualization of the A2A reasoning steps and delegations.
- **Graph View:** Visualizes relationships between data nodes retrieved from different domains.

### 2. Master Orchestrator

- **Logic:** Uses Gemini 1.5 Flash to decompose queries.
- **Tools:** Defined as sub-agent delegation functions (`call_financial_agent`, etc.).
- **Synthesis:** Aggregates raw data from sub-agents into a human-readable strategic insight.

### 3. Specialized Sub-Agents

- **Financial Agent:** Expert in Oracle ERP schemas, Graph, and Vector search.
- **Retail Agent:** Expert in Spanner's distributed relational and graph capabilities.
- **Analytics Agent:** Expert in high-performance BigQuery analysis and AlloyDB CRM data.

### 4. MCP Servers

- Standardized interfaces that allow sub-agents to communicate with various database technologies securely and uniformly.
