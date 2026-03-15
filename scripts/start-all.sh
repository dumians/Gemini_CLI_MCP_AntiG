#!/bin/bash

# start-all.sh
# This script starts the entire Agentic Data Mesh locally on Linux/Mac.

LOCAL_MCP=false
if [[ "$1" == "--LocalMCP" ]]; then
    LOCAL_MCP=true
fi

echo -e "\033[0;36m--- Starting Agentic Data Mesh Local Stack ---\033[0m"

# 0. Set Environment Defaults
echo -e "\033[0;33m[0/3] Configuring Environment...\033[0m"

# Verify GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    if [ -f ".env" ]; then
        source .env
    fi
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "\033[0;33mWARNING: GEMINI_API_KEY is not set.\033[0m"
    read -p "Please enter your Gemini API Key: " user_key
    if [ ! -z "$user_key" ]; then
        export GEMINI_API_KEY=$user_key
        read -p "Would you like to save this key to .env? (y/n): " save_choice
        if [[ "$save_choice" =~ ^[Yy]$ ]]; then
            if [ ! -f ".env" ]; then cp .env.example .env; fi
            sed -i "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$user_key/" .env
            echo -e "\033[0;37m      Saved API Key to .env\033[0m"
        fi
    fi
fi

# Function to set default env var if not set
set_default_env() {
    local name=$1
    local value=$2
    if [ -z "${!name}" ]; then
        export "$name"="$value"
        echo -e "\033[0;37m      Defaulted $name to $value\033[0m"
    fi
}

set_default_env "SPANNER_DATABASE_ID" "global-retail-db"
set_default_env "BIGQUERY_DATASET_ID" "marketing_edw"
set_default_env "BIGQUERY_LOCATION" "US"
set_default_env "ALLOYDB_REGION" "us-central1"
set_default_env "ALLOYDB_CLUSTER" "crm-cluster"
set_default_env "ALLOYDB_INSTANCE" "crm-instance-1"
set_default_env "ALLOYDB_USER" "postgres"
set_default_env "ALLOYDB_DB" "postgres"
set_default_env "ORACLE_CONNECT_STRING" "localhost:1521/xe"

# 1. Start local MCP servers if requested
if [ "$LOCAL_MCP" = true ]; then
    echo -e "\033[0;33mStarting Local MCP Servers (SSE Mode)...\033[0m"
    node servers/alloydb-mcp/index.js --transport sse --port 3005 &
    node servers/bigquery-mcp/index.js --transport sse --port 3004 &
    node servers/oracle-mcp/index.js --transport sse --port 3003 &
    node servers/spanner-mcp/index.js --transport sse --port 3002 &
    node servers/oracle-mcp/index.js --transport sse --port 3006 &
    echo -e "\033[0;37m      Local MCP SSE endpoints active: Spanner (3002), Oracle (3003), BQ (3004), AlloyDB (3005), HR (3006)\033[0m"
fi

# 2. Start Web UI in background
echo -e "\033[0;33m[1/3] Starting Web UI...\033[0m"
(cd webapp && npm run dev) &

# 3. Start Backend Orchestrator in background
echo -e "\033[0;33m[2/3] Starting Backend Orchestrator...\033[0m"
(cd server && npm run start) &

echo -e "\033[0;32m--- Mesh is booting up ---\033[0m"
echo "Web UI: http://localhost:5173"
echo "Backend: http://localhost:3001"
echo "Press Ctrl+C to stop (Note: Background processes may need manual termination)."

# Keep the script running
wait
