# FUSION startup script using uv (PowerShell)

Write-Host "Starting FUSION with uv..." -ForegroundColor Cyan

# Check if uv is installed
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "uv is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "  pip install uv" -ForegroundColor Yellow
    Write-Host "  or: curl -LsSf https://astral.sh/uv/install.sh | sh" -ForegroundColor Yellow
    exit 1
}

# Sync dependencies
Write-Host "Syncing dependencies..." -ForegroundColor Cyan
uv sync --no-install-project

# Initialize database if needed
if (-not (Test-Path "fusion.db")) {
    Write-Host "Initializing database..." -ForegroundColor Cyan
    uv run --directory . python -m db
}

# Start services
Write-Host "Starting FUSION services..." -ForegroundColor Cyan
uv run --directory . python start_fusion_uv.py


Write-Host "Starting FUSION with uv..." -ForegroundColor Cyan

# Check if uv is installed
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "uv is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "  pip install uv" -ForegroundColor Yellow
    Write-Host "  or: curl -LsSf https://astral.sh/uv/install.sh | sh" -ForegroundColor Yellow
    exit 1
}

# Sync dependencies
Write-Host "Syncing dependencies..." -ForegroundColor Cyan
uv sync --no-install-project

# Initialize database if needed
if (-not (Test-Path "fusion.db")) {
    Write-Host "Initializing database..." -ForegroundColor Cyan
    uv run --directory . python -m db
}

# Start services
Write-Host "Starting FUSION services..." -ForegroundColor Cyan
uv run --directory . python start_fusion_uv.py
