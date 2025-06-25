#!/usr/bin/env python3
"""
AVA Perception Layer - Constitutional Intelligence Sensory System
Processes environmental inputs, blockchain events, and multi-modal data streams
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

import aiohttp
import websockets
from web3 import Web3
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import cv2
import numpy as np
from transformers import pipeline, AutoTokenizer, AutoModel
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerceptionType(Enum):
    BLOCKCHAIN_EVENT = "blockchain_event"
    NETWORK_ACTIVITY = "network_activity"
    AGENT_COMMUNICATION = "agent_communication"
    SYSTEM_METRICS = "system_metrics"
    EXTERNAL_DATA = "external_data"
    CONSTITUTIONAL_CHANGE = "constitutional_change"

@dataclass
class PerceptionEvent:
    id: str
    type: PerceptionType
    source: str
    data: Dict[str, Any]
    timestamp: float
    confidence: float
    metadata: Dict[str, Any]

class ConstitutionalPerceptionEngine:
    """Enhanced perception engine for constitutional intelligence"""
    
    def __init__(self):
        self.redis_client = None
        self.web3_providers = {}
        self.perception_filters = {}
        self.running = False
        
        # Initialize AI models for perception
        self.sentiment_analyzer = pipeline("sentiment-analysis")
        self.text_encoder = pipeline("feature-extraction", model="distilbert-base-uncased")
        
    async def initialize(self):
        """Initialize perception systems"""
        try:
            # Connect to Redis
            self.redis_client = redis.from_url("redis://redis:6379")
            
            # Initialize blockchain connections
            await self.setup_blockchain_monitoring()
            
            # Setup perception filters
            await self.initialize_filters()
            
            logger.info("Constitutional Perception Engine initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize perception engine: {e}")
            raise

    async def setup_blockchain_monitoring(self):
        """Setup blockchain event monitoring"""
        networks = {
            "ethereum": "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
            "polygon": "https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID",
            "local": "http://ganache:8545"
        }
        
        for network, url in networks.items():
            try:
                w3 = Web3(Web3.HTTPProvider(url))
                if w3.is_connected():
                    self.web3_providers[network] = w3
                    logger.info(f"Connected to {network} network")
            except Exception as e:
                logger.warning(f"Failed to connect to {network}: {e}")

    async def initialize_filters(self):
        """Initialize constitutional perception filters"""
        self.perception_filters = {
            "governance_events": {
                "patterns": ["proposal", "vote", "delegation", "constitution"],
                "priority": 1.0,
                "auto_forward": True
            },
            "agent_interactions": {
                "patterns": ["agent_", "autonomous", "decision"],
                "priority": 0.8,
                "auto_forward": True
            },
            "security_events": {
                "patterns": ["breach", "attack", "unauthorized", "violation"],
                "priority": 1.0,
                "auto_forward": True,
                "immediate_alert": True
            },
            "consensus_events": {
                "patterns": ["consensus", "validator", "block", "transaction"],
                "priority": 0.7,
                "auto_forward": False
            }
        }

    async def perceive_blockchain_events(self):
        """Monitor blockchain events across networks"""
        while self.running:
            try:
                for network, w3 in self.web3_providers.items():
                    # Get latest block
                    latest_block = w3.eth.get_block('latest')
                    
                    # Analyze transactions
                    for tx_hash in latest_block.transactions[-10:]:  # Last 10 transactions
                        tx = w3.eth.get_transaction(tx_hash)
                        
                        # Create perception event
                        event = PerceptionEvent(
                            id=f"blockchain_{network}_{tx_hash.hex()}",
                            type=PerceptionType.BLOCKCHAIN_EVENT,
                            source=f"blockchain_{network}",
                            data={
                                "network": network,
                                "transaction": {
                                    "hash": tx_hash.hex(),
                                    "from": tx["from"],
                                    "to": tx["to"],
                                    "value": str(tx["value"]),
                                    "gas": tx["gas"],
                                    "gasPrice": str(tx["gasPrice"])
                                },
                                "block": {
                                    "number": latest_block.number,
                                    "timestamp": latest_block.timestamp
                                }
                            },
                            timestamp=time.time(),
                            confidence=0.95,
                            metadata={"network": network}
                        )
                        
                        await self.process_perception(event)
                
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"Error in blockchain perception: {e}")
                await asyncio.sleep(10)

    async def perceive_agent_communications(self):
        """Monitor agent-to-agent communications"""
        while self.running:
            try:
                # Listen to agent communication channels
                async with self.redis_client.pubsub() as pubsub:
                    await pubsub.subscribe("agent_communications", "governance_proposals")
                    
                    async for message in pubsub.listen():
                        if message["type"] == "message":
                            try:
                                data = json.loads(message["data"])
                                
                                event = PerceptionEvent(
                                    id=f"agent_comm_{int(time.time() * 1000)}",
                                    type=PerceptionType.AGENT_COMMUNICATION,
                                    source="agent_network",
                                    data=data,
                                    timestamp=time.time(),
                                    confidence=0.9,
                                    metadata={"channel": message["channel"]}
                                )
                                
                                await self.process_perception(event)
                                
                            except json.JSONDecodeError:
                                logger.warning("Invalid JSON in agent communication")
                
            except Exception as e:
                logger.error(f"Error in agent communication perception: {e}")
                await asyncio.sleep(5)

    async def perceive_system_metrics(self):
        """Monitor system health and performance metrics"""
        while self.running:
            try:
                # Collect system metrics
                import psutil
                
                cpu_percent = psutil.cpu_percent()
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                # Get container stats if available
                container_stats = await self.get_container_stats()
                
                event = PerceptionEvent(
                    id=f"system_metrics_{int(time.time())}",
                    type=PerceptionType.SYSTEM_METRICS,
                    source="system_monitor",
                    data={
                        "cpu_percent": cpu_percent,
                        "memory": {
                            "total": memory.total,
                            "used": memory.used,
                            "percent": memory.percent
                        },
                        "disk": {
                            "total": disk.total,
                            "used": disk.used,
                            "percent": (disk.used / disk.total) * 100
                        },
                        "containers": container_stats
                    },
                    timestamp=time.time(),
                    confidence=1.0,
                    metadata={"category": "system_health"}
                )
                
                await self.process_perception(event)
                await asyncio.sleep(30)  # Every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in system metrics perception: {e}")
                await asyncio.sleep(60)

    async def get_container_stats(self) -> Dict[str, Any]:
        """Get Docker container statistics"""
        try:
            import docker
            client = docker.from_env()
            containers = client.containers.list()
            
            stats = {}
            for container in containers:
                if container.name.startswith('ava-'):
                    container_stats = container.stats(stream=False)
                    stats[container.name] = {
                        "status": container.status,
                        "cpu_percent": self.calculate_cpu_percent(container_stats),
                        "memory_usage": container_stats["memory_stats"].get("usage", 0),
                        "memory_limit": container_stats["memory_stats"].get("limit", 0)
                    }
            
            return stats
            
        except Exception as e:
            logger.warning(f"Could not get container stats: {e}")
            return {}

    def calculate_cpu_percent(self, stats: Dict) -> float:
        """Calculate CPU percentage from container stats"""
        try:
            cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
            system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
            
            if system_delta > 0:
                return (cpu_delta / system_delta) * len(stats["cpu_stats"]["cpu_usage"]["percpu_usage"]) * 100.0
            return 0.0
            
        except (KeyError, ZeroDivisionError):
            return 0.0

    async def process_perception(self, event: PerceptionEvent):
        """Process and route perception events"""
        try:
            # Apply constitutional filters
            filtered_event = await self.apply_constitutional_filters(event)
            
            if filtered_event:
                # Enhance with AI analysis
                enhanced_event = await self.enhance_with_ai(filtered_event)
                
                # Store in perception memory
                await self.store_perception(enhanced_event)
                
                # Forward to appropriate systems
                await self.route_perception(enhanced_event)
                
        except Exception as e:
            logger.error(f"Error processing perception: {e}")

    async def apply_constitutional_filters(self, event: PerceptionEvent) -> Optional[PerceptionEvent]:
        """Apply constitutional importance filters"""
        for filter_name, filter_config in self.perception_filters.items():
            patterns = filter_config["patterns"]
            
            # Check if event matches any patterns
            event_text = json.dumps(event.data).lower()
            if any(pattern in event_text for pattern in patterns):
                # Adjust confidence based on filter priority
                event.confidence *= filter_config["priority"]
                event.metadata["matched_filter"] = filter_name
                event.metadata["filter_priority"] = filter_config["priority"]
                
                # Check for immediate alerts
                if filter_config.get("immediate_alert", False):
                    await self.send_immediate_alert(event)
                
                return event
        
        # Default processing for unfiltered events
        if event.confidence > 0.5:
            return event
        
        return None

    async def enhance_with_ai(self, event: PerceptionEvent) -> PerceptionEvent:
        """Enhance perception with AI analysis"""
        try:
            # Analyze text content for sentiment and entities
            if "text" in event.data or "message" in event.data:
                text_content = event.data.get("text", event.data.get("message", ""))
                
                if text_content:
                    # Sentiment analysis
                    sentiment = self.sentiment_analyzer(text_content)[0]
                    event.metadata["sentiment"] = sentiment
                    
                    # Text encoding for similarity matching
                    encoding = self.text_encoder(text_content)[0]
                    event.metadata["text_encoding"] = encoding[:50]  # First 50 features
            
            # Add constitutional relevance score
            event.metadata["constitutional_relevance"] = await self.calculate_constitutional_relevance(event)
            
            return event
            
        except Exception as e:
            logger.warning(f"AI enhancement failed: {e}")
            return event

    async def calculate_constitutional_relevance(self, event: PerceptionEvent) -> float:
        """Calculate how relevant this perception is to constitutional governance"""
        constitutional_keywords = [
            "governance", "proposal", "vote", "constitution", "rule", "law",
            "agent", "autonomous", "decision", "consensus", "validator",
            "democracy", "republic", "citizen", "rights", "responsibility"
        ]
        
        event_text = json.dumps(event.data).lower()
        matches = sum(1 for keyword in constitutional_keywords if keyword in event_text)
        
        return min(matches / len(constitutional_keywords), 1.0)

    async def store_perception(self, event: PerceptionEvent):
        """Store perception in memory systems"""
        try:
            # Store in Redis for quick access
            await self.redis_client.lpush(
                f"perceptions:{event.type.value}",
                json.dumps({
                    "id": event.id,
                    "type": event.type.value,
                    "source": event.source,
                    "data": event.data,
                    "timestamp": event.timestamp,
                    "confidence": event.confidence,
                    "metadata": event.metadata
                })
            )
            
            # Trim list to last 1000 events
            await self.redis_client.ltrim(f"perceptions:{event.type.value}", 0, 999)
            
            # Send to memory-core for long-term storage
            await self.redis_client.publish("memory_storage", json.dumps({
                "type": "store_perception",
                "event": {
                    "id": event.id,
                    "type": event.type.value,
                    "source": event.source,
                    "data": event.data,
                    "timestamp": event.timestamp,
                    "confidence": event.confidence,
                    "metadata": event.metadata
                }
            }))
            
        except Exception as e:
            logger.error(f"Error storing perception: {e}")

    async def route_perception(self, event: PerceptionEvent):
        """Route perception to appropriate systems"""
        try:
            # Route high-priority governance events to ava-core
            if (event.type == PerceptionType.CONSTITUTIONAL_CHANGE or 
                event.metadata.get("constitutional_relevance", 0) > 0.7):
                await self.redis_client.publish("ava_core_priority", json.dumps({
                    "type": "priority_perception",
                    "event": event.__dict__
                }))
            
            # Route security events immediately
            if event.metadata.get("matched_filter") == "security_events":
                await self.redis_client.publish("security_alerts", json.dumps({
                    "type": "security_perception",
                    "event": event.__dict__,
                    "alert_level": "HIGH"
                }))
            
            # Route agent communications to action layer
            if event.type == PerceptionType.AGENT_COMMUNICATION:
                await self.redis_client.publish("action_layer", json.dumps({
                    "type": "agent_perception",
                    "event": event.__dict__
                }))
            
            # All events go to general perception stream
            await self.redis_client.publish("perception_stream", json.dumps(event.__dict__))
            
        except Exception as e:
            logger.error(f"Error routing perception: {e}")

    async def send_immediate_alert(self, event: PerceptionEvent):
        """Send immediate alert for critical events"""
        try:
            alert = {
                "alert_id": f"alert_{int(time.time() * 1000)}",
                "timestamp": time.time(),
                "level": "CRITICAL",
                "source": "perception_layer",
                "event": event.__dict__,
                "message": f"Critical event detected: {event.type.value} from {event.source}"
            }
            
            await self.redis_client.publish("immediate_alerts", json.dumps(alert))
            logger.warning(f"CRITICAL ALERT: {alert['message']}")
            
        except Exception as e:
            logger.error(f"Error sending immediate alert: {e}")

# FastAPI application
app = FastAPI(title="AVA Perception Layer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global perception engine
perception_engine = ConstitutionalPerceptionEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize perception systems on startup"""
    await perception_engine.initialize()
    perception_engine.running = True
    
    # Start perception tasks
    asyncio.create_task(perception_engine.perceive_blockchain_events())
    asyncio.create_task(perception_engine.perceive_agent_communications())
    asyncio.create_task(perception_engine.perceive_system_metrics())

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    perception_engine.running = False

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "perception_engine": "running" if perception_engine.running else "stopped"
    }

@app.get("/perceptions/{perception_type}")
async def get_perceptions(perception_type: str, limit: int = 100):
    """Get recent perceptions by type"""
    try:
        perceptions = await perception_engine.redis_client.lrange(
            f"perceptions:{perception_type}", 0, limit - 1
        )
        return [json.loads(p) for p in perceptions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/perception/manual")
async def submit_manual_perception(perception_data: Dict[str, Any]):
    """Submit manual perception event"""
    try:
        event = PerceptionEvent(
            id=f"manual_{int(time.time() * 1000)}",
            type=PerceptionType.EXTERNAL_DATA,
            source="manual_input",
            data=perception_data,
            timestamp=time.time(),
            confidence=0.8,
            metadata={"source": "manual"}
        )
        
        await perception_engine.process_perception(event)
        return {"status": "processed", "event_id": event.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/perception/stream")
async def perception_websocket(websocket: WebSocket):
    """WebSocket stream for real-time perceptions"""
    await websocket.accept()
    
    try:
        async with perception_engine.redis_client.pubsub() as pubsub:
            await pubsub.subscribe("perception_stream")
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    await websocket.send_text(message["data"])
                    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)
