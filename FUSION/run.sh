#!/bin/bash
# FUSION startup script using uv

echo "Starting FUSION with uv..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv is not installed. Installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# Sync dependencies
echo "Syncing dependencies..."
uv sync --no-install-project

# Initialize database if needed
if [ ! -f "fusion.db" ]; then
    echo "Initializing database..."
    uv run --directory . python -m db
fi

# Start services
echo "Starting FUSION services..."
uv run --directory . python start_fusion_uv.py



echo "Starting FUSION with uv..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv is not installed. Installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# Sync dependencies
echo "Syncing dependencies..."
uv sync --no-install-project

# Initialize database if needed
if [ ! -f "fusion.db" ]; then
    echo "Initializing database..."
    uv run --directory . python -m db
fi

# Start services
echo "Starting FUSION services..."
uv run --directory . python start_fusion_uv.py
