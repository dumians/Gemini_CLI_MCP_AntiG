# start-all.ps1
# This script starts the entire Agentic Data Mesh locally.

param(
    [switch]$LocalMCP = $false
)

Write-Host "--- Starting Agentic Data Mesh Local Stack ---" -ForegroundColor Cyan

# 1. Start local MCP servers if requested
if ($LocalMCP) {
    Write-Host "[0/3] Starting Local MCP Servers (SSE Mode)..." -ForegroundColor Yellow
    Start-Process node -ArgumentList "servers/alloydb-mcp/index.js --transport sse --port 3005" -NoNewWindow
    Start-Process node -ArgumentList "servers/bigquery-mcp/index.js --transport sse --port 3004" -NoNewWindow
    Start-Process node -ArgumentList "servers/oracle-mcp/index.js --transport sse --port 3003" -NoNewWindow
    Start-Process node -ArgumentList "servers/spanner-mcp/index.js --transport sse --port 3002" -NoNewWindow
    Start-Process node -ArgumentList "servers/oracle-mcp/index.js --transport sse --port=3006" -NoNewWindow
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

