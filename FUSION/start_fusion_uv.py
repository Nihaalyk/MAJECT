#!/usr/bin/env python3
"""
FUSION Startup Script using uv
Starts both the API server and BEVAL collector using uv
"""

import subprocess
import sys
import time
import signal
import logging
import socket
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

processes = []

def signal_handler(sig, frame):
    """Handle shutdown signals"""
    logger.info("Shutting down FUSION...")
    for process in processes:
        try:
            process.terminate()
            process.wait(timeout=5)
        except:
            process.kill()
    sys.exit(0)

def check_uv_installed():
    """Check if uv is installed"""
    try:
        subprocess.run(["uv", "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.error("uv is not installed. Please install it first:")
        logger.error("  curl -LsSf https://astral.sh/uv/install.sh | sh")
        logger.error("  or: pip install uv")
        return False

def is_port_in_use(port: int) -> bool:
    """Check if a port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('0.0.0.0', port))
            return False
        except OSError:
            return True

def check_api_health(port: int = 8083) -> bool:
    """Check if API server is healthy"""
    try:
        import urllib.request
        response = urllib.request.urlopen(f'http://localhost:{port}/health', timeout=2)
        return response.getcode() == 200
    except:
        return False

def start_api_server():
    """Start the API server using uv"""
    port = 8083
    if is_port_in_use(port):
        if check_api_health(port):
            logger.info(f"FUSION API server already running on port {port} (healthy)")
            return None  # Don't start another instance
        else:
            logger.warning(f"Port {port} is in use but API is not healthy. Attempting to start anyway...")
    
    logger.info("Starting FUSION API server with uv...")
    script_dir = Path(__file__).parent.absolute()
    process = subprocess.Popen(
        ["uv", "run", "--directory", str(script_dir), "python", "-m", "api"],
        cwd=script_dir
    )
    processes.append(process)
    return process

def start_beval_collector():
    """Start the BEVAL collector using uv"""
    logger.info("Starting BEVAL collector with uv...")
    script_dir = Path(__file__).parent.absolute()
    process = subprocess.Popen(
        ["uv", "run", "--directory", str(script_dir), "python", "-m", "integration"],
        cwd=script_dir
    )
    processes.append(process)
    return process

def main():
    """Main entry point"""
    if not check_uv_installed():
        sys.exit(1)
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Check if database exists, initialize if not
    script_dir = Path(__file__).parent.absolute()
    db_path = script_dir / "fusion.db"
    if not db_path.exists():
        logger.info("Initializing database...")
        subprocess.run(
            ["uv", "run", "--directory", str(script_dir), "python", "-m", "db"],
            cwd=script_dir
        )
    
    # Start services
    api_process = start_api_server()
    if api_process:
        time.sleep(2)  # Give API server time to start if we started it
    
    collector_process = start_beval_collector()
    
    logger.info("FUSION services status:")
    logger.info(f"  - API Server: http://localhost:8083 {'(already running)' if api_process is None else '(started)'}")
    logger.info(f"  - BEVAL Collector: Running")
    logger.info("Press Ctrl+C to stop")
    
    # Wait for processes
    try:
        if api_process:
            api_process.wait()
        collector_process.wait()
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()

