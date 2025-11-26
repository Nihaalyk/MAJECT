# FUSION Quick Start with uv

## Prerequisites

Install `uv` if you haven't already:

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
# or
pip install uv
```

## Quick Start

### Option 1: Use the startup script (Recommended)

**On Unix/macOS:**
```bash
cd FUSION
bash run.sh
```

**On Windows (PowerShell):**
```powershell
cd FUSION
.\run.ps1
```

### Option 2: Manual steps

```bash
cd FUSION

# 1. Sync dependencies (installs all required packages)
uv sync --no-install-project

# 2. Initialize database (first time only)
uv run --directory . python -m db

# 3. Start all services
uv run --directory . python start_fusion_uv.py
```

### Option 3: Start services separately

**Terminal 1 - API Server:**
```bash
cd FUSION
uv run --directory . python -m api
```

**Terminal 2 - BEVAL Collector:**
```bash
cd FUSION
uv run --directory . python -m integration
```

## Verify Installation

1. **Check API is running:**
   ```bash
   curl http://localhost:8083/health
   ```
   Should return: `{"status":"healthy","service":"FUSION API"}`

2. **Check metrics endpoint:**
   ```bash
   curl http://localhost:8083/api/metrics/context/test-session?window=30
   ```

## Integration with CONVEI

Once FUSION is running, integrate it into CONVEI:

1. **Wrap your CONVEI app:**
   ```tsx
   import { BehavioralContextProvider } from '../FUSION/context/BehavioralContext';
   
   <BehavioralContextProvider>
     <YourApp />
   </BehavioralContextProvider>
   ```

2. **Use metrics in agents:**
   ```tsx
   import { useBehavioralMetrics } from '../FUSION/context/useBehavioralMetrics';
   
   const { metrics, getContextString } = useBehavioralMetrics();
   ```

See `INTEGRATION_GUIDE.md` for detailed integration instructions.

## Troubleshooting

### uv not found
- Make sure uv is installed and in your PATH
- Try: `export PATH="$HOME/.cargo/bin:$PATH"` (Unix/macOS)

### Port already in use
- Change the port in `config/config.json` or set `FUSION_API_PORT` environment variable

### Database errors
- Delete `fusion.db` and run `uv run fusion-init-db` again

### BEVAL connection errors
- Make sure BEVAL server is running
- Check BEVAL WebSocket URL in `config/config.json`


## Prerequisites

Install `uv` if you haven't already:

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
# or
pip install uv
```

## Quick Start

### Option 1: Use the startup script (Recommended)

**On Unix/macOS:**
```bash
cd FUSION
bash run.sh
```

**On Windows (PowerShell):**
```powershell
cd FUSION
.\run.ps1
```

### Option 2: Manual steps

```bash
cd FUSION

# 1. Sync dependencies (installs all required packages)
uv sync --no-install-project

# 2. Initialize database (first time only)
uv run --directory . python -m db

# 3. Start all services
uv run --directory . python start_fusion_uv.py
```

### Option 3: Start services separately

**Terminal 1 - API Server:**
```bash
cd FUSION
uv run --directory . python -m api
```

**Terminal 2 - BEVAL Collector:**
```bash
cd FUSION
uv run --directory . python -m integration
```

## Verify Installation

1. **Check API is running:**
   ```bash
   curl http://localhost:8083/health
   ```
   Should return: `{"status":"healthy","service":"FUSION API"}`

2. **Check metrics endpoint:**
   ```bash
   curl http://localhost:8083/api/metrics/context/test-session?window=30
   ```

## Integration with CONVEI

Once FUSION is running, integrate it into CONVEI:

1. **Wrap your CONVEI app:**
   ```tsx
   import { BehavioralContextProvider } from '../FUSION/context/BehavioralContext';
   
   <BehavioralContextProvider>
     <YourApp />
   </BehavioralContextProvider>
   ```

2. **Use metrics in agents:**
   ```tsx
   import { useBehavioralMetrics } from '../FUSION/context/useBehavioralMetrics';
   
   const { metrics, getContextString } = useBehavioralMetrics();
   ```

See `INTEGRATION_GUIDE.md` for detailed integration instructions.

## Troubleshooting

### uv not found
- Make sure uv is installed and in your PATH
- Try: `export PATH="$HOME/.cargo/bin:$PATH"` (Unix/macOS)

### Port already in use
- Change the port in `config/config.json` or set `FUSION_API_PORT` environment variable

### Database errors
- Delete `fusion.db` and run `uv run fusion-init-db` again

### BEVAL connection errors
- Make sure BEVAL server is running
- Check BEVAL WebSocket URL in `config/config.json`
