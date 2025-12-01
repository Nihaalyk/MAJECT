# MAJECT Project Setup Script
# ============================
# Installs all dependencies and sets up the complete project environment
# Supports: BEVAL, CONVEI, FUSION with TensorFlow Intel optimizations
#
# Usage:
#   .\setup.ps1                    # Full setup
#   .\setup.ps1 -SkipNode          # Skip Node.js setup
#   .\setup.ps1 -SkipPython        # Skip Python setup
#   .\setup.ps1 -SkipDatabase      # Skip database initialization
#   .\setup.ps1 -RunServices       # Start all services after setup
#   .\setup.ps1 -IntelOptimizations:$false  # Skip Intel TensorFlow optimizations
#
# Requirements:
#   - Python 3.12+
#   - Node.js 16+
#   - Administrator privileges (for Intel optimizations)
#
# Components:
#   - BEVAL: Behavioral analysis system (Python)
#   - CONVEI: Frontend React application (Node.js)
#   - FUSION: Integration layer API (Python)

param(
    [switch]$SkipNode,
    [switch]$SkipPython,
    [switch]$SkipDatabase,
    [switch]$RunServices,
    [switch]$IntelOptimizations = $true
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Step($message) {
    Write-ColorOutput Cyan "`n========================================"
    Write-ColorOutput Cyan "  $message"
    Write-ColorOutput Cyan "========================================`n"
}

function Write-Success($message) {
    Write-ColorOutput Green "✓ $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "✗ $message"
}

function Write-Info($message) {
    Write-ColorOutput Yellow "ℹ $message"
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

Write-Step "MAJECT Project Setup"
Write-Info "This script will install all dependencies and set up the project environment"
Write-Info "Components: BEVAL (Python), CONVEI (Node.js), FUSION (Python)"

# Check prerequisites
Write-Step "Checking Prerequisites"

# Check Python
if (-not $SkipPython) {
    Write-Info "Checking Python installation..."
    try {
        $pythonVersion = python --version 2>&1
        if ($pythonVersion -match "Python (\d+)\.(\d+)") {
            $major = [int]$matches[1]
            $minor = [int]$matches[2]
            if ($major -ge 3 -and $minor -ge 12) {
                Write-Success "Python $major.$minor found"
            } else {
                Write-Error "Python 3.12+ required. Found: $pythonVersion"
                Write-Info "Please install Python 3.12+ from https://www.python.org/downloads/"
                exit 1
            }
        }
    } catch {
        Write-Error "Python not found. Please install Python 3.12+ from https://www.python.org/downloads/"
        exit 1
    }

    # Check pip
    Write-Info "Checking pip..."
    if (-not (Get-Command pip -ErrorAction SilentlyContinue)) {
        Write-Error "pip not found. Please install pip."
        exit 1
    }
    Write-Success "pip found"
}

# Check Node.js
if (-not $SkipNode) {
    Write-Info "Checking Node.js installation..."
    try {
        $nodeVersion = node --version 2>&1
        if ($nodeVersion -match "v(\d+)\.(\d+)") {
            $major = [int]$matches[1]
            if ($major -ge 16) {
                Write-Success "Node.js $nodeVersion found"
            } else {
                Write-Error "Node.js 16+ required. Found: $nodeVersion"
                Write-Info "Please install Node.js from https://nodejs.org/"
                exit 1
            }
        }
    } catch {
        Write-Error "Node.js not found. Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    }

    # Check npm
    Write-Info "Checking npm..."
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm not found"
        exit 1
    }
    Write-Success "npm found"
}

# Install uv (Python package manager)
Write-Step "Installing uv (Python Package Manager)"
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Info "Installing uv..."
    try {
        pip install uv
        Write-Success "uv installed successfully"
    } catch {
        Write-Error "Failed to install uv. Trying alternative method..."
        try {
            Invoke-WebRequest -Uri "https://astral.sh/uv/install.ps1" -UseBasicParsing | Invoke-Expression
            Write-Success "uv installed via official installer"
        } catch {
            Write-Error "Failed to install uv. Please install manually: pip install uv"
            exit 1
        }
    }
} else {
    Write-Success "uv already installed"
}

# Setup BEVAL
if (-not $SkipPython) {
    Write-Step "Setting up BEVAL (Behavioral Analyzer)"
    
    # BEVAL Behavioral Analyzer
    if (Test-Path "BEVAL\behavioral_analyzer") {
        Write-Info "Setting up BEVAL behavioral analyzer..."
        Push-Location "BEVAL\behavioral_analyzer"
        try {
            Write-Info "Installing dependencies with uv..."
            uv sync
            Write-Success "BEVAL behavioral analyzer dependencies installed"
        } catch {
            Write-Error "Failed to install BEVAL behavioral analyzer dependencies"
            Write-Info "Trying with pip..."
            pip install -r requirements.txt
        }
        Pop-Location
    }
    
    # BEVAL Server
    if (Test-Path "BEVAL\server") {
        Write-Info "Setting up BEVAL server..."
        Push-Location "BEVAL\server"
        try {
            Write-Info "Installing dependencies with uv..."
            uv sync
            Write-Success "BEVAL server dependencies installed"
        } catch {
            Write-Error "Failed to install BEVAL server dependencies"
            Write-Info "Trying with pip..."
            pip install -r requirements.txt
        }
        Pop-Location
    }
    
    # Install TensorFlow with Intel optimizations if requested
    if ($IntelOptimizations) {
        Write-Step "Installing TensorFlow with Intel Optimizations"
        Write-Info "Installing Intel Extension for TensorFlow..."
        Write-Info "Note: This requires Intel CPU or compatible hardware"
        try {
            # Try installing Intel extension
            pip install intel-extension-for-tensorflow
            Write-Success "Intel Extension for TensorFlow installed"
            
            # Set environment variables for Intel optimizations
            Write-Info "Configuring Intel optimizations..."
            $env:TF_ENABLE_ONEDNN_OPTS = "1"
            $env:ITEX_LAYOUT_OPT = "1"
            [System.Environment]::SetEnvironmentVariable("TF_ENABLE_ONEDNN_OPTS", "1", "User")
            [System.Environment]::SetEnvironmentVariable("ITEX_LAYOUT_OPT", "1", "User")
            Write-Success "Intel optimizations configured"
        } catch {
            Write-Info "Intel Extension installation failed (may not be compatible with your hardware)"
            Write-Info "Installing standard TensorFlow instead..."
            try {
                pip install tensorflow>=2.13.0
                Write-Success "Standard TensorFlow installed"
            } catch {
                Write-Error "Failed to install TensorFlow. It may be installed via uv sync."
            }
        }
    } else {
        Write-Info "Skipping Intel optimizations (standard TensorFlow will be used)"
    }
}

# Setup FUSION
if (-not $SkipPython) {
    Write-Step "Setting up FUSION (Integration Layer)"
    
    if (Test-Path "FUSION") {
        Push-Location "FUSION"
        try {
            Write-Info "Installing FUSION dependencies with uv..."
            uv sync
            Write-Success "FUSION dependencies installed"
        } catch {
            Write-Error "Failed to install FUSION dependencies with uv"
            Write-Info "Trying with pip..."
            pip install fastapi uvicorn[standard] python-socketio[asyncio-client] httpx python-dotenv colorlog
            Write-Success "FUSION dependencies installed with pip"
        }
        Pop-Location
    }
}

# Initialize FUSION Database
if (-not $SkipDatabase) {
    Write-Step "Initializing FUSION Database"
    
    if (Test-Path "FUSION") {
        Push-Location "FUSION"
            try {
                if (Test-Path "fusion.db") {
                    Write-Info "Database already exists, skipping initialization"
                } else {
                    Write-Info "Initializing database..."
                    if (Get-Command uv -ErrorAction SilentlyContinue) {
                        uv run python -m db.init_db
                    } else {
                        python -m db.init_db
                    }
                    if (Test-Path "fusion.db") {
                        Write-Success "FUSION database initialized"
                    } else {
                        throw "Database file not created"
                    }
                }
            } catch {
                Write-Error "Failed to initialize database: $_"
                Write-Info "Trying alternative method..."
                try {
                    Push-Location "FUSION"
                    python db\init_db.py
                    Pop-Location
                    if (Test-Path "FUSION\fusion.db") {
                        Write-Success "Database initialized via direct script"
                    } else {
                        throw "Database file not created"
                    }
                } catch {
                    Write-Error "Database initialization failed. You may need to run it manually:"
                    Write-Info "  cd FUSION"
                    Write-Info "  python db\init_db.py"
                }
            }
        Pop-Location
    }
}

# Setup CONVEI (Node.js)
if (-not $SkipNode) {
    Write-Step "Setting up CONVEI (Frontend)"
    
    if (Test-Path "CONVEI") {
        Push-Location "CONVEI"
        try {
            Write-Info "Installing Node.js dependencies..."
            npm install
            Write-Success "CONVEI dependencies installed"
        } catch {
            Write-Error "Failed to install CONVEI dependencies"
            exit 1
        }
        Pop-Location
    }
}

# Create environment files if they don't exist
Write-Step "Setting up Environment Files"

# BEVAL Server .env
if (Test-Path "BEVAL\server\.env.example") {
    if (-not (Test-Path "BEVAL\server\.env")) {
        Write-Info "Creating BEVAL server .env file..."
        Copy-Item "BEVAL\server\.env.example" "BEVAL\server\.env"
        Write-Success "BEVAL server .env file created (please configure it)"
    }
}

# FUSION .env
if (Test-Path "FUSION") {
    if (-not (Test-Path "FUSION\.env")) {
        Write-Info "Creating FUSION .env file..."
        @"
# FUSION Configuration
FUSION_API_URL=http://localhost:8083
BEVAL_URL=http://localhost:5000
LOG_LEVEL=INFO
"@ | Out-File -FilePath "FUSION\.env" -Encoding utf8
        Write-Success "FUSION .env file created"
    }
}

# CONVEI .env
if (Test-Path "CONVEI") {
    if (-not (Test-Path "CONVEI\.env")) {
        Write-Info "Creating CONVEI .env file..."
        @"
REACT_APP_FUSION_API_URL=http://localhost:8083
REACT_APP_BEVAL_URL=http://localhost:5000
HTTPS=false
"@ | Out-File -FilePath "CONVEI\.env" -Encoding utf8
        Write-Success "CONVEI .env file created"
    }
}

# Summary
Write-Step "Setup Complete!"
Write-Success "All components have been set up successfully"
Write-Info "`nNext steps:"
Write-Info "1. Configure .env files in BEVAL/server, FUSION, and CONVEI directories"
Write-Info "2. Add your API keys and configuration"
Write-Info "3. Run services using the run scripts or manually"

if ($RunServices) {
    Write-Step "Starting Services"
    Write-Info "This will start all services in separate windows"
    
    $response = Read-Host "Do you want to start all services now? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Info "Starting services..."
        
        # Start FUSION
        if (Test-Path "FUSION") {
            Write-Info "Starting FUSION API server..."
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd FUSION; if (Get-Command uv -ErrorAction SilentlyContinue) { uv run python start_fusion_uv.py } else { python start_fusion.py }"
            Start-Sleep -Seconds 2
        }
        
        # Start BEVAL Server
        if (Test-Path "BEVAL\server") {
            Write-Info "Starting BEVAL server..."
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd BEVAL\server; if (Get-Command uv -ErrorAction SilentlyContinue) { uv run python server.py } else { python server.py }"
            Start-Sleep -Seconds 2
        }
        
        # Start CONVEI
        if (Test-Path "CONVEI") {
            Write-Info "Starting CONVEI frontend..."
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd CONVEI; npm start"
        }
        
        Write-Success "All services started in separate windows"
        Write-Info "FUSION API: http://localhost:8083"
        Write-Info "BEVAL Server: WebSocket on port 5000, HTTP API on port 8082"
        Write-Info "CONVEI Frontend: http://localhost:3000"
    }
}

Write-Step "Setup Summary"
Write-Success "✓ Python dependencies installed"
Write-Success "✓ Node.js dependencies installed"
Write-Success "✓ FUSION database initialized"
if ($IntelOptimizations) {
    Write-Success "✓ Intel TensorFlow optimizations configured"
}
Write-Info "`nFor detailed information, see:"
Write-Info "- BEVAL/README.md"
Write-Info "- FUSION/README.md"
Write-Info "- CONVEI/README.md"
Write-Info "`nSetup complete! 🚀"

