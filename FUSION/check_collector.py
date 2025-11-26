"""
Quick check to see if FUSION collector is connecting to BEVAL
"""

import asyncio
import socketio
import json

async def test_beval_connection():
    """Test SocketIO connection to BEVAL"""
    print("Testing BEVAL SocketIO connection...")
    
    sio = socketio.AsyncClient()
    
    @sio.on('connect')
    async def on_connect():
        print("[OK] Connected to BEVAL SocketIO server!")
        await sio.emit('request_data')
    
    @sio.on('data_update')
    async def on_data_update(data):
        print("[OK] Received data_update event from BEVAL!")
        print(f"   Data keys: {list(data.keys())}")
        if 'video' in data:
            print(f"   Video emotion: {data['video'].get('emotion', 'N/A')}")
        if 'audio' in data:
            print(f"   Audio sentiment: {data['audio'].get('sentiment', 'N/A')}")
    
    @sio.on('disconnect')
    async def on_disconnect(*args):
        print("[X] Disconnected from BEVAL")
    
    try:
        print("Connecting to http://localhost:5000...")
        await sio.connect('http://localhost:5000')
        print("Waiting for events (10 seconds)...")
        await asyncio.sleep(10)
        await sio.disconnect()
        print("[OK] Test completed successfully!")
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        print("Make sure BEVAL Web UI is running on port 5000")

if __name__ == "__main__":
    asyncio.run(test_beval_connection())


"""

import asyncio
import socketio
import json

async def test_beval_connection():
    """Test SocketIO connection to BEVAL"""
    print("Testing BEVAL SocketIO connection...")
    
    sio = socketio.AsyncClient()
    
    @sio.on('connect')
    async def on_connect():
        print("[OK] Connected to BEVAL SocketIO server!")
        await sio.emit('request_data')
    
    @sio.on('data_update')
    async def on_data_update(data):
        print("[OK] Received data_update event from BEVAL!")
        print(f"   Data keys: {list(data.keys())}")
        if 'video' in data:
            print(f"   Video emotion: {data['video'].get('emotion', 'N/A')}")
        if 'audio' in data:
            print(f"   Audio sentiment: {data['audio'].get('sentiment', 'N/A')}")
    
    @sio.on('disconnect')
    async def on_disconnect(*args):
        print("[X] Disconnected from BEVAL")
    
    try:
        print("Connecting to http://localhost:5000...")
        await sio.connect('http://localhost:5000')
        print("Waiting for events (10 seconds)...")
        await asyncio.sleep(10)
        await sio.disconnect()
        print("[OK] Test completed successfully!")
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        print("Make sure BEVAL Web UI is running on port 5000")

if __name__ == "__main__":
    asyncio.run(test_beval_connection())
