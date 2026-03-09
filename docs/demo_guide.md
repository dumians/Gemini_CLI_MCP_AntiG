# Enterprise Data Agents Demo (ADK) Setup & Guide

This demo simulates a powerful "Data Agent" operating across four Google Cloud databases: Oracle DB@GCP, Spanner, BigQuery, and AlloyDB.
It showcases the ability of the Gemini AI to orchestrate Natural Language queries into disparate querying languages (Standard SQL, Oracle Graph, Spanner GQL, pgvector, Oracle AI Vector Search) and synthesize the results.

## Prerequisites & Setup (GCP)

1. **Authentication**:
   Ensure you are logged into Google Cloud locally so the agent can access your projects:

   ```bash
   gcloud auth application-default login
   ```

2. **Database Configurations**:
   For this demo, the Node.js MCP servers (`servers/oracle-mcp`, `servers/spanner-mcp`, `servers/bigquery-mcp`) return *simulated* JSON responses mimicking actual API outputs.
   To wire them up to your live GCP instances, you would:
   - Provide your typical Connection Strings / Service Accounts to the `new BigQuery(...)` or `new Spanner(...)` initializers.
3. **Environment Variables**:
   Create a `.env` file in the project root:

   ```env
   GEMINI_API_KEY="your-gemini-key-here"
   ```

## Running the Demo

Start the core Data Agent CLI:

```bash
npm start
```

The agent orchestrator will spawn the underlying MCP servers as separate processes via stdio, load their schemas, and provide a prompt loop for you to interrogate your data domains.

## Demo Scenarios

Try the following complex prompts to test the Agent's cross-domain reasoning and tool orchestration:

### Scenario 1: Analytical + Graph + Vector (The "Holy Grail" Query)

*Tests BigQuery SQL, Spanner GQL, and Oracle Vector Search.*

**Prompt:**
> "Find VIP customers in BigQuery, trace their recent purchase path globally through our Spanner supply chain graph to check for delays, and then search our Oracle systems using Vector similarity to see if any high-value anomalies match this supply chain disruption."
**Expected Agent Action:**

1. Call `query_bigquery` for the VIP list.
2. Feed those IDs conceptually into `query_spanner_graph` to perform a Graph Traversal (GQL).
3. Feed the resulting compromised node/path to `query_oracle_vector` to check transaction metadata.
4. Synthesize entirely for the user.

### Scenario 2: Standard Financials + ERP Networking

*Tests Oracle SQL and Oracle Graph.*

**Prompt:**
> "Who are our top 3 suppliers by invoice volume in the Oracle DB, and what does their 3rd party vendor network look like in Oracle Graph?"
**Expected Agent Action:**

1. Call `query_oracle_sql` to parse structured ERP tables.
2. Call `query_oracle_graph` to map out connected entities up to 3 degrees.

### Scenario 3: Global Retail Operations

*Tests Spanner SQL vs. Analytical Data.*

**Prompt:**
> "What is the real-time stock level for Store NYC-01 in Spanner, and how does that compare to the analytical segment metrics we have in BigQuery for New York VIPs?"
**Expected Agent Action:**

1. Call `query_spanner_sql`.
2. Call `query_bigquery`.
3. Provide a unified summary.
