from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import asyncio
import json
from datetime import datetime
from loguru import logger

router = APIRouter()

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[str, List[WebSocket]] = {
            "debris": [],
            "ecosystem": [],
            "wave": [],
            "alerts": []
        }
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WebSocket connection. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        # Remove from all subscriptions
        for channel in self.subscriptions:
            if websocket in self.subscriptions[channel]:
                self.subscriptions[channel].remove(websocket)
        logger.info(f"WebSocket disconnected. Remaining: {len(self.active_connections)}")
    
    def subscribe(self, websocket: WebSocket, channel: str):
        if channel in self.subscriptions:
            if websocket not in self.subscriptions[channel]:
                self.subscriptions[channel].append(websocket)
    
    def unsubscribe(self, websocket: WebSocket, channel: str):
        if channel in self.subscriptions:
            if websocket in self.subscriptions[channel]:
                self.subscriptions[channel].remove(websocket)
    
    async def broadcast(self, message: dict, channel: str = None):
        """Broadcast message to all connections or specific channel"""
        targets = self.subscriptions.get(channel, []) if channel else self.active_connections
        
        for connection in targets:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        await websocket.send_json(message)

manager = ConnectionManager()

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for real-time updates
    
    Message format:
    {
        "type": "subscribe" | "unsubscribe" | "request",
        "channel": "debris" | "ecosystem" | "wave" | "alerts",
        "data": {...}
    }
    """
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            msg_type = data.get("type")
            channel = data.get("channel")
            payload = data.get("data", {})
            
            if msg_type == "subscribe":
                manager.subscribe(websocket, channel)
                await manager.send_personal(websocket, {
                    "type": "subscribed",
                    "channel": channel,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif msg_type == "unsubscribe":
                manager.unsubscribe(websocket, channel)
                await manager.send_personal(websocket, {
                    "type": "unsubscribed",
                    "channel": channel
                })
            
            elif msg_type == "request":
                # Handle specific data requests
                if channel == "wave":
                    # Fetch real-time wave data
                    from main import wave_service
                    lat = payload.get("lat", 20.0)
                    lon = payload.get("lon", 80.0)
                    wave_data = await wave_service.get_wave_data(lat, lon)
                    await manager.send_personal(websocket, {
                        "type": "wave_data",
                        "data": wave_data
                    })
            
            elif msg_type == "ping":
                await manager.send_personal(websocket, {"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Background task to send periodic updates
async def periodic_update_task():
    """Send periodic updates to subscribed clients"""
    while True:
        await asyncio.sleep(30)  # Every 30 seconds
        
        # Send wave data updates
        await manager.broadcast({
            "type": "wave_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "global_alerts": 3,
                "active_debris_zones": 12
            }
        }, channel="wave")
