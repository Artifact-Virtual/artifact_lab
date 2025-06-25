#!/usr/bin/env python3
"""
Memory Core Container - Immutable Logs & Merkle Tree Structure
Provides append-only memory system with cryptographic integrity for AVA
Manages constitutional memory, audit trails, and immutable decision logs
"""

import os
import sys
import json
import hashlib
import logging
import sqlite3
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import threading
import time

import psutil
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/memory_core.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('memory_core')

# Flask app setup
app = Flask(__name__)
CORS(app)

@dataclass
class MemoryEntry:
    entry_id: str
    timestamp: int
    entry_type: str
    data: Dict[str, Any]
    hash_value: str
    previous_hash: str
    merkle_root: str
    constitutional_validation: bool = True

class MerkleTree:
    """Simple Merkle Tree implementation for memory integrity"""
    
    def __init__(self):
        self.leaves = []
        self.tree = []
    
    def add_leaf(self, data: str) -> str:
        """Add a leaf to the tree and return its hash"""
        leaf_hash = hashlib.sha256(data.encode()).hexdigest()
        self.leaves.append(leaf_hash)
        return leaf_hash
    
    def compute_root(self) -> str:
        """Compute the Merkle root"""
        if not self.leaves:
            return "0" * 64
        
        current_level = self.leaves.copy()
        
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                combined = left + right
                parent_hash = hashlib.sha256(combined.encode()).hexdigest()
                next_level.append(parent_hash)
            current_level = next_level
        
        return current_level[0] if current_level else "0" * 64

class ConstitutionalMemory:
    """Constitutional memory management with immutable guarantees"""
    
    def __init__(self):
        self.db_path = '/data/constitutional_memory.db'
        self.merkle_tree = MerkleTree()
        self.last_hash = "0" * 64  # Genesis hash
        self.memory_lock = threading.Lock()
        self.initialize_database()
        self.load_existing_memory()

    def initialize_database(self):
        """Initialize SQLite database for memory storage"""
        try:
            os.makedirs('/data', exist_ok=True)
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create memory entries table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS memory_entries (
                        entry_id TEXT PRIMARY KEY,
                        timestamp INTEGER NOT NULL,
                        entry_type TEXT NOT NULL,
                        data TEXT NOT NULL,
                        hash_value TEXT NOT NULL,
                        previous_hash TEXT NOT NULL,
                        merkle_root TEXT NOT NULL,
                        constitutional_validation BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create audit trail table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS audit_trail (
                        audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        entry_id TEXT NOT NULL,
                        action TEXT NOT NULL,
                        timestamp INTEGER NOT NULL,
                        source TEXT,
                        metadata TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (entry_id) REFERENCES memory_entries (entry_id)
                    )
                ''')
                
                # Create indexes for performance
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON memory_entries(timestamp)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_entry_type ON memory_entries(entry_type)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_hash_value ON memory_entries(hash_value)')
                
                conn.commit()
                logger.info("✅ Constitutional memory database initialized")
                
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise

    def load_existing_memory(self):
        """Load existing memory entries to rebuild Merkle tree"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT entry_id, hash_value, previous_hash 
                    FROM memory_entries 
                    ORDER BY timestamp ASC
                ''')
                
                entries = cursor.fetchall()
                
                for entry_id, hash_value, previous_hash in entries:
                    self.merkle_tree.add_leaf(hash_value)
                    self.last_hash = hash_value
                
                if entries:
                    logger.info(f"✅ Loaded {len(entries)} existing memory entries")
                else:
                    # Create genesis entry
                    self.create_genesis_entry()
                    
        except Exception as e:
            logger.error(f"Error loading existing memory: {e}")

    def create_genesis_entry(self):
        """Create the genesis memory entry for Artifact Virtual"""
        genesis_data = {
            "type": "genesis",
            "entity": "artifact_virtual",
            "description": "Genesis memory entry for Artifact Virtual constitutional system",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "constitutional_foundation": True
        }
        
        entry = self.append_memory(
            entry_type="genesis_block",
            data=genesis_data,
            source="constitutional_initialization"
        )
        
        logger.info(f"✅ Created genesis memory entry: {entry.entry_id}")

    def compute_entry_hash(self, entry_data: str, previous_hash: str) -> str:
        """Compute hash for memory entry"""
        combined = f"{previous_hash}{entry_data}"
        return hashlib.sha256(combined.encode()).hexdigest()

    def append_memory(self, entry_type: str, data: Dict[str, Any], source: str = "unknown") -> MemoryEntry:
        """Append new entry to constitutional memory"""
        with self.memory_lock:
            try:
                # Generate entry ID
                timestamp = int(datetime.now(timezone.utc).timestamp() * 1000)  # Millisecond precision
                entry_id = hashlib.sha256(f"{entry_type}{timestamp}{json.dumps(data, sort_keys=True)}".encode()).hexdigest()[:16]
                
                # Serialize data
                data_str = json.dumps(data, sort_keys=True)
                
                # Compute hash
                hash_value = self.compute_entry_hash(data_str, self.last_hash)
                
                # Add to Merkle tree
                self.merkle_tree.add_leaf(hash_value)
                merkle_root = self.merkle_tree.compute_root()
                
                # Create memory entry
                entry = MemoryEntry(
                    entry_id=entry_id,
                    timestamp=timestamp,
                    entry_type=entry_type,
                    data=data,
                    hash_value=hash_value,
                    previous_hash=self.last_hash,
                    merkle_root=merkle_root
                )
                
                # Store in database
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        INSERT INTO memory_entries 
                        (entry_id, timestamp, entry_type, data, hash_value, previous_hash, merkle_root, constitutional_validation)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        entry.entry_id,
                        entry.timestamp,
                        entry.entry_type,
                        json.dumps(entry.data),
                        entry.hash_value,
                        entry.previous_hash,
                        entry.merkle_root,
                        entry.constitutional_validation
                    ))
                    
                    # Add audit trail entry
                    cursor.execute('''
                        INSERT INTO audit_trail (entry_id, action, timestamp, source, metadata)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        entry.entry_id,
                        "APPEND",
                        timestamp,
                        source,
                        json.dumps({"entry_type": entry_type})
                    ))
                    
                    conn.commit()
                
                # Update last hash
                self.last_hash = hash_value
                
                logger.info(f"✅ Appended memory entry: {entry_id} ({entry_type})")
                return entry
                
            except Exception as e:
                logger.error(f"Error appending memory: {e}")
                raise

    def get_memory_entries(self, entry_type: Optional[str] = None, limit: int = 100) -> List[MemoryEntry]:
        """Retrieve memory entries"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                if entry_type:
                    cursor.execute('''
                        SELECT entry_id, timestamp, entry_type, data, hash_value, previous_hash, merkle_root, constitutional_validation
                        FROM memory_entries 
                        WHERE entry_type = ?
                        ORDER BY timestamp DESC 
                        LIMIT ?
                    ''', (entry_type, limit))
                else:
                    cursor.execute('''
                        SELECT entry_id, timestamp, entry_type, data, hash_value, previous_hash, merkle_root, constitutional_validation
                        FROM memory_entries 
                        ORDER BY timestamp DESC 
                        LIMIT ?
                    ''', (limit,))
                
                entries = []
                for row in cursor.fetchall():
                    entry = MemoryEntry(
                        entry_id=row[0],
                        timestamp=row[1],
                        entry_type=row[2],
                        data=json.loads(row[3]),
                        hash_value=row[4],
                        previous_hash=row[5],
                        merkle_root=row[6],
                        constitutional_validation=bool(row[7])
                    )
                    entries.append(entry)
                
                return entries
                
        except Exception as e:
            logger.error(f"Error retrieving memory entries: {e}")
            return []

    def verify_integrity(self) -> Dict[str, Any]:
        """Verify memory chain integrity"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT entry_id, hash_value, previous_hash, data
                    FROM memory_entries 
                    ORDER BY timestamp ASC
                ''')
                
                entries = cursor.fetchall()
                issues = []
                previous_hash = "0" * 64  # Genesis hash
                
                for entry_id, hash_value, stored_previous_hash, data in entries:
                    # Verify previous hash linkage
                    if stored_previous_hash != previous_hash:
                        issues.append(f"Hash chain broken at entry {entry_id}")
                    
                    # Verify hash computation
                    computed_hash = self.compute_entry_hash(data, stored_previous_hash)
                    if computed_hash != hash_value:
                        issues.append(f"Hash mismatch at entry {entry_id}")
                    
                    previous_hash = hash_value
                
                return {
                    "integrity_verified": len(issues) == 0,
                    "total_entries": len(entries),
                    "issues": issues,
                    "current_merkle_root": self.merkle_tree.compute_root(),
                    "last_hash": self.last_hash
                }
                
        except Exception as e:
            logger.error(f"Error verifying integrity: {e}")
            return {"integrity_verified": False, "error": str(e)}

    def get_statistics(self) -> Dict[str, Any]:
        """Get memory statistics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Total entries
                cursor.execute('SELECT COUNT(*) FROM memory_entries')
                total_entries = cursor.fetchone()[0]
                
                # Entries by type
                cursor.execute('''
                    SELECT entry_type, COUNT(*) 
                    FROM memory_entries 
                    GROUP BY entry_type
                ''')
                entries_by_type = dict(cursor.fetchall())
                
                # Recent activity
                cursor.execute('''
                    SELECT COUNT(*) 
                    FROM memory_entries 
                    WHERE timestamp > ?
                ''', (int((datetime.now(timezone.utc).timestamp() - 3600) * 1000),))  # Last hour
                recent_entries = cursor.fetchone()[0]
                
                return {
                    "total_entries": total_entries,
                    "entries_by_type": entries_by_type,
                    "recent_entries_last_hour": recent_entries,
                    "merkle_root": self.merkle_tree.compute_root(),
                    "last_hash": self.last_hash
                }
                
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {}

# Global memory instance
constitutional_memory = ConstitutionalMemory()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check system resources
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Check database connectivity
        with sqlite3.connect(constitutional_memory.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM memory_entries')
            entry_count = cursor.fetchone()[0]
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": (disk.used / disk.total) * 100
            },
            "memory_core": {
                "total_entries": entry_count,
                "database_connected": True,
                "merkle_root": constitutional_memory.merkle_tree.compute_root()
            }
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

@app.route('/memory/append', methods=['POST'])
def append_memory():
    """Append new entry to constitutional memory"""
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        entry_type = data.get('entry_type', 'general')
        entry_data = data.get('data', {})
        source = data.get('source', 'api_request')
        
        if not entry_data:
            return jsonify({"success": False, "error": "No entry data provided"}), 400
        
        entry = constitutional_memory.append_memory(entry_type, entry_data, source)
        
        return jsonify({
            "success": True,
            "entry": asdict(entry),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error appending memory: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/memory/entries', methods=['GET'])
def get_memory_entries():
    """Get memory entries"""
    try:
        entry_type = request.args.get('type')
        limit = int(request.args.get('limit', 100))
        
        entries = constitutional_memory.get_memory_entries(entry_type, limit)
        
        return jsonify({
            "success": True,
            "entries": [asdict(entry) for entry in entries],
            "count": len(entries),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting memory entries: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/memory/verify', methods=['GET'])
def verify_memory_integrity():
    """Verify memory chain integrity"""
    try:
        integrity_result = constitutional_memory.verify_integrity()
        
        return jsonify({
            "success": True,
            "integrity": integrity_result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error verifying memory integrity: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/memory/statistics', methods=['GET'])
def get_memory_statistics():
    """Get memory statistics"""
    try:
        stats = constitutional_memory.get_statistics()
        
        return jsonify({
            "success": True,
            "statistics": stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting memory statistics: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/memory/merkle', methods=['GET'])
def get_merkle_info():
    """Get Merkle tree information"""
    try:
        return jsonify({
            "success": True,
            "merkle": {
                "root": constitutional_memory.merkle_tree.compute_root(),
                "leaf_count": len(constitutional_memory.merkle_tree.leaves),
                "last_hash": constitutional_memory.last_hash
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting Merkle info: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/memory/audit', methods=['GET'])
def get_audit_trail():
    """Get audit trail"""
    try:
        limit = int(request.args.get('limit', 50))
        
        with sqlite3.connect(constitutional_memory.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT audit_id, entry_id, action, timestamp, source, metadata, created_at
                FROM audit_trail 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            
            audit_entries = []
            for row in cursor.fetchall():
                audit_entries.append({
                    "audit_id": row[0],
                    "entry_id": row[1],
                    "action": row[2],
                    "timestamp": row[3],
                    "source": row[4],
                    "metadata": json.loads(row[5]) if row[5] else {},
                    "created_at": row[6]
                })
        
        return jsonify({
            "success": True,
            "audit_trail": audit_entries,
            "count": len(audit_entries),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting audit trail: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

def startup_initialization():
    """Perform startup initialization"""
    logger.info("💾 Starting Memory Core - Immutable Logs & Merkle Structure")
    logger.info(f"Database Path: {constitutional_memory.db_path}")
    
    # Ensure directories exist
    os.makedirs('/data', exist_ok=True)
    os.makedirs('/app/logs', exist_ok=True)
    
    # Verify integrity on startup
    integrity_result = constitutional_memory.verify_integrity()
    if integrity_result.get('integrity_verified'):
        logger.info("✅ Memory integrity verification passed")
    else:
        logger.warning(f"⚠️ Memory integrity issues: {integrity_result.get('issues', [])}")
    
    # Log statistics
    stats = constitutional_memory.get_statistics()
    logger.info(f"📊 Memory Statistics: {stats.get('total_entries', 0)} entries, Merkle root: {stats.get('merkle_root', 'unknown')[:16]}...")
    
    logger.info("✅ Memory Core initialization complete")

if __name__ == '__main__':
    startup_initialization()
    
    # Start Flask server
    app.run(
        host='0.0.0.0',
        port=3000,
        debug=os.getenv('DEBUG_MODE', 'false').lower() == 'true'
    )
