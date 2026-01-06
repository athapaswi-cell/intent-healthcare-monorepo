# Frontend Startup Script for Windows

Write-Host "Starting Frontend Development Server..." -ForegroundColor Green

# Navigate to frontend/web directory
Set-Location $PSScriptRoot\frontend\web

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting Vite development server..." -ForegroundColor Cyan
Write-Host ""

# Start the development server
npm run dev

