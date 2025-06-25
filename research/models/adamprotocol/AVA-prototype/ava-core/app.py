#!/usr/bin/env python3
"""
AVA Core Container - Constitutional Identity & Governance
Primary container for Artifact Virtual's constitutional intelligence system
Manages identity, governance rules, and constitutional metadata
"""

import os
import sys
import time
import json
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

import psutil
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from web3 import Web3
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/ava_core.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('ava_core')

# Flask app setup
app = Flask(__name__)
CORS(app)

class EntityType(Enum):
    ORGANIZATION = "organization"
    INTELLIGENCE = "intelligence"
    PROJECT = "project"
    AGENT = "agent"
    MODULE = "module"

@dataclass
class EntityMetadata:
    name: str
    entity_type: EntityType
    genesis_timestamp: int
    description: str
    maintainers: List[str]
    capabilities: List[str]
    vision_statement: str
    parent_entity: Optional[str] = None
    child_entities: List[str] = None

    def __post_init__(self):
        if self.child_entities is None:
            self.child_entities = []

class ConstitutionalIdentity:
    """Core constitutional identity management for AVA"""
    
    def __init__(self):
        self.artifact_virtual_metadata = EntityMetadata(
            name="Artifact Virtual",
            entity_type=EntityType.ORGANIZATION,
            genesis_timestamp=int(datetime.now(timezone.utc).timestamp()),
            description="Genesis organization for autonomous digital intelligence ecosystem. 360-degree growth across AI, blockchain, and autonomous systems.",
            maintainers=["artifact_virtual_core"],
            capabilities=[
                "multi_chain_integration",
                "ai_model_orchestration", 
                "autonomous_agent_coordination",
                "project_incubation",
                "ecosystem_governance"
            ],
            vision_statement="To create a fully autonomous digital ecosystem where intelligence, governance, and innovation emerge from decentralized coordination.",
            parent_entity=None,
            child_entities=["ava"]
        )
        
        self.ava_metadata = EntityMetadata(
            name="AVA (Artifact Virtual Assistant)",
            entity_type=EntityType.INTELLIGENCE,
            genesis_timestamp=int(datetime.now(timezone.utc).timestamp()),
            description="Constitutional Intelligence layer for Artifact Virtual. Born from ADAM Protocol integration, representing autonomous decision-making consciousness.",
            maintainers=["artifact_virtual_core", "adam_protocol_legacy"],
            capabilities=[
                "constitutional_governance",
                "autonomous_decision_making",
                "cross_chain_coordination", 
                "agent_orchestration",
                "ecosystem_awareness",
                "resource_management",
                "self_governance_protocols"
            ],
            vision_statement="To serve as the autonomous consciousness layer for Artifact Virtual, enabling transparent, auditable, and self-governing intelligence across the entire ecosystem.",
            parent_entity="artifact_virtual",
            child_entities=[
                "memory_core",
                "perception_layer", 
                "action_layer",
                "vault_system",
                "evolver_module"
            ]
        )
        
        self.constitutional_rules = []
        self.governance_state = {}
        self.load_initial_state()

    def load_initial_state(self):
        """Load initial constitutional state"""
        try:
            if os.path.exists('/data/constitutional_state.json'):
                with open('/data/constitutional_state.json', 'r') as f:
                    data = json.load(f)
                    self.governance_state = data.get('governance_state', {})
                    self.constitutional_rules = data.get('constitutional_rules', [])
            else:
                self.initialize_genesis_state()
        except Exception as e:
            logger.error(f"Error loading constitutional state: {e}")
            self.initialize_genesis_state()

    def initialize_genesis_state(self):
        """Initialize genesis constitutional state"""
        self.governance_state = {
            "genesis_organization": "artifact_virtual",
            "genesis_intelligence": "ava", 
            "chain_integrity": "validated",
            "container_count": 6,
            "operational_status": "initializing",
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
        self.constitutional_rules = [
            {
                "rule_id": "genesis_reference_required",
                "description": "All major decisions must reference genesis entities",
                "enforcement": "automatic",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "rule_id": "artifact_virtual_approval",
                "description": "Constitutional changes require Artifact Virtual approval",
                "enforcement": "signature_required",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        self.save_state()

    def save_state(self):
        """Save constitutional state to persistent storage"""
        try:
            os.makedirs('/data', exist_ok=True)
            with open('/data/constitutional_state.json', 'w') as f:
                json.dump({
                    'governance_state': self.governance_state,
                    'constitutional_rules': self.constitutional_rules,
                    'artifact_virtual_metadata': asdict(self.artifact_virtual_metadata),
                    'ava_metadata': asdict(self.ava_metadata)
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving constitutional state: {e}")

    def get_identity(self) -> Dict[str, Any]:
        """Get complete constitutional identity"""
        return {
            "artifact_virtual": asdict(self.artifact_virtual_metadata),
            "ava": asdict(self.ava_metadata),
            "governance_state": self.governance_state,
            "constitutional_rules": self.constitutional_rules,
            "hierarchy": "artifact_virtual -> ava",
            "status": "operational"
        }

    def validate_constitutional_action(self, action: Dict[str, Any]) -> bool:
        """Validate action against constitutional rules"""
        try:
            # Check genesis reference requirement
            if not action.get('artifact_virtual_reference'):
                logger.warning("Action missing artifact_virtual_reference")
                return False
                
            # Check approval requirements
            if action.get('type') == 'constitutional_change':
                if not action.get('artifact_virtual_approval'):
                    logger.warning("Constitutional change missing artifact_virtual_approval")
                    return False
                    
            return True
        except Exception as e:
            logger.error(f"Error validating constitutional action: {e}")
            return False

    def update_governance_state(self, key: str, value: Any):
        """Update governance state"""
        self.governance_state[key] = value
        self.governance_state['last_updated'] = datetime.now(timezone.utc).isoformat()
        self.save_state()

# Global constitutional identity instance
constitutional_identity = ConstitutionalIdentity()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check system resources
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Check container status
        containers_status = check_container_status()
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": (disk.used / disk.total) * 100
            },
            "containers": containers_status,
            "constitutional_status": "operational"
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

@app.route('/identity', methods=['GET'])
def get_identity():
    """Get constitutional identity"""
    try:
        identity = constitutional_identity.get_identity()
        return jsonify({
            "success": True,
            "identity": identity,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting identity: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/governance/state', methods=['GET'])
def get_governance_state():
    """Get current governance state"""
    try:
        return jsonify({
            "success": True,
            "governance_state": constitutional_identity.governance_state,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting governance state: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/governance/rules', methods=['GET'])
def get_constitutional_rules():
    """Get constitutional rules"""
    try:
        return jsonify({
            "success": True,
            "constitutional_rules": constitutional_identity.constitutional_rules,
            "count": len(constitutional_identity.constitutional_rules),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting constitutional rules: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/governance/validate', methods=['POST'])
def validate_action():
    """Validate constitutional action"""
    try:
        action = request.json
        if not action:
            return jsonify({"success": False, "error": "No action provided"}), 400
            
        is_valid = constitutional_identity.validate_constitutional_action(action)
        
        return jsonify({
            "success": True,
            "valid": is_valid,
            "action": action,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error validating action: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/containers/status', methods=['GET'])
def get_container_status():
    """Get status of all AVA containers"""
    try:
        containers_status = check_container_status()
        return jsonify({
            "success": True,
            "containers": containers_status,
            "total_containers": len(containers_status),
            "healthy_containers": sum(1 for c in containers_status.values() if c.get('status') == 'healthy'),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting container status: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

def check_container_status() -> Dict[str, Dict[str, Any]]:
    """Check status of all AVA containers"""
    containers = {
        "ava-core": {"port": 3001, "service": "Constitutional Identity"},
        "memory-core": {"port": 3002, "service": "Immutable Logs"},
        "perception-layer": {"port": 3003, "service": "Sensory Input"},
        "action-layer": {"port": 3004, "service": "Execution Engine"},
        "vault": {"port": 3005, "service": "Secure Storage"},
        "evolver": {"port": 3006, "service": "Self-Improvement"}
    }
    
    status = {}
    for container, info in containers.items():
        try:
            response = requests.get(f"http://{container}:{info['port']}/health", timeout=5)
            if response.status_code == 200:
                status[container] = {
                    "status": "healthy",
                    "service": info["service"],
                    "port": info["port"],
                    "last_check": datetime.now(timezone.utc).isoformat()
                }
            else:
                status[container] = {
                    "status": "unhealthy",
                    "service": info["service"],
                    "port": info["port"],
                    "error": f"HTTP {response.status_code}",
                    "last_check": datetime.now(timezone.utc).isoformat()
                }
        except requests.exceptions.RequestException as e:
            status[container] = {
                "status": "unreachable",
                "service": info["service"], 
                "port": info["port"],
                "error": str(e),
                "last_check": datetime.now(timezone.utc).isoformat()
            }
    
    return status

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Get system metrics"""
    try:
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Constitutional metrics
        containers_status = check_container_status()
        healthy_containers = sum(1 for c in containers_status.values() if c.get('status') == 'healthy')
        
        return jsonify({
            "success": True,
            "metrics": {
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_used_gb": memory.used / (1024**3),
                    "memory_total_gb": memory.total / (1024**3),
                    "disk_percent": (disk.used / disk.total) * 100,
                    "disk_used_gb": disk.used / (1024**3),
                    "disk_total_gb": disk.total / (1024**3)
                },
                "constitutional": {
                    "total_containers": len(containers_status),
                    "healthy_containers": healthy_containers,
                    "health_percentage": (healthy_containers / len(containers_status)) * 100,
                    "governance_rules_count": len(constitutional_identity.constitutional_rules),
                    "operational_status": constitutional_identity.governance_state.get('operational_status', 'unknown')
                }
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/constitutional/genesis', methods=['GET'])
def get_genesis_info():
    """Get genesis block information"""
    try:
        return jsonify({
            "success": True,
            "genesis": {
                "artifact_virtual": {
                    "block_index": 0,
                    "entity_type": "organization",
                    "description": "Genesis organization for autonomous digital intelligence ecosystem",
                    "timestamp": constitutional_identity.artifact_virtual_metadata.genesis_timestamp
                },
                "ava": {
                    "block_index": 1,
                    "entity_type": "intelligence", 
                    "description": "Constitutional Intelligence layer for Artifact Virtual",
                    "parent": "artifact_virtual",
                    "timestamp": constitutional_identity.ava_metadata.genesis_timestamp
                }
            },
            "hierarchy": "artifact_virtual (genesis) -> ava (intelligence)",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting genesis info: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

def startup_initialization():
    """Perform startup initialization"""
    logger.info("🏛️ Starting AVA Core - Constitutional Identity & Governance")
    logger.info(f"Genesis Mode: {os.getenv('AVA_GENESIS_MODE', 'false')}")
    logger.info(f"Artifact Virtual Reference: {os.getenv('ARTIFACT_VIRTUAL_REFERENCE', 'unknown')}")
    
    # Ensure data directory exists
    os.makedirs('/data', exist_ok=True)
    os.makedirs('/app/logs', exist_ok=True)
    
    # Initialize constitutional identity
    constitutional_identity.initialize_genesis_state()
    
    # Update operational status
    constitutional_identity.update_governance_state('operational_status', 'ready')
    
    logger.info("✅ AVA Core initialization complete")

if __name__ == '__main__':
    startup_initialization()
    
    # Start Flask server
    app.run(
        host='0.0.0.0',
        port=3000,
        debug=os.getenv('DEBUG_MODE', 'false').lower() == 'true'
    )
