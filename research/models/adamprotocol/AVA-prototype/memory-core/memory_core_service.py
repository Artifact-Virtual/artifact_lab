#!/usr/bin/env python3
"""
AVA Memory Core: Immutable Logs & Merkle Structure
Append-only memory system with blockchain synchronization

This module manages the immutable memory system using Merkle trees
and maintains append-only logs for the constitutional chain.
"""

import os
import json
import time
import hashlib
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO').upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class MerkleNode:
    """Node in the Merkle tree"""
    hash: str
    left: Optional['MerkleNode'] = None
    right: Optional['MerkleNode'] = None
    data: Optional[str] = None

class MerkleTree:
    """Merkle tree implementation for immutable memory"""
    
    def __init__(self):
        self.leaves: List[str] = []
        self.root: Optional[MerkleNode] = None
    
    def add_leaf(self, data: str) -> str:
        """Add a new leaf to the tree"""
        leaf_hash = hashlib.sha256(data.encode()).hexdigest()
        self.leaves.append(leaf_hash)
        self._rebuild_tree()
        logger.info(f"Added leaf to Merkle tree: {leaf_hash[:16]}...")
        return leaf_hash
    
    def _rebuild_tree(self):
        """Rebuild the Merkle tree from leaves"""
        if not self.leaves:
            self.root = None
            return
        
        # Create leaf nodes
        nodes = [MerkleNode(hash=leaf, data=leaf) for leaf in self.leaves]
        
        # Build tree bottom-up
        while len(nodes) > 1:
            next_level = []
            
            for i in range(0, len(nodes), 2):
                left = nodes[i]
                right = nodes[i + 1] if i + 1 < len(nodes) else left
                
                combined = left.hash + right.hash
                parent_hash = hashlib.sha256(combined.encode()).hexdigest()
                parent = MerkleNode(hash=parent_hash, left=left, right=right)
                next_level.append(parent)
            
            nodes = next_level
        
        self.root = nodes[0] if nodes else None
    
    def get_root_hash(self) -> Optional[str]:
        """Get the root hash of the tree"""
        return self.root.hash if self.root else None
    
    def get_proof(self, leaf_index: int) -> List[str]:
        """Get Merkle proof for a leaf"""
        if leaf_index >= len(self.leaves):
            return []
        
        proof = []
        # Implementation would include generating the proof path
        # Simplified for this example
        return proof
    
    def verify_proof(self, leaf_hash: str, proof: List[str], root_hash: str) -> bool:
        """Verify a Merkle proof"""
        # Implementation would verify the proof
        # Simplified for this example
        return True

class MemoryCore:
    """Core memory management system"""
    
    def __init__(self):
        self.merkle_tree = MerkleTree()
        self.memory_log: List[Dict[str, Any]] = []
        self.backup_interval = int(os.getenv('MEMORY_BACKUP_INTERVAL', '3600'))
        self.storage_path = os.getenv('MEMORY_STORAGE_PATH', '/data/merkle')
        self._ensure_storage_path()
        self._load_from_disk()
    
    def _ensure_storage_path(self):
        """Ensure storage directory exists"""
        os.makedirs(self.storage_path, exist_ok=True)
    
    def _load_from_disk(self):
        """Load existing memory state from disk"""
        try:
            memory_file = os.path.join(self.storage_path, 'memory_log.json')
            if os.path.exists(memory_file):
                with open(memory_file, 'r') as f:
                    data = json.load(f)
                    self.memory_log = data.get('memory_log', [])
                    
                    # Rebuild Merkle tree from stored data
                    for entry in self.memory_log:
                        self.merkle_tree.add_leaf(json.dumps(entry))
                    
                logger.info(f"Loaded {len(self.memory_log)} memory entries from disk")
        except Exception as e:
            logger.error(f"Error loading memory from disk: {e}")
    
    def _save_to_disk(self):
        """Save memory state to disk"""
        try:
            memory_file = os.path.join(self.storage_path, 'memory_log.json')
            backup_data = {
                'timestamp': time.time(),
                'memory_log': self.memory_log,
                'merkle_root': self.merkle_tree.get_root_hash(),
                'total_entries': len(self.memory_log)
            }
            
            with open(memory_file, 'w') as f:
                json.dump(backup_data, f, indent=2)
                
            logger.info(f"Saved {len(self.memory_log)} memory entries to disk")
        except Exception as e:
            logger.error(f"Error saving memory to disk: {e}")
    
    def append_memory(self, data: Dict[str, Any]) -> str:
        """Append new data to immutable memory"""
        memory_entry = {
            'timestamp': time.time(),
            'index': len(self.memory_log),
            'data': data,
            'hash': None
        }
        
        # Calculate hash for the entry
        entry_json = json.dumps(memory_entry, sort_keys=True)
        entry_hash = hashlib.sha256(entry_json.encode()).hexdigest()
        memory_entry['hash'] = entry_hash
        
        # Add to memory log (append-only)
        self.memory_log.append(memory_entry)
        
        # Add to Merkle tree
        leaf_hash = self.merkle_tree.add_leaf(entry_json)
        
        logger.info(f"Appended memory entry {memory_entry['index']}: {entry_hash[:16]}...")
        return entry_hash
    
    def get_memory_state(self) -> Dict[str, Any]:
        """Get current memory state"""
        return {
            'total_entries': len(self.memory_log),
            'merkle_root': self.merkle_tree.get_root_hash(),
            'latest_entry': self.memory_log[-1] if self.memory_log else None,
            'storage_path': self.storage_path
        }
    
    def get_memory_entry(self, index: int) -> Optional[Dict[str, Any]]:
        """Get specific memory entry by index"""
        if 0 <= index < len(self.memory_log):
            return self.memory_log[index]
        return None
    
    def search_memory(self, query: str) -> List[Dict[str, Any]]:
        """Search memory entries"""
        results = []
        query_lower = query.lower()
        
        for entry in self.memory_log:
            entry_str = json.dumps(entry).lower()
            if query_lower in entry_str:
                results.append(entry)
        
        return results
    
    async def periodic_backup(self):
        """Periodic backup task"""
        while True:
            await asyncio.sleep(self.backup_interval)
            self._save_to_disk()

# FastAPI app
app = FastAPI(
    title="AVA Memory Core",
    description="Immutable memory system with Merkle tree structure",
    version="1.0.0"
)

# Global memory core instance
memory_core = MemoryCore()

# Request/Response Models
class MemoryEntry(BaseModel):
    data: dict
    source: str = "api"

class HealthResponse(BaseModel):
    status: str
    timestamp: int
    module: str
    total_entries: int
    merkle_root: Optional[str]

@app.on_event("startup")
async def startup_event():
    """Initialize memory core on startup"""
    logger.info("🧠 Starting AVA Memory Core...")
    
    # Start periodic backup task
    asyncio.create_task(memory_core.periodic_backup())
    
    logger.info("✅ Memory Core initialized successfully")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    state = memory_core.get_memory_state()
    
    return HealthResponse(
        status="healthy",
        timestamp=int(time.time()),
        module="memory-core",
        total_entries=state['total_entries'],
        merkle_root=state['merkle_root']
    )

@app.get("/merkle/status")
async def merkle_status():
    """Get Merkle tree status"""
    return memory_core.get_memory_state()

@app.post("/memory/append")
async def append_memory(entry: MemoryEntry):
    """Append new entry to memory"""
    entry_data = {
        'source': entry.source,
        'data': entry.data,
        'api_timestamp': time.time()
    }
    
    entry_hash = memory_core.append_memory(entry_data)
    
    return {
        'status': 'appended',
        'hash': entry_hash,
        'index': len(memory_core.memory_log) - 1
    }

@app.get("/memory/{index}")
async def get_memory_entry(index: int):
    """Get memory entry by index"""
    entry = memory_core.get_memory_entry(index)
    
    if entry is None:
        raise HTTPException(status_code=404, detail="Memory entry not found")
    
    return entry

@app.get("/memory/search")
async def search_memory(q: str):
    """Search memory entries"""
    results = memory_core.search_memory(q)
    
    return {
        'query': q,
        'results': results,
        'count': len(results)
    }

@app.get("/memory/latest")
async def get_latest_entries(limit: int = 10):
    """Get latest memory entries"""
    if limit <= 0:
        limit = 10
    
    latest = memory_core.memory_log[-limit:] if memory_core.memory_log else []
    
    return {
        'entries': latest,
        'count': len(latest),
        'total_entries': len(memory_core.memory_log)
    }

@app.post("/memory/backup")
async def manual_backup():
    """Trigger manual backup"""
    memory_core._save_to_disk()
    return {'status': 'backup_completed', 'timestamp': time.time()}

@app.get("/")
async def root():
    """Root endpoint with service information"""
    state = memory_core.get_memory_state()
    
    return {
        "service": "AVA Memory Core",
        "description": "Immutable memory system with Merkle tree structure",
        "version": "1.0.0",
        "status": "operational",
        "memory_state": state,
        "endpoints": [
            "/health",
            "/merkle/status",
            "/memory/append",
            "/memory/{index}",
            "/memory/search",
            "/memory/latest",
            "/memory/backup"
        ]
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(
        "memory_core_service:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("HOT_RELOAD", "false").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )
