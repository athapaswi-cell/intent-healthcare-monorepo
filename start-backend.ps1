# Backend Startup Script for Windows

Write-Host "=== Starting Intent-Based Medical App Backend ===" -ForegroundColor Green
Write-Host ""

# Set PYTHONPATH to project root
$env:PYTHONPATH = $PSScriptRoot

# Check if virtual environment exists
$venvPath = Join-Path $PSScriptRoot "backend\venv"
if (Test-Path $venvPath) {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & "$venvPath\Scripts\Activate.ps1"
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\backend"
    python -m venv venv
    & ".\venv\Scripts\Activate.ps1"
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    Set-Location $PSScriptRoot
}

# Check if requirements are installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
python -c "import fastapi, uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\backend"
    pip install -r requirements.txt
    Set-Location $PSScriptRoot
}

Write-Host ""
Write-Host "Starting FastAPI server..." -ForegroundColor Cyan
Write-Host "Backend URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server from project root
Set-Location $PSScriptRoot
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

