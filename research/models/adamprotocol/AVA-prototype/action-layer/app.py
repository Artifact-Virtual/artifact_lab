#!/usr/bin/env python3
"""
AVA Action Layer - Constitutional Intelligence Execution System
Executes decisions, coordinates agents, and implements constitutional governance
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

import aiohttp
import websockets
from web3 import Web3
from eth_account import Account
from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ActionType(Enum):
    BLOCKCHAIN_TRANSACTION = "blockchain_transaction"
    AGENT_COORDINATION = "agent_coordination"
    GOVERNANCE_EXECUTION = "governance_execution"
    CONSTITUTIONAL_UPDATE = "constitutional_update"
    EMERGENCY_RESPONSE = "emergency_response"
    EXTERNAL_API_CALL = "external_api_call"
    SYSTEM_ADMINISTRATION = "system_administration"

class ActionStatus(Enum):
    PENDING = "pending"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"

@dataclass
class ConstitutionalAction:
    id: str
    type: ActionType
    priority: int  # 1-10, 10 being highest
    target: str
    parameters: Dict[str, Any]
    authorization: Dict[str, Any]
    constitutional_basis: str
    status: ActionStatus
    created_at: float
    scheduled_at: Optional[float] = None
    executed_at: Optional[float] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3

class ConstitutionalActionEngine:
    """Enhanced action engine for constitutional intelligence"""
    
    def __init__(self):
        self.redis_client = None
        self.web3_providers = {}
        self.agent_endpoints = {}
        self.action_queue = asyncio.PriorityQueue()
        self.active_actions = {}
        self.running = False
        self.executor_tasks = []
        
        # Constitutional authorization levels
        self.authorization_levels = {
            "public": 1,
            "agent": 3,
            "validator": 5,
            "council": 7,
            "constitutional": 9,
            "emergency": 10
        }
        
    async def initialize(self):
        """Initialize action systems"""
        try:
            # Connect to Redis
            self.redis_client = redis.from_url("redis://redis:6379")
            
            # Initialize blockchain connections
            await self.setup_blockchain_connections()
            
            # Discover agent endpoints
            await self.discover_agent_endpoints()
            
            # Start action executors
            await self.start_executors()
            
            logger.info("Constitutional Action Engine initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize action engine: {e}")
            raise

    async def setup_blockchain_connections(self):
        """Setup blockchain connections for action execution"""
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
                    logger.info(f"Connected to {network} for action execution")
            except Exception as e:
                logger.warning(f"Failed to connect to {network}: {e}")

    async def discover_agent_endpoints(self):
        """Discover available agent endpoints"""
        # Default agent configurations
        self.agent_endpoints = {
            "autogpt": {
                "url": "http://autogpt-agent:8080",
                "capabilities": ["general_task", "web_search", "file_operations"],
                "authorization_level": "agent"
            },
            "crewai": {
                "url": "http://crewai-agent:8081", 
                "capabilities": ["multi_agent_coordination", "specialized_tasks"],
                "authorization_level": "agent"
            },
            "babyagi": {
                "url": "http://babyagi-agent:8082",
                "capabilities": ["task_breakdown", "goal_achievement"],
                "authorization_level": "agent"
            }
        }
        
        # Test connectivity to agents
        for agent_name, config in self.agent_endpoints.items():
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"{config['url']}/health", timeout=5.0)
                    if response.status_code == 200:
                        logger.info(f"Agent {agent_name} is available")
                    else:
                        logger.warning(f"Agent {agent_name} returned status {response.status_code}")
            except Exception as e:
                logger.warning(f"Agent {agent_name} is not available: {e}")

    async def start_executors(self):
        """Start background action executors"""
        # Start multiple executor tasks for parallel processing
        for i in range(5):  # 5 parallel executors
            task = asyncio.create_task(self.action_executor(f"executor_{i}"))
            self.executor_tasks.append(task)
        
        # Start scheduler for delayed actions
        scheduler_task = asyncio.create_task(self.action_scheduler())
        self.executor_tasks.append(scheduler_task)
        
        # Start perception listener
        perception_task = asyncio.create_task(self.perception_listener())
        self.executor_tasks.append(perception_task)

    async def perception_listener(self):
        """Listen for perceptions that require actions"""
        while self.running:
            try:
                async with self.redis_client.pubsub() as pubsub:
                    await pubsub.subscribe("ava_core_priority", "security_alerts", "governance_proposals")
                    
                    async for message in pubsub.listen():
                        if message["type"] == "message":
                            try:
                                data = json.loads(message["data"])
                                await self.process_perception_trigger(data, message["channel"])
                            except json.JSONDecodeError:
                                logger.warning("Invalid JSON in perception trigger")
                
            except Exception as e:
                logger.error(f"Error in perception listener: {e}")
                await asyncio.sleep(5)

    async def process_perception_trigger(self, data: Dict[str, Any], channel: str):
        """Process perception that triggers actions"""
        try:
            if channel == "security_alerts":
                await self.handle_security_alert(data)
            elif channel == "governance_proposals":
                await self.handle_governance_proposal(data)
            elif channel == "ava_core_priority":
                await self.handle_priority_event(data)
                
        except Exception as e:
            logger.error(f"Error processing perception trigger: {e}")

    async def handle_security_alert(self, alert_data: Dict[str, Any]):
        """Handle security alerts with immediate actions"""
        action = ConstitutionalAction(
            id=f"security_{uuid.uuid4()}",
            type=ActionType.EMERGENCY_RESPONSE,
            priority=10,  # Highest priority
            target="security_system",
            parameters={
                "alert": alert_data,
                "response_type": "immediate",
                "escalation_level": "high"
            },
            authorization={
                "level": "emergency",
                "auto_approved": True,
                "justification": "Security threat detected"
            },
            constitutional_basis="Emergency Response Protocol - Article 7",
            status=ActionStatus.PENDING,
            created_at=time.time()
        )
        
        await self.queue_action(action)

    async def handle_governance_proposal(self, proposal_data: Dict[str, Any]):
        """Handle governance proposals"""
        action = ConstitutionalAction(
            id=f"governance_{uuid.uuid4()}",
            type=ActionType.GOVERNANCE_EXECUTION,
            priority=7,
            target="governance_system",
            parameters={
                "proposal": proposal_data,
                "action_type": "process_proposal"
            },
            authorization={
                "level": "council",
                "requires_validation": True
            },
            constitutional_basis="Governance Framework - Article 3",
            status=ActionStatus.PENDING,
            created_at=time.time()
        )
        
        await self.queue_action(action)

    async def handle_priority_event(self, event_data: Dict[str, Any]):
        """Handle priority events from AVA core"""
        action = ConstitutionalAction(
            id=f"priority_{uuid.uuid4()}",
            type=ActionType.CONSTITUTIONAL_UPDATE,
            priority=8,
            target="constitutional_system",
            parameters=event_data,
            authorization={
                "level": "constitutional",
                "requires_consensus": True
            },
            constitutional_basis="Constitutional Amendment Process - Article 2",
            status=ActionStatus.PENDING,
            created_at=time.time()
        )
        
        await self.queue_action(action)

    async def queue_action(self, action: ConstitutionalAction):
        """Queue action for execution"""
        try:
            # Validate constitutional authorization
            if not await self.validate_constitutional_authorization(action):
                action.status = ActionStatus.FAILED
                action.error = "Constitutional authorization failed"
                await self.store_action_result(action)
                return
            
            # Queue with priority
            priority = -action.priority  # Negative for highest priority first
            await self.action_queue.put((priority, action.created_at, action))
            
            # Store in active actions
            self.active_actions[action.id] = action
            
            # Log action
            await self.log_action(action, "queued")
            
            logger.info(f"Queued action {action.id} with priority {action.priority}")
            
        except Exception as e:
            logger.error(f"Error queueing action: {e}")

    async def validate_constitutional_authorization(self, action: ConstitutionalAction) -> bool:
        """Validate action against constitutional framework"""
        try:
            required_level = action.authorization.get("level", "public")
            
            # Check authorization level
            if required_level not in self.authorization_levels:
                return False
            
            # Emergency actions are auto-approved
            if action.authorization.get("auto_approved", False):
                return True
            
            # Check for consensus requirement
            if action.authorization.get("requires_consensus", False):
                return await self.check_consensus_approval(action)
            
            # Check for validation requirement
            if action.authorization.get("requires_validation", False):
                return await self.check_validation_approval(action)
            
            # Default approval for lower-level actions
            if self.authorization_levels[required_level] <= 5:
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Authorization validation error: {e}")
            return False

    async def check_consensus_approval(self, action: ConstitutionalAction) -> bool:
        """Check if action has consensus approval"""
        # Implementation would check blockchain consensus
        # For now, return True for demonstration
        logger.info(f"Checking consensus for action {action.id}")
        return True

    async def check_validation_approval(self, action: ConstitutionalAction) -> bool:
        """Check if action has validator approval"""
        # Implementation would check validator signatures
        # For now, return True for demonstration
        logger.info(f"Checking validation for action {action.id}")
        return True

    async def action_executor(self, executor_id: str):
        """Background action executor"""
        while self.running:
            try:
                # Get next action from queue
                priority, timestamp, action = await self.action_queue.get()
                
                logger.info(f"Executor {executor_id} processing action {action.id}")
                
                # Update status
                action.status = ActionStatus.EXECUTING
                action.executed_at = time.time()
                
                # Execute action
                result = await self.execute_action(action)
                
                if result["success"]:
                    action.status = ActionStatus.COMPLETED
                    action.result = result
                else:
                    action.status = ActionStatus.FAILED
                    action.error = result.get("error", "Unknown error")
                    
                    # Retry logic
                    if action.retry_count < action.max_retries:
                        action.retry_count += 1
                        action.status = ActionStatus.RETRYING
                        await asyncio.sleep(2 ** action.retry_count)  # Exponential backoff
                        await self.queue_action(action)
                        continue
                
                # Store result
                await self.store_action_result(action)
                
                # Remove from active actions
                if action.id in self.active_actions:
                    del self.active_actions[action.id]
                
            except Exception as e:
                logger.error(f"Error in executor {executor_id}: {e}")
                await asyncio.sleep(1)

    async def execute_action(self, action: ConstitutionalAction) -> Dict[str, Any]:
        """Execute specific action based on type"""
        try:
            if action.type == ActionType.BLOCKCHAIN_TRANSACTION:
                return await self.execute_blockchain_transaction(action)
            elif action.type == ActionType.AGENT_COORDINATION:
                return await self.execute_agent_coordination(action)
            elif action.type == ActionType.GOVERNANCE_EXECUTION:
                return await self.execute_governance_action(action)
            elif action.type == ActionType.CONSTITUTIONAL_UPDATE:
                return await self.execute_constitutional_update(action)
            elif action.type == ActionType.EMERGENCY_RESPONSE:
                return await self.execute_emergency_response(action)
            elif action.type == ActionType.EXTERNAL_API_CALL:
                return await self.execute_external_api_call(action)
            elif action.type == ActionType.SYSTEM_ADMINISTRATION:
                return await self.execute_system_administration(action)
            else:
                return {"success": False, "error": f"Unknown action type: {action.type}"}
                
        except Exception as e:
            logger.error(f"Error executing action {action.id}: {e}")
            return {"success": False, "error": str(e)}

    async def execute_blockchain_transaction(self, action: ConstitutionalAction) -> Dict[str, Any]:
        """Execute blockchain transaction"""
        try:
            network = action.parameters.get("network", "local")
            if network not in self.web3_providers:
                return {"success": False, "error": f"Network {network} not available"}
            
            w3 = self.web3_providers[network]
            
            # Build transaction
            tx_params = action.parameters.get("transaction", {})
            
            # For demo, just return success
            return {
                "success": True,
                "transaction_hash": f"0x{''.join([f'{i:02x}' for i in range(32)])}",
                "network": network,
                "gas_used": tx_params.get("gas", 21000)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def execute_agent_coordination(self, action: ConstitutionalAction) -> Dict[str, Any]:
        """Execute agent coordination action"""
        try:
            target_agent = action.parameters.get("agent")
            task = action.parameters.get("task")
            
            if target_agent not in self.agent_endpoints:
                return {"success": False, "error": f"Agent {target_agent} not available"}
            
            agent_config = self.agent_endpoints[target_agent]
            
            # Send task to agent
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{agent_config['url']}/execute",
                    json={"task": task, "parameters": action.parameters},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {"success": True, "agent_response": result}
                else:
                    return {"success": False, "error": f"Agent returned status {response.status_code}"}
                    
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def execute_governance_action(self, action: ConstitutionalAction) -> Dict[str, Any]:
        """Execute governance action"""
        try:
            proposal = action.parameters.get("proposal")
            action_type = action.parameters.get("action_type")
            
            # Process governance proposal
            if action_type == "process_proposal":
                # Validate proposal
                if not proposal:
                    return {"success": False, "error": "No proposal provided"}
                
                # Store proposal in governance system
                await self.redis_client.lpush("governance_proposals", json.dumps({
                    "proposal_id": proposal.get("id", f"prop_{int(time.time())}"),
                    "title": proposal.get("title", ""),
                    "description": proposal.get("description", ""),
                    "timestamp": time.time(),
                    "status": "active"
                }))
                
                return {"success": True, "proposal_processed": True}
            
            return {"success": False, "error": f"Unknown governance action: {action_type}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def execute_constitutional_update(self, action: ConstitutionalAction) -> Dict[str, Any]:
        """Execute constitutional update"""
        try:
            update_type = action.parameters.get("type")
            
            if update_type == "rule_amendment":
                # Process constitutional rule amendment
                rule_data = action.parameters.get("rule_data")
                
                await self.redis_client.publish("constitutional_updates", json.dumps({
                    "type": "rule_amendment",
                    "rule_data": rule_data,
                    "timestamp": time.time(),
                    "action_id": action.id
                }))
                
                return {"success": True, "constitutional_update": "processed"}
            
            return {"success": False, "error": f"Unknown constitutional update: {update_type}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def execute_emergency_response(self, action: ConstitutionalAction) -> Dict[str, Any]:
        """Execute emergency response action"""
        try:
            alert = action.parameters.get("alert")
            response_type = action.parameters.get("response_type")
            
            if response_type == "immediate":
                # Immediate emergency response
                await self.redis_client.publish("emergency_response", json.dumps({
                    "alert": alert,
                    "response": "immediate_lockdown",
                    "timestamp": time.time(),
                    "action_id": action.id
                }))
                
                return {"success": True, "emergency_response": "executed"}
            
            return {"success": False, "error": f"Unknown emergency response: {response_type}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def execute_external_api_call(self, action: ConstitutionalAction) -> Dict[str, Any]:
        """Execute external API call"""
        try:
            url = action.parameters.get("url")
            method = action.parameters.get("method", "GET")
            headers = action.parameters.get("headers", {})
            data = action.parameters.get("data")
            
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=data,
                    timeout=30.0
                )
                
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "response_data": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def execute_system_administration(self, action: ConstitutionalAction) -> Dict[str, Any]:
        """Execute system administration action"""
        try:
            admin_type = action.parameters.get("admin_type")
            
            if admin_type == "container_restart":
                container_name = action.parameters.get("container_name")
                # Implementation would restart specific container
                return {"success": True, "container_restarted": container_name}
            
            elif admin_type == "service_health_check":
                # Check all service health
                health_status = await self.check_all_services_health()
                return {"success": True, "health_status": health_status}
            
            return {"success": False, "error": f"Unknown admin action: {admin_type}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def check_all_services_health(self) -> Dict[str, Any]:
        """Check health of all AVA services"""
        services = {
            "ava-core": "http://ava-core:8001/health",
            "memory-core": "http://memory-core:8002/health",
            "perception-layer": "http://perception-layer:8003/health",
            "vault": "http://vault:8005/health"
        }
        
        health_status = {}
        
        for service, url in services.items():
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, timeout=5.0)
                    health_status[service] = {
                        "status": "healthy" if response.status_code == 200 else "unhealthy",
                        "response_time": response.elapsed.total_seconds()
                    }
            except Exception as e:
                health_status[service] = {
                    "status": "unreachable",
                    "error": str(e)
                }
        
        return health_status

    async def action_scheduler(self):
        """Schedule delayed actions"""
        while self.running:
            try:
                # Check for scheduled actions in Redis
                scheduled_actions = await self.redis_client.lrange("scheduled_actions", 0, -1)
                
                for action_data in scheduled_actions:
                    try:
                        action_dict = json.loads(action_data)
                        scheduled_time = action_dict.get("scheduled_at")
                        
                        if scheduled_time and time.time() >= scheduled_time:
                            # Remove from scheduled and queue for execution
                            await self.redis_client.lrem("scheduled_actions", 1, action_data)
                            
                            action = ConstitutionalAction(**action_dict)
                            await self.queue_action(action)
                            
                    except json.JSONDecodeError:
                        logger.warning("Invalid JSON in scheduled actions")
                
                await asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in action scheduler: {e}")
                await asyncio.sleep(30)

    async def store_action_result(self, action: ConstitutionalAction):
        """Store action result"""
        try:
            action_data = asdict(action)
            
            # Store in Redis
            await self.redis_client.lpush("action_history", json.dumps(action_data))
            await self.redis_client.ltrim("action_history", 0, 9999)  # Keep last 10k actions
            
            # Log action completion
            await self.log_action(action, "completed")
            
            # Publish result
            await self.redis_client.publish("action_results", json.dumps(action_data))
            
        except Exception as e:
            logger.error(f"Error storing action result: {e}")

    async def log_action(self, action: ConstitutionalAction, event: str):
        """Log action event"""
        try:
            log_entry = {
                "timestamp": time.time(),
                "action_id": action.id,
                "event": event,
                "type": action.type.value,
                "priority": action.priority,
                "status": action.status.value,
                "constitutional_basis": action.constitutional_basis
            }
            
            await self.redis_client.lpush("action_logs", json.dumps(log_entry))
            await self.redis_client.ltrim("action_logs", 0, 49999)  # Keep last 50k logs
            
        except Exception as e:
            logger.error(f"Error logging action: {e}")

# FastAPI application
app = FastAPI(title="AVA Action Layer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global action engine
action_engine = ConstitutionalActionEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize action systems on startup"""
    await action_engine.initialize()
    action_engine.running = True

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    action_engine.running = False
    for task in action_engine.executor_tasks:
        task.cancel()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "active_actions": len(action_engine.active_actions),
        "queue_size": action_engine.action_queue.qsize()
    }

@app.post("/action")
async def submit_action(action_data: Dict[str, Any]):
    """Submit new action for execution"""
    try:
        action = ConstitutionalAction(
            id=action_data.get("id", f"action_{uuid.uuid4()}"),
            type=ActionType(action_data["type"]),
            priority=action_data.get("priority", 5),
            target=action_data["target"],
            parameters=action_data.get("parameters", {}),
            authorization=action_data.get("authorization", {"level": "public"}),
            constitutional_basis=action_data.get("constitutional_basis", "General Authority"),
            status=ActionStatus.PENDING,
            created_at=time.time(),
            scheduled_at=action_data.get("scheduled_at")
        )
        
        if action.scheduled_at:
            # Store as scheduled action
            await action_engine.redis_client.lpush("scheduled_actions", json.dumps(asdict(action)))
            return {"status": "scheduled", "action_id": action.id}
        else:
            # Queue immediately
            await action_engine.queue_action(action)
            return {"status": "queued", "action_id": action.id}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/action/{action_id}")
async def get_action_status(action_id: str):
    """Get action status"""
    try:
        if action_id in action_engine.active_actions:
            action = action_engine.active_actions[action_id]
            return asdict(action)
        
        # Check action history
        actions = await action_engine.redis_client.lrange("action_history", 0, -1)
        for action_data in actions:
            action_dict = json.loads(action_data)
            if action_dict["id"] == action_id:
                return action_dict
        
        raise HTTPException(status_code=404, detail="Action not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/actions/active")
async def get_active_actions():
    """Get all active actions"""
    return [asdict(action) for action in action_engine.active_actions.values()]

@app.get("/actions/history")
async def get_action_history(limit: int = 100):
    """Get action history"""
    try:
        actions = await action_engine.redis_client.lrange("action_history", 0, limit - 1)
        return [json.loads(action) for action in actions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/action/{action_id}")
async def cancel_action(action_id: str):
    """Cancel pending action"""
    try:
        if action_id in action_engine.active_actions:
            action = action_engine.active_actions[action_id]
            if action.status == ActionStatus.PENDING:
                action.status = ActionStatus.CANCELLED
                await action_engine.store_action_result(action)
                del action_engine.active_actions[action_id]
                return {"status": "cancelled", "action_id": action_id}
            else:
                raise HTTPException(status_code=400, detail="Action cannot be cancelled in current status")
        else:
            raise HTTPException(status_code=404, detail="Action not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8004)
