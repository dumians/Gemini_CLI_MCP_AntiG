# start-all.ps1
# This script starts the entire Agentic Data Mesh locally.

Write-Host "--- Starting Agentic Data Mesh Local Stack ---" -ForegroundColor Cyan

# 1. Start Web UI in background
Write-Host "[1/3] Starting Web UI..." -ForegroundColor Yellow
Start-Process npm -ArgumentList "run dev" -WorkingDirectory "webapp" -NoNewWindow

# 2. Start Backend Orchestrator in background
Write-Host "[2/3] Starting Backend Orchestrator..." -ForegroundColor Yellow
Start-Process node -ArgumentList "server.js" -WorkingDirectory "server" -NoNewWindow

Write-Host "--- Mesh is booting up ---" -ForegroundColor Green
Write-Host "Web UI: http://localhost:5173"
Write-Host "Backend: http://localhost:3001"
Write-Host "Press Ctrl+C in this terminal to stop (Note: Background processes may need manual termination)."

# Keep the terminal open
while($true) { Start-Sleep -Seconds 1 }
