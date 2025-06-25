#!/usr/bin/env python3
"""
Research Queue Manager - Critical Infrastructure Component
Handles autonomous research task queuing, scheduling, and dispatch
"""

import asyncio
import heapq
import json
import logging
import sqlite3
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

from cryptography.fernet import Fernet

# Configure secure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("research-queue")


class ResearchPriority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4
    EMERGENCY = 5


class ResearchStatus(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ResearchTask:
    id: str
    topic: str
    description: str
    keywords: List[str]
    priority: ResearchPriority
    status: ResearchStatus
    created: datetime
    started: Optional[datetime] = None
    completed: Optional[datetime] = None
    assigned_agent: Optional[str] = None
    results_path: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __lt__(self, other):
        # Higher priority tasks are "smaller" for heap
        return self.priority.value > other.priority.value


class ResearchQueueManager:
    """
    Critical research queue management system for Artifact Virtual
    Handles autonomous research task scheduling and dispatch
    """

    def __init__(self, queue_dir: Path = None):
        self.queue_dir = queue_dir or Path(__file__).parent
        self.db_path = self.queue_dir / "research_queue.db"
        self.encryption_key_path = self.queue_dir / ".queue_key"

        # Initialize queue structures
        self.priority_queue = []  # Heap queue for priority scheduling
        self.active_tasks = {}  # Currently processing tasks
        self.task_history = {}  # Completed task history

        # Initialize encryption
        self._setup_encryption()

        # Initialize database
        self._setup_database()

        # Load existing tasks
        self._load_existing_tasks()

        logger.info("Research Queue Manager initialized")

    def _setup_encryption(self):
        """Setup encryption for sensitive research data"""
        if not self.encryption_key_path.exists():
            key = Fernet.generate_key()
            with open(self.encryption_key_path, "wb") as f:
                f.write(key)

        with open(self.encryption_key_path, "rb") as f:
            key = f.read()

        self.cipher = Fernet(key)

    def _setup_database(self):
        """Initialize SQLite database for queue persistence"""
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)

        # Create tables
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS research_tasks (
                id TEXT PRIMARY KEY,
                topic TEXT NOT NULL,
                description TEXT,
                keywords TEXT,
                priority INTEGER,
                status TEXT,
                created TIMESTAMP,
                started TIMESTAMP,
                completed TIMESTAMP,
                assigned_agent TEXT,
                results_path TEXT,
                metadata TEXT
            )
        """
        )

        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS queue_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT,
                action TEXT,
                timestamp TIMESTAMP,
                details TEXT
            )
        """
        )

        self.conn.commit()

    def _load_existing_tasks(self):
        """Load existing tasks from database"""
        cursor = self.conn.execute(
            "SELECT * FROM research_tasks WHERE status IN ('pending', 'active')"
        )

        for row in cursor.fetchall():
            task = self._row_to_task(row)

            if task.status == ResearchStatus.PENDING:
                heapq.heappush(self.priority_queue, task)
            elif task.status == ResearchStatus.ACTIVE:
                self.active_tasks[task.id] = task

    def _row_to_task(self, row) -> ResearchTask:
        """Convert database row to ResearchTask object"""
        return ResearchTask(
            id=row[0],
            topic=row[1],
            description=row[2] or "",
            keywords=json.loads(row[3]) if row[3] else [],
            priority=ResearchPriority(row[4]),
            status=ResearchStatus(row[5]),
            created=datetime.fromisoformat(row[6]),
            started=datetime.fromisoformat(row[7]) if row[7] else None,
            completed=datetime.fromisoformat(row[8]) if row[8] else None,
            assigned_agent=row[9],
            results_path=row[10],
            metadata=json.loads(row[11]) if row[11] else {},
        )

    def _task_to_row(self, task: ResearchTask) -> tuple:
        """Convert ResearchTask to database row"""
        return (
            task.id,
            task.topic,
            task.description,
            json.dumps(task.keywords),
            task.priority.value,
            task.status.value,
            task.created.isoformat(),
            task.started.isoformat() if task.started else None,
            task.completed.isoformat() if task.completed else None,
            task.assigned_agent,
            task.results_path,
            json.dumps(task.metadata),
        )

    def add_research_task(
        self,
        topic: str,
        description: str = "",
        keywords: List[str] = None,
        priority: ResearchPriority = ResearchPriority.NORMAL,
        metadata: Dict[str, Any] = None,
    ) -> str:
        """Add new research task to queue"""
        task_id = str(uuid.uuid4())

        task = ResearchTask(
            id=task_id,
            topic=topic,
            description=description,
            keywords=keywords or [],
            priority=priority,
            status=ResearchStatus.PENDING,
            created=datetime.now(),
            metadata=metadata or {},
        )

        # Add to priority queue
        heapq.heappush(self.priority_queue, task)

        # Save to database
        self.conn.execute(
            "INSERT INTO research_tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            self._task_to_row(task),
        )

        # Log audit trail
        self._log_audit(
            task_id, "TASK_ADDED", f"Topic: {topic}, Priority: {priority.name}"
        )

        self.conn.commit()

        logger.info(f"Added research task: {topic} (ID: {task_id})")
        return task_id

    def get_next_task(self, agent_id: str) -> Optional[ResearchTask]:
        """Get next highest priority task from queue"""
        if not self.priority_queue:
            return None

        task = heapq.heappop(self.priority_queue)
        task.status = ResearchStatus.ACTIVE
        task.started = datetime.now()
        task.assigned_agent = agent_id

        # Move to active tasks
        self.active_tasks[task.id] = task

        # Update database
        self.conn.execute(
            "UPDATE research_tasks SET status=?, started=?, assigned_agent=? WHERE id=?",
            (task.status.value, task.started.isoformat(), agent_id, task.id),
        )

        self._log_audit(task.id, "TASK_ASSIGNED", f"Agent: {agent_id}")
        self.conn.commit()

        logger.info(f"Assigned task {task.id} to agent {agent_id}")
        return task

    def complete_task(
        self, task_id: str, results_path: str = None, metadata: Dict[str, Any] = None
    ) -> bool:
        """Mark task as completed"""
        if task_id not in self.active_tasks:
            logger.error(f"Task {task_id} not found in active tasks")
            return False

        task = self.active_tasks[task_id]
        task.status = ResearchStatus.COMPLETED
        task.completed = datetime.now()
        task.results_path = results_path

        if metadata:
            task.metadata.update(metadata)

        # Move to history
        self.task_history[task_id] = task
        del self.active_tasks[task_id]

        # Update database
        self.conn.execute(
            "UPDATE research_tasks SET status=?, completed=?, results_path=?, metadata=? WHERE id=?",
            (
                task.status.value,
                task.completed.isoformat(),
                results_path,
                json.dumps(task.metadata),
                task_id,
            ),
        )

        self._log_audit(task_id, "TASK_COMPLETED", f"Results: {results_path}")
        self.conn.commit()

        logger.info(f"Completed task {task_id}")
        return True

    def fail_task(self, task_id: str, error_message: str) -> bool:
        """Mark task as failed"""
        if task_id not in self.active_tasks:
            return False

        task = self.active_tasks[task_id]
        task.status = ResearchStatus.FAILED
        task.completed = datetime.now()
        task.metadata["error"] = error_message

        # Move to history
        self.task_history[task_id] = task
        del self.active_tasks[task_id]

        # Update database
        self.conn.execute(
            "UPDATE research_tasks SET status=?, completed=?, metadata=? WHERE id=?",
            (
                task.status.value,
                task.completed.isoformat(),
                json.dumps(task.metadata),
                task_id,
            ),
        )

        self._log_audit(task_id, "TASK_FAILED", error_message)
        self.conn.commit()

        logger.error(f"Failed task {task_id}: {error_message}")
        return True

    def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status"""
        return {
            "pending_tasks": len(self.priority_queue),
            "active_tasks": len(self.active_tasks),
            "completed_tasks": len(self.task_history),
            "queue_health": "OPERATIONAL",
        }

    def _log_audit(self, task_id: str, action: str, details: str):
        """Log audit trail for security"""
        self.conn.execute(
            "INSERT INTO queue_audit (task_id, action, timestamp, details) VALUES (?, ?, ?, ?)",
            (task_id, action, datetime.now().isoformat(), details),
        )


# Initialize emergency research tasks
def initialize_emergency_queue():
    """Initialize critical research tasks for system restoration"""
    queue_manager = ResearchQueueManager()

    # Critical research tasks for immediate execution
    emergency_tasks = [
        {
            "topic": "System Infrastructure Restoration",
            "description": "Restore critical research infrastructure components",
            "keywords": ["infrastructure", "restoration", "critical", "system"],
            "priority": ResearchPriority.EMERGENCY,
        },
        {
            "topic": "Research Library Reconstruction",
            "description": "Rebuild research library database and index",
            "keywords": ["library", "database", "index", "reconstruction"],
            "priority": ResearchPriority.CRITICAL,
        },
        {
            "topic": "Autonomous Research Pipeline Status",
            "description": "Assess and restore autonomous research capabilities",
            "keywords": ["autonomous", "pipeline", "assessment", "restoration"],
            "priority": ResearchPriority.HIGH,
        },
    ]

    for task_data in emergency_tasks:
        queue_manager.add_research_task(**task_data)

    logger.info("Emergency research queue initialized")


if __name__ == "__main__":
    initialize_emergency_queue()
