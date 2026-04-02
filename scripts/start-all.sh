#!/bin/bash

export PATH="/opt/homebrew/bin:$PATH"

# start-all.sh
# This script starts the entire Agentic Data Mesh locally on Linux/Mac.

LOCAL_MCP=false
if [[ "$1" == "--LocalMCP" ]]; then
    LOCAL_MCP=true
fi

echo -e "\033[0;36m--- Starting Agentic Data Mesh Local Stack ---\033[0m"

# 0. Cleanup Old Processes & Set Environment Defaults
echo -e "\033[0;33m[0/4] Cleaning up old processes...\033[0m"
lsof -ti:3000,3001,5173,5174,3002,3003,3004,3005,3006 | xargs kill -9 2>/dev/null

echo -e "\033[0;33m[1/4] Configuring Environment...\033[0m"

# Verify GEMINI_API_KEY and export all .env variables
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
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
set_default_env "BIGQUERY_LOCATION" "EU"
set_default_env "ALLOYDB_REGION" "europe-west1"
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

# 2. Start UIX App in background
echo -e "\033[0;33m[2/4] Starting UIX App...\033[0m"
(cd UIX && npm run dev) &

# 3. Start Backend Orchestrator in background
echo -e "\033[0;33m[3/4] Starting Backend Orchestrator...\033[0m"
(cd server && npm run start) &

echo -e "\033[0;32m--- Mesh is booting up ---\033[0m"
echo "UIX App: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "Press Ctrl+C to stop."

# Cleanup function to kill background processes on exit
cleanup() {
    echo -e "\n\033[0;31mStopping Mesh OS and cleaning up processes...\033[0m"
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM EXIT

# Keep the script running
wait
