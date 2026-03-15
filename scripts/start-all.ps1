# start-all.ps1
# This script starts the entire Agentic Data Mesh locally.

param(
    [switch]$LocalMCP = $false
)

Write-Host "--- Starting Agentic Data Mesh Local Stack ---" -ForegroundColor Cyan

# 0. Set Environment Defaults
Write-Host "[0/3] Configuring Environment..." -ForegroundColor Yellow

# Verify GEMINI_API_KEY
if (-not $env:GEMINI_API_KEY) {
    if (Test-Path ".env") {
        $envFile = Get-Content ".env" | ConvertFrom-StringData
        if ($envFile.GEMINI_API_KEY -and $envFile.GEMINI_API_KEY -ne "your_gemini_api_key_here") {
            $env:GEMINI_API_KEY = $envFile.GEMINI_API_KEY
        }
    }
}

if (-not $env:GEMINI_API_KEY) {
    Write-Host "WARNING: GEMINI_API_KEY is not set." -ForegroundColor Yellow
    $userInput = Read-Host "Please enter your Gemini API Key (or press Enter to skip if using another auth method)"
    if ($userInput) {
        $env:GEMINI_API_KEY = $userInput
        $saveChoice = Read-Host "Would you like to save this key to .env? (y/n)"
        if ($saveChoice -eq "y") {
            if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
            (Get-Content ".env") -replace "GEMINI_API_KEY=.*", "GEMINI_API_KEY=$userInput" | Set-Content ".env"
            Write-Host "      Saved API Key to .env" -ForegroundColor Gray
        }
    }
}

function Set_DefaultEnv($Name, $Value) {
    if (-not (Get-Item -Path "Env:$Name" -ErrorAction SilentlyContinue)) {
        [System.Environment]::SetEnvironmentVariable($Name, $Value, [System.EnvironmentVariableTarget]::Process)
        Write-Host "      Defaulted $Name to $Value" -ForegroundColor Gray
    }
}

Set_DefaultEnv "SPANNER_DATABASE_ID" "global-retail-db"
Set_DefaultEnv "BIGQUERY_DATASET_ID" "marketing_edw"
Set_DefaultEnv "BIGQUERY_LOCATION" "EU"
Set_DefaultEnv "ALLOYDB_REGION" "europe-west1"
Set_DefaultEnv "ALLOYDB_CLUSTER" "crm-cluster"
Set_DefaultEnv "ALLOYDB_INSTANCE" "crm-instance-1"
Set_DefaultEnv "ALLOYDB_USER" "postgres"
Set_DefaultEnv "ALLOYDB_DB" "postgres"
Set_DefaultEnv "ORACLE_CONNECT_STRING" "localhost:1521/xe"

# 1. Start local MCP servers if requested
if ($LocalMCP) {
    Write-Host "[0/3] Starting Local MCP Servers (SSE Mode)..." -ForegroundColor Yellow
    Start-Process node -ArgumentList "servers/alloydb-mcp/index.js --transport sse --port 3005" -NoNewWindow
    Start-Process node -ArgumentList "servers/bigquery-mcp/index.js --transport sse --port 3004" -NoNewWindow
    Start-Process node -ArgumentList "servers/oracle-mcp/index.js --transport sse --port 3003" -NoNewWindow
    Start-Process node -ArgumentList "servers/spanner-mcp/index.js --transport sse --port 3002" -NoNewWindow
    Start-Process node -ArgumentList "servers/oracle-mcp/index.js --transport sse --port 3006" -NoNewWindow
    Write-Host "      Local MCP SSE endpoints active: Spanner (3002), Oracle (3003), BQ (3004), AlloyDB (3005), HR (3006)" -ForegroundColor Gray

}

# 2. Start Web UI in background
Write-Host "[1/3] Starting Web UI..." -ForegroundColor Yellow
Start-Process npm.cmd -ArgumentList "run dev" -WorkingDirectory "webapp" -NoNewWindow

# 3. Start Backend Orchestrator in background
Write-Host "[2/3] Starting Backend Orchestrator..." -ForegroundColor Yellow
Start-Process npm.cmd -ArgumentList "run start" -WorkingDirectory "server" -NoNewWindow

Write-Host "--- Mesh is booting up ---" -ForegroundColor Green
Write-Host "Web UI: http://localhost:5173"
Write-Host "Backend: http://localhost:3001"
Write-Host "Press Ctrl+C in this terminal to stop (Note: Background processes may need manual termination)."

# Keep the terminal open
while ($true) { Start-Sleep -Seconds 1 }

