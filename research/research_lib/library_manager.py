#!/usr/bin/env python3
"""
Research Library Manager - Critical Knowledge Base Infrastructure
Manages secure research data storage, indexing, and retrieval
"""

import hashlib
import json
import logging
import pickle
import sqlite3
import zlib
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from cryptography.fernet import Fernet

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("research-library")


class DataCategory(Enum):
    COGNITIVE_MODELS = "cognitive_models"
    ANALYSIS_RESULTS = "analysis_results"
    RESEARCH_DATA = "research_data"
    VISUALIZATIONS = "visualizations"
    ENCRYPTED_DATA = "encrypted_data"
    PUBLICATIONS = "publications"
    EXPERIMENTS = "experiments"


class SecurityClassification(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    SECRET = "secret"
    TOP_SECRET = "top_secret"


@dataclass
class ResearchEntry:
    id: str
    title: str
    category: DataCategory
    classification: SecurityClassification
    file_path: str
    metadata: Dict[str, Any]
    created: datetime
    modified: datetime
    checksum: str
    size_bytes: int
    tags: List[str] = field(default_factory=list)


class ResearchLibrary:
    """
    Secure research library system for Artifact Virtual
    Handles encrypted storage and intelligent indexing of research assets
    """

    def __init__(self, library_dir: Path = None):
        self.library_dir = library_dir or Path(__file__).parent
        self.db_path = self.library_dir / "research_data.db"
        self.encryption_key_path = self.library_dir / ".master_key"

        # Initialize directory structure
        self._setup_directories()

        # Initialize encryption
        self._setup_encryption()

        # Initialize database
        self._setup_database()

        # Initialize search index
        self.search_index = {}
        self._build_search_index()

        logger.info("Research Library initialized")

    def _setup_directories(self):
        """Create essential library directories"""
        directories = [
            "cognitive_models",
            "analysis_results",
            "research_data",
            "visualizations",
            "encrypted_data",
            "logs",
            "exports",
            "backups",
        ]

        for directory in directories:
            dir_path = self.library_dir / directory
            dir_path.mkdir(parents=True, exist_ok=True)

    def _setup_encryption(self):
        """Initialize encryption system"""
        if not self.encryption_key_path.exists():
            key = Fernet.generate_key()
            with open(self.encryption_key_path, "wb") as f:
                f.write(key)
            logger.info("Generated new encryption key")

        with open(self.encryption_key_path, "rb") as f:
            key = f.read()

        self.cipher = Fernet(key)

    def _setup_database(self):
        """Initialize SQLite database"""
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)

        # Create main research entries table
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS research_entries (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                classification TEXT NOT NULL,
                file_path TEXT NOT NULL,
                metadata TEXT,
                created TIMESTAMP,
                modified TIMESTAMP,
                checksum TEXT,
                size_bytes INTEGER,
                tags TEXT
            )
        """
        )

        # Create search index table
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS search_index (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id TEXT,
                term TEXT,
                frequency INTEGER,
                FOREIGN KEY(entry_id) REFERENCES research_entries(id)
            )
        """
        )

        # Create access audit table
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS access_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id TEXT,
                action TEXT,
                user_id TEXT,
                timestamp TIMESTAMP,
                details TEXT
            )
        """
        )

        # Create full-text search virtual table
        self.conn.execute(
            """
            CREATE VIRTUAL TABLE IF NOT EXISTS research_fts USING fts5(
                entry_id,
                title,
                content,
                tags,
                metadata
            )
        """
        )

        self.conn.commit()

    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA-256 checksum of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()

    def add_entry(
        self,
        title: str,
        category: DataCategory,
        classification: SecurityClassification,
        file_path: Union[str, Path],
        metadata: Dict[str, Any] = None,
        tags: List[str] = None,
    ) -> str:
        """Add new research entry to library"""
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Generate unique ID
        entry_id = hashlib.sha256(
            f"{title}_{file_path}_{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        # Calculate file properties
        checksum = self._calculate_checksum(file_path)
        size_bytes = file_path.stat().st_size

        # Create entry
        entry = ResearchEntry(
            id=entry_id,
            title=title,
            category=category,
            classification=classification,
            file_path=str(file_path),
            metadata=metadata or {},
            created=datetime.now(),
            modified=datetime.now(),
            checksum=checksum,
            size_bytes=size_bytes,
            tags=tags or [],
        )

        # Insert into database
        self.conn.execute(
            """
            INSERT INTO research_entries 
            (id, title, category, classification, file_path, metadata, 
             created, modified, checksum, size_bytes, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                entry.id,
                entry.title,
                entry.category.value,
                entry.classification.value,
                entry.file_path,
                json.dumps(entry.metadata),
                entry.created.isoformat(),
                entry.modified.isoformat(),
                entry.checksum,
                entry.size_bytes,
                json.dumps(entry.tags),
            ),
        )

        # Add to full-text search
        self._add_to_fts(entry)

        # Log access
        self._log_access(entry.id, "ENTRY_ADDED", "system", f"Title: {title}")

        self.conn.commit()

        logger.info(f"Added research entry: {title} (ID: {entry_id})")
        return entry_id

    def _add_to_fts(self, entry: ResearchEntry):
        """Add entry to full-text search index"""
        # Extract content for indexing
        content = ""
        try:
            if entry.file_path.endswith(".json"):
                with open(entry.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    content = json.dumps(data)
            elif entry.file_path.endswith(".txt"):
                with open(entry.file_path, "r", encoding="utf-8") as f:
                    content = f.read()
        except Exception as e:
            logger.warning(f"Could not extract content from {entry.file_path}: {e}")

        # Insert into FTS table
        self.conn.execute(
            """
            INSERT INTO research_fts (entry_id, title, content, tags, metadata)
            VALUES (?, ?, ?, ?, ?)
        """,
            (
                entry.id,
                entry.title,
                content,
                " ".join(entry.tags),
                json.dumps(entry.metadata),
            ),
        )

    def search(
        self,
        query: str,
        category: DataCategory = None,
        classification: SecurityClassification = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Search research library"""
        # Build SQL query
        sql = """
            SELECT e.* FROM research_entries e
            JOIN research_fts fts ON e.id = fts.entry_id
            WHERE research_fts MATCH ?
        """
        params = [query]

        if category:
            sql += " AND e.category = ?"
            params.append(category.value)

        if classification:
            sql += " AND e.classification = ?"
            params.append(classification.value)

        sql += f" LIMIT {limit}"

        cursor = self.conn.execute(sql, params)
        results = []

        for row in cursor.fetchall():
            entry = self._row_to_entry(row)
            results.append(
                {
                    "id": entry.id,
                    "title": entry.title,
                    "category": entry.category.value,
                    "classification": entry.classification.value,
                    "file_path": entry.file_path,
                    "metadata": entry.metadata,
                    "created": entry.created.isoformat(),
                    "tags": entry.tags,
                }
            )

        # Log search
        self._log_access(
            "SEARCH",
            "SEARCH_PERFORMED",
            "system",
            f"Query: {query}, Results: {len(results)}",
        )

        return results

    def get_entry(self, entry_id: str) -> Optional[ResearchEntry]:
        """Get research entry by ID"""
        cursor = self.conn.execute(
            "SELECT * FROM research_entries WHERE id = ?", (entry_id,)
        )
        row = cursor.fetchone()

        if row:
            self._log_access(entry_id, "ENTRY_ACCESSED", "system", "Direct access")
            return self._row_to_entry(row)

        return None

    def _row_to_entry(self, row) -> ResearchEntry:
        """Convert database row to ResearchEntry"""
        return ResearchEntry(
            id=row[0],
            title=row[1],
            category=DataCategory(row[2]),
            classification=SecurityClassification(row[3]),
            file_path=row[4],
            metadata=json.loads(row[5]) if row[5] else {},
            created=datetime.fromisoformat(row[6]),
            modified=datetime.fromisoformat(row[7]),
            checksum=row[8],
            size_bytes=row[9],
            tags=json.loads(row[10]) if row[10] else [],
        )

    def _build_search_index(self):
        """Build in-memory search index for fast queries"""
        cursor = self.conn.execute("SELECT id, title, tags FROM research_entries")

        for row in cursor.fetchall():
            entry_id, title, tags_json = row
            tags = json.loads(tags_json) if tags_json else []

            # Index by title words
            for word in title.lower().split():
                if word not in self.search_index:
                    self.search_index[word] = []
                self.search_index[word].append(entry_id)

            # Index by tags
            for tag in tags:
                if tag.lower() not in self.search_index:
                    self.search_index[tag.lower()] = []
                self.search_index[tag.lower()].append(entry_id)

    def get_library_stats(self) -> Dict[str, Any]:
        """Get library statistics"""
        cursor = self.conn.execute(
            """
            SELECT 
                category,
                classification,
                COUNT(*) as count,
                SUM(size_bytes) as total_size
            FROM research_entries 
            GROUP BY category, classification
        """
        )

        stats = {
            "total_entries": 0,
            "total_size_bytes": 0,
            "by_category": {},
            "by_classification": {},
        }

        for row in cursor.fetchall():
            category, classification, count, total_size = row

            stats["total_entries"] += count
            stats["total_size_bytes"] += total_size or 0

            if category not in stats["by_category"]:
                stats["by_category"][category] = 0
            stats["by_category"][category] += count

            if classification not in stats["by_classification"]:
                stats["by_classification"][classification] = 0
            stats["by_classification"][classification] += count

        return stats

    def _log_access(self, entry_id: str, action: str, user_id: str, details: str):
        """Log access for security audit"""
        self.conn.execute(
            """
            INSERT INTO access_audit (entry_id, action, user_id, timestamp, details)
            VALUES (?, ?, ?, ?, ?)
        """,
            (entry_id, action, user_id, datetime.now().isoformat(), details),
        )


def initialize_research_library():
    """Initialize research library with critical components"""
    library = ResearchLibrary()

    # Create essential research entries
    essential_data = [
        {
            "title": "Cognitive Framework Models",
            "category": DataCategory.COGNITIVE_MODELS,
            "classification": SecurityClassification.CONFIDENTIAL,
            "content": {
                "models": [
                    "self_awareness",
                    "emotional_dimensionality",
                    "behavioral_analysis",
                ],
                "frameworks": ["adaptive_numeric_logic", "probabilistic_uncertainty"],
                "status": "active",
            },
        },
        {
            "title": "Research Pipeline Configuration",
            "category": DataCategory.RESEARCH_DATA,
            "classification": SecurityClassification.INTERNAL,
            "content": {
                "pipelines": [
                    "autonomous_research",
                    "analysis_engine",
                    "visualization",
                ],
                "endpoints": ["arxiv", "pubmed", "news_api"],
                "status": "operational",
            },
        },
        {
            "title": "Security Protocols",
            "category": DataCategory.ENCRYPTED_DATA,
            "classification": SecurityClassification.SECRET,
            "content": {
                "encryption": "AES-256",
                "access_control": "role_based",
                "audit_logging": "enabled",
            },
        },
    ]

    for data in essential_data:
        content = data.pop("content")

        # Create temporary file
        temp_file = (
            library.library_dir / f"temp_{data['title'].replace(' ', '_').lower()}.json"
        )
        with open(temp_file, "w") as f:
            json.dump(content, f, indent=2)

        try:
            library.add_entry(file_path=temp_file, **data)
        finally:
            temp_file.unlink()  # Clean up temp file

    logger.info("Research library initialized with essential data")


if __name__ == "__main__":
    initialize_research_library()
