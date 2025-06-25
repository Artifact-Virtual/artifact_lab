#!/usr/bin/env python3
"""
AVA Core Service: Constitutional Intelligence Core Module
Identity & Constitutional Metadata Management

This service manages the core constitutional intelligence functionality,
genesis block creation, and system coordination.
"""

import os
import json
import time
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

# Import AVA intelligent core functionality
import sys
sys.path.append('/app')
from ava_core_intelligent import (
    IntelligentAVACore,
    IntelligentMetaBlock,
    IntelligentConstitutionalChain,
    ConstitutionalPrinciple,
    AgentRegistration as IntelligentAgentRegistration,
    ConstitutionalDecision
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO').upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="AVA Core Service",
    description="Constitutional Intelligence Core Module for Artifact Virtual Assistant",
    version="1.0.0"
)

# Global intelligent AVA instance
ava_instance: Optional[IntelligentAVACore] = None

# Request/Response Models
class HealthResponse(BaseModel):
    status: str
    timestamp: int
    module: str
    version: str

class AgentRegistration(BaseModel):
    agent_id: str
    agent_type: str
    capabilities: list
    description: str

class GovernanceProposal(BaseModel):
    title: str
    description: str
    impact: str
    proposed_by: str
    proposal_type: str = "general"

@app.on_event("startup")
async def startup_event():
    """Initialize Intelligent AVA Core on startup"""
    global ava_instance
    
    logger.info("🏛️ Starting AVA Intelligent Core Service...")
    
    try:
        # Initialize Intelligent AVA Core
        ava_instance = IntelligentAVACore()
        ava_instance.initialize()
        
        # Initialize constitutional principles
        await initialize_constitutional_framework()
        
        # Start consciousness layer with intelligence
        await ava_instance.start_consciousness_layer()
        
        # Export initial constitutional chain
        if hasattr(ava_instance, 'constitutional_chain') and ava_instance.constitutional_chain:
            ava_instance.constitutional_chain.export_chain("/data/memory/genesis_chain.json")
        
        logger.info("✅ AVA Intelligent Core Service initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize AVA Intelligent Core: {e}")
        raise

async def initialize_constitutional_framework():
    """Initialize the constitutional framework with core principles"""
    if not ava_instance:
        return
    
    # Core constitutional principles
    principles = [
        ConstitutionalPrinciple(
            name="Safety First",
            description="All actions must prioritize safety and harm prevention",
            priority=1,
            enforceable=True
        ),
        ConstitutionalPrinciple(
            name="Transparency",
            description="All decisions must be transparent and auditable",
            priority=2,
            enforceable=True
        ),
        ConstitutionalPrinciple(
            name="Consent",
            description="Actions affecting others require explicit consent",
            priority=3,
            enforceable=True
        ),
        ConstitutionalPrinciple(
            name="Non-harm",
            description="Do not cause harm to individuals or systems",
            priority=1,
            enforceable=True
        )
    ]
    
    # Add principles to the constitutional framework
    for principle in principles:
        if hasattr(ava_instance, 'add_constitutional_principle'):
            ava_instance.add_constitutional_principle(principle)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Enhanced health check endpoint with intelligence metrics"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Intelligent Core not initialized")
    
    # Get enhanced status from intelligent core
    status = ava_instance.get_system_status() if hasattr(ava_instance, 'get_system_status') else {}
    
    return HealthResponse(
        status="healthy",
        timestamp=int(time.time()),
        module="ava-intelligent-core",
        version="2.0.0"
    )

@app.post("/intelligence/decisions/make")
async def make_intelligent_decision(context: str, options: list, priority: str = "safety"):
    """Make an intelligent constitutional decision"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Intelligent Core not initialized")
    
    try:
        if hasattr(ava_instance, 'make_constitutional_decision'):
            decision = ava_instance.make_constitutional_decision(
                context=context,
                options=options,
                priority=priority
            )
            return {
                "decision_id": f"decision_{int(time.time())}",
                "selected_option": decision.get("selected_option"),
                "confidence_score": decision.get("confidence_score", 0.0),
                "constitutional_compliance": decision.get("constitutional_compliance", False),
                "reasoning": decision.get("reasoning", ""),
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=501, detail="Intelligent decision making not available")
    except Exception as e:
        logger.error(f"Intelligent decision failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/intelligence/blocks/create")
async def create_intelligent_block(data: dict, block_type: str = "governance", metadata: dict = None):
    """Create a new intelligent constitutional block"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Intelligent Core not initialized")
    
    try:
        # Create intelligent block
        block = IntelligentMetaBlock(
            data=data,
            block_type=block_type,
            metadata=metadata or {}
        )
        
        # Add to constitutional chain if available
        if hasattr(ava_instance, 'add_block_to_chain'):
            chain_result = ava_instance.add_block_to_chain(block)
            return {
                "block_id": block.unique_id,
                "hash": block.hash,
                "stability_score": block.stability_score,
                "intelligence_metrics": block.get_intelligence_metrics(),
                "constitutional_validation": chain_result.get("constitutional_validation", False),
                "timestamp": block.timestamp.isoformat()
            }
        else:
            return {
                "block_id": block.unique_id,
                "hash": block.hash,
                "stability_score": block.stability_score,
                "intelligence_metrics": block.get_intelligence_metrics(),
                "timestamp": block.timestamp.isoformat()
            }
    except Exception as e:
        logger.error(f"Intelligent block creation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/intelligence/metrics")
async def get_intelligence_metrics():
    """Get comprehensive intelligence metrics"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Intelligent Core not initialized")
    
    try:
        if hasattr(ava_instance, 'get_intelligence_metrics'):
            metrics = ava_instance.get_intelligence_metrics()
            return {
                "system_intelligence": metrics.get("system_intelligence", {}),
                "decision_accuracy": metrics.get("decision_accuracy", 0.0),
                "constitutional_compliance_rate": metrics.get("compliance_rate", 0.0),
                "autonomous_decisions_made": metrics.get("autonomous_decisions", 0),
                "safety_protocol_activations": metrics.get("safety_activations", 0),
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "message": "Intelligence metrics not available in current version",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Intelligence metrics retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/genesis")
async def get_genesis_info():
    """Get genesis block information"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Core not initialized")
    
    chain = ava_instance.constitutional_chain
    
    return {
        "artifact_virtual_genesis": {
            "hash": chain.genesis_artifact_virtual.hash,
            "timestamp": chain.genesis_artifact_virtual.timestamp,
            "index": chain.genesis_artifact_virtual.index,
            "entity_metadata": chain.genesis_artifact_virtual.entity_metadata.__dict__ if chain.genesis_artifact_virtual.entity_metadata else None
        },
        "ava_genesis": {
            "hash": chain.genesis_ava.hash,
            "timestamp": chain.genesis_ava.timestamp,
            "index": chain.genesis_ava.index,
            "entity_metadata": chain.genesis_ava.entity_metadata.__dict__ if chain.genesis_ava.entity_metadata else None
        },
        "chain_length": len(chain.blocks)
    }

@app.get("/identity")
async def get_identity():
    """Get AVA identity and system information"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Core not initialized")
    
    status = ava_instance.get_system_status()
    
    return {
        "name": "AVA (Artifact Virtual Assistant)",
        "type": "Constitutional Intelligence",
        "version": "1.0.0",
        "genesis_time": ava_instance.constitutional_chain.genesis_ava.timestamp if ava_instance.constitutional_chain.genesis_ava else None,
        "capabilities": [
            "constitutional_governance",
            "autonomous_decision_making",
            "cross_chain_coordination",
            "agent_orchestration",
            "ecosystem_awareness",
            "resource_management",
            "self_governance_protocols"
        ],
        "status": status,
        "artifact_virtual_reference": "parent_organization"
    }

@app.get("/governance/state")
async def get_governance_state():
    """Get current governance state"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Core not initialized")
    
    return ava_instance.constitutional_chain.get_governance_state()

@app.post("/agents/register")
async def register_agent(registration: AgentRegistration):
    """Register a new agent with AVA"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Core not initialized")
    
    agent_info = {
        "type": registration.agent_type,
        "capabilities": registration.capabilities,
        "description": registration.description
    }
    
    success = ava_instance.register_agent(registration.agent_id, agent_info)
    
    if success:
        return {"status": "registered", "agent_id": registration.agent_id}
    else:
        raise HTTPException(status_code=400, detail="Failed to register agent")

@app.get("/agents")
async def list_agents():
    """List all registered agents"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Core not initialized")
    
    return ava_instance.agent_registry

@app.post("/governance/proposals")
async def create_proposal(proposal: GovernanceProposal):
    """Create a new governance proposal"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Core not initialized")
    
    proposal_data = {
        "title": proposal.title,
        "description": proposal.description,
        "impact": proposal.impact,
        "proposed_by": proposal.proposed_by,
        "proposal_type": proposal.proposal_type
    }
    
    proposal_id = ava_instance.create_governance_proposal(proposal_data)
    
    return {"proposal_id": proposal_id, "status": "created"}

@app.get("/governance/proposals")
async def list_proposals():
    """List all governance proposals"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Core not initialized")
    
    return ava_instance.governance_proposals

@app.get("/modules/status")
async def get_module_status():
    """Get status of all AVA modules"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Core not initialized")
    
    return ava_instance.active_modules

@app.post("/constitutional/export")
async def export_constitutional_chain(background_tasks: BackgroundTasks):
    """Export the constitutional chain to file"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Core not initialized")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"/data/memory/constitutional_chain_{timestamp}.json"
    
    def export_chain():
        ava_instance.constitutional_chain.export_chain(filename)
    
    background_tasks.add_task(export_chain)
    
    return {"status": "export_initiated", "filename": filename}

@app.get("/metrics")
async def get_metrics():
    """Get system metrics for monitoring"""
    if not ava_instance:
        raise HTTPException(status_code=503, detail="AVA Core not initialized")
    
    status = ava_instance.get_system_status()
    
    return {
        "uptime": status["system_uptime"],
        "active_modules": len(status["active_modules"]),
        "registered_agents": status["registered_agents"],
        "pending_proposals": status["pending_proposals"],
        "constitutional_chain_length": status["constitutional_chain"]["total_blocks"],
        "memory_usage": "N/A",  # Could be implemented with psutil
        "timestamp": int(time.time())
    }

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "AVA Core",
        "description": "Constitutional Intelligence Core Module",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": [
            "/health",
            "/genesis", 
            "/identity",
            "/governance/state",
            "/agents",
            "/governance/proposals",
            "/modules/status",
            "/constitutional/export",
            "/metrics"
        ]
    }

# Error handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(
        "ava_core_service:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("HOT_RELOAD", "false").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )
