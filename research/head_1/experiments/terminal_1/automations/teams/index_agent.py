import os
import logging
from pathlib import Path
import sys
from importlib import import_module
import threading
import time
from datetime import datetime, timedelta

# Dynamically find the workspace root (where requirements.txt exists)
current = Path(__file__).resolve()
workspace_root = None
for parent in current.parents:
    if (parent / 'requirements.txt').exists():
        workspace_root = parent
        break
if workspace_root is None:
    raise RuntimeError('Could not find workspace root (requirements.txt)')

utils_path = str(workspace_root / 'utils')
if utils_path not in sys.path:
    sys.path.insert(0, utils_path)

create_index = import_module('create_index')
scan_directory = create_index.scan_directory

# Global ignore patterns (like .gitignore)
IGNORE_PATTERNS = [
    'venv', '__pycache__', '.git', '.idea', '.vscode', '.DS_Store',
    '*.pyc', '*.pyo', '*.swp', '*.swo', '*.log', '*.tmp', '*.bak',
    'node_modules', 'dist', 'build', '.mypy_cache', '.pytest_cache',
]

def should_ignore(path):
    # Ignore if any part of the path matches an ignore pattern
    from fnmatch import fnmatch
    parts = Path(path).parts
    for part in parts:
        for pattern in IGNORE_PATTERNS:
            if fnmatch(part, pattern):
                return True
    # Also check full path for file patterns
    for pattern in IGNORE_PATTERNS:
        if fnmatch(str(path), pattern):
            return True
    return False

class IndexAgent:
    def __init__(self, workspace_root, index_interval=300, initial_delay=10):
        """
        Initialize IndexAgent with interval-based indexing.
        
        Args:
            workspace_root: Root directory to index
            index_interval: Time between indexing cycles in seconds (default: 5 minutes)
            initial_delay: Initial delay before first index run in seconds (default: 10 seconds)
        """
        self.workspace_root = Path(workspace_root)
        self.index = {}
        self.logger = logging.getLogger('IndexAgent')
        self.index_interval = index_interval
        self.initial_delay = initial_delay
        self.last_index_time = None
        self._stop_event = threading.Event()
        self._thread = None
        self._next_run_time = None
        
        self.logger.info(f"IndexAgent initialized with {index_interval}s intervals and {initial_delay}s initial delay")

    def update_index(self):
        start_time = datetime.now()
        self.logger.info(f"Starting index update at {start_time.strftime('%H:%M:%S')}")
        self.logger.info(f"Indexing workspace: {self.workspace_root}")
        
        all_files = []
        for root, dirs, files in os.walk(self.workspace_root):
            # Filter out ignored directories in-place
            dirs[:] = [d for d in dirs if not should_ignore(os.path.join(root, d))]
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, self.workspace_root)
                if should_ignore(rel_path):
                    continue
                stat = os.stat(file_path)
                file_info = {
                    'path': rel_path,
                    'size': stat.st_size,
                    'last_modified': stat.st_mtime,
                    'type': self._detect_type(file),
                }
                all_files.append(file_info)
        
        self.index['all_files'] = all_files
        self.last_index_time = datetime.now()
        duration = (self.last_index_time - start_time).total_seconds()
        
        self.logger.info(f"Index update completed in {duration:.2f}s")
        self.logger.info(f"Index keys: {list(self.index.keys())}")
        self.logger.info(f"Indexed {len(all_files)} files.")
        
        # Schedule next run
        self._next_run_time = self.last_index_time + timedelta(seconds=self.index_interval)
        self.logger.info(f"Next index run scheduled for {self._next_run_time.strftime('%H:%M:%S')}")

    def start_scheduled_indexing(self):
        """Start the scheduled indexing with intervals and cooldown periods."""
        if self._thread and self._thread.is_alive():
            self.logger.info("Scheduled indexing already running")
            return
        
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._scheduled_indexing_loop, daemon=True)
        self._thread.start()
        self.logger.info("Started scheduled indexing thread")

    def stop_scheduled_indexing(self):
        """Stop the scheduled indexing."""
        self._stop_event.set()
        if self._thread:
            self._thread.join()
            self.logger.info("Stopped scheduled indexing thread")

    def _scheduled_indexing_loop(self):
        """Main loop for scheduled indexing with cooldown periods."""
        # Initial delay before first run
        if self.initial_delay > 0:
            self.logger.info(f"Waiting {self.initial_delay}s before first index run...")
            if self._stop_event.wait(self.initial_delay):
                return  # Stop event was set during initial delay
        
        # First index run
        try:
            self.update_index()
        except Exception as e:
            self.logger.error(f"Error during initial indexing: {e}")
        
        # Main scheduled loop
        while not self._stop_event.is_set():
            if self._next_run_time is None:
                # Fallback if next_run_time wasn't set
                self._next_run_time = datetime.now() + timedelta(seconds=self.index_interval)
            
            # Calculate time until next run
            now = datetime.now()
            if now >= self._next_run_time:
                # Time to run indexing
                try:
                    self.update_index()
                except Exception as e:
                    self.logger.error(f"Error during scheduled indexing: {e}")
                    # Still schedule next run even if this one failed
                    self._next_run_time = datetime.now() + timedelta(seconds=self.index_interval)
            else:
                # Wait until next scheduled time (with a maximum of 60s to check stop event)
                wait_time = min(60, (self._next_run_time - now).total_seconds())
                if wait_time > 0:
                    if self._stop_event.wait(wait_time):
                        break  # Stop event was set

    def get_status(self):
        """Get current indexing status and schedule information."""
        status = {
            'last_index_time': self.last_index_time.isoformat() if self.last_index_time else None,
            'next_run_time': self._next_run_time.isoformat() if self._next_run_time else None,
            'index_interval': self.index_interval,
            'is_running': self._thread and self._thread.is_alive(),
            'indexed_files_count': len(self.index.get('all_files', []))
        }
        return status

    def force_index_now(self):
        """Force an immediate index update (doesn't affect scheduled timing)."""
        self.logger.info("Forcing immediate index update...")
        try:
            self.update_index()
            return True
        except Exception as e:
            self.logger.error(f"Error during forced indexing: {e}")
            return False

    # Legacy methods for backward compatibility
    def start_continuous_indexing(self, interval=None):
        """Legacy method - redirects to scheduled indexing."""
        if interval and interval != self.index_interval:
            self.logger.warning(f"Ignoring interval parameter {interval}, using configured {self.index_interval}s")
        self.start_scheduled_indexing()

    def stop_continuous_indexing(self):
        """Legacy method - redirects to stop scheduled indexing."""
        self.stop_scheduled_indexing()

    def _detect_type(self, filename):
        ext = os.path.splitext(filename)[1].lower()
        if ext in ['.py', '.sh', '.ps1', '.js', '.ts', '.rb', '.go', '.cpp', '.c', '.java']:
            return 'script'
        if ext in ['.md', '.txt', '.rst']:
            return 'markdown'
        if ext in ['.ipynb']:
            return 'notebook'
        return 'other'
