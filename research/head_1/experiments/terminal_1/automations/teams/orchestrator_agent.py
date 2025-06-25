# To run this orchestrator from workspace root:
# PowerShell:
#   $env:PYTHONPATH="research/head_1/experiments/terminal_1/environment_1"; python -m automations.teams.orchestrator_agent
# CMD:
#   set PYTHONPATH=research/head_1/experiments/terminal_1/environment_1 && python -m automations.teams.orchestrator_agent

import logging
import subprocess
import time
import atexit
import signal
import os
import glob
import shutil
import json
from datetime import datetime
from pathlib import Path

# Handle imports with fallback for direct execution
try:
    from .index_agent import IndexAgent
    from .rag_agent import RAGAgent
    from .reasoning_agent import ReasoningAgent
    from .code_agent import CodeAgent
    from .content_agent import ContentAgent
    from .vision_agent import VisionAgent
except ImportError:
    # Fallback for direct execution
    from index_agent import IndexAgent
    from rag_agent import RAGAgent
    from reasoning_agent import ReasoningAgent
    from code_agent import CodeAgent
    from content_agent import ContentAgent
    from vision_agent import VisionAgent

class OrchestratorAgent:
    def __init__(self, workspace_root, index_interval=60, initial_delay=5):
        """
        Initialize orchestrator with scheduled indexing and cleanup functionality.
        
        Args:
            workspace_root: Root directory of the workspace
            index_interval: Time between index updates in seconds (default: 1 minute)
            initial_delay: Initial delay before first index run (default: 5 seconds)
        """
        self.workspace_root = Path(workspace_root)
        self.index_agent = IndexAgent(self.workspace_root, index_interval=index_interval, initial_delay=initial_delay)
        self.rag_agent = RAGAgent(self.index_agent)
        self.reasoning_agent = ReasoningAgent(model="qwen3")
        self.code_agent = CodeAgent(model="codegeex4")
        self.content_agent = ContentAgent(model="gemma3", workspace_root=str(self.workspace_root))
        self.vision_agent = VisionAgent(model="llava")
        self.log = []
        self.error_log = []
        self.cleanup_registry = []  # Track files and directories for cleanup
        
        # Setup logging
        self.logger = logging.getLogger('OrchestratorAgent')
        self.logger.info(f"Orchestrator initialized with {index_interval}s index intervals")
        
        # Register cleanup functions for graceful exit
        self._register_exit_handlers()

    def _register_exit_handlers(self):
        """Register cleanup handlers for various exit scenarios."""
        atexit.register(self._cleanup_on_exit)
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle system signals for graceful shutdown."""
        self.logger.info(f"Received signal {signum}, initiating cleanup...")
        self._cleanup_on_exit()
        exit(0)

    def _cleanup_on_exit(self):
        """Comprehensive cleanup function called on exit."""
        try:
            self.logger.info("Starting comprehensive cleanup on exit...")
            
            # Generate summary before cleanup
            summary = self.generate_updates_summary()
            
            # Stop background indexing
            self.stop_background_indexing()
            
            # Cleanup temporary files
            self.cleanup_temporary_files()
            
            # Cleanup README_AUTO.md after creating summary
            self.cleanup_readme_auto(summary)
            
            self.logger.info("Cleanup completed successfully")
            
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")

    def generate_updates_summary(self):
        """Generate a comprehensive summary of all updates and activities."""
        try:
            summary = {
                "timestamp": datetime.now().isoformat(),
                "session_duration": self._calculate_session_duration(),
                "activities": {
                    "successful_operations": len(self.log),
                    "errors_encountered": len(self.error_log),
                    "indexing_status": self.get_indexing_status(),
                },
                "operations_log": self.log[-10:],  # Last 10 operations
                "error_summary": self.error_log[-5:] if self.error_log else [],
                "files_processed": self._get_files_processed_count(),
                "cleanup_items": len(self.cleanup_registry)
            }
            
            self.logger.info("Generated comprehensive updates summary")
            return summary
            
        except Exception as e:
            self.logger.error(f"Error generating summary: {e}")
            return {"error": f"Failed to generate summary: {e}"}

    def _calculate_session_duration(self):
        """Calculate the duration of the current session."""
        # This is a simplified calculation - in production, you'd store start time
        return "Session duration calculation not implemented"

    def _get_files_processed_count(self):
        """Get count of files processed during the session."""
        try:
            status = self.get_indexing_status()
            return status.get('indexed_files_count', 0)
        except:
            return 0

    def cleanup_temporary_files(self):
        """Clean up temporary files, cache files, and other temporary data."""
        try:
            temp_patterns = [
                "**/*.tmp",
                "**/*.temp",
                "**/temp_*",
                "**/.cache/*",
                "**/cache/*",
                "**/__pycache__/*",
                "**/*.pyc",
                "**/*.pyo",
                "**/backup_*",
                "**/test_*.bat",
                "**/test_*.py"
            ]
            
            cleanup_count = 0
            for pattern in temp_patterns:
                files = list(self.workspace_root.glob(pattern))
                for file_path in files:
                    try:
                        if file_path.is_file():
                            file_path.unlink()
                            cleanup_count += 1
                            self.logger.debug(f"Removed temporary file: {file_path}")
                        elif file_path.is_dir() and file_path.name in ['__pycache__', '.cache', 'cache']:
                            shutil.rmtree(file_path, ignore_errors=True)
                            cleanup_count += 1
                            self.logger.debug(f"Removed temporary directory: {file_path}")
                    except Exception as e:
                        self.logger.warning(f"Could not remove {file_path}: {e}")
            
            # Clean up registered cleanup items
            for item in self.cleanup_registry:
                try:
                    item_path = Path(item)
                    if item_path.exists():
                        if item_path.is_file():
                            item_path.unlink()
                        elif item_path.is_dir():
                            shutil.rmtree(item_path, ignore_errors=True)
                        cleanup_count += 1
                        self.logger.debug(f"Removed registered cleanup item: {item_path}")
                except Exception as e:
                    self.logger.warning(f"Could not remove registered item {item}: {e}")
            
            self.logger.info(f"Cleanup completed: {cleanup_count} items removed")
            
        except Exception as e:
            self.logger.error(f"Error during temporary file cleanup: {e}")

    def cleanup_readme_auto(self, summary):
        """Clean up README_AUTO.md file after creating a final summary."""
        try:
            readme_auto_path = self.workspace_root / ".." / ".." / "docs" / "README_AUTO.md"
            
            if readme_auto_path.exists():
                # Create a final summary in the README_AUTO.md before cleanup
                final_content = f"""# Orchestrator Session Summary

**Generated on**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Session Overview
{json.dumps(summary, indent=2)}

## Final Notes
This file was automatically generated and cleaned up by the OrchestratorAgent cleanup system.
The orchestrator session has ended and all temporary resources have been cleaned up.

---
*File will be cleaned up after summary creation*
"""
                
                # Write the summary first
                with open(readme_auto_path, 'w', encoding='utf-8') as f:
                    f.write(final_content)
                
                self.logger.info("Created final summary in README_AUTO.md")
                
                # Add a small delay to ensure the file is written
                time.sleep(1)
                
                # Now clean up the file
                readme_auto_path.unlink()
                self.logger.info("README_AUTO.md cleaned up successfully")
                
            else:
                self.logger.info("README_AUTO.md not found, skipping cleanup")
                
        except Exception as e:
            self.logger.error(f"Error during README_AUTO.md cleanup: {e}")

    def register_for_cleanup(self, file_or_dir_path):
        """Register a file or directory for cleanup on exit."""
        self.cleanup_registry.append(str(file_or_dir_path))
        self.logger.debug(f"Registered for cleanup: {file_or_dir_path}")

    def run(self, task):
        try:
            self.index_agent.update_index()
            context = self.rag_agent.retrieve_context(task)
            if task["type"] == "reasoning":
                result = self.reasoning_agent.process(task, context)
            elif task["type"] == "code":
                result = self.code_agent.process(task, context)
            elif task["type"] == "content":
                result = self.content_agent.process(task, context)
            elif task["type"] == "vision":
                result = self.vision_agent.process(task, context)
            else:
                raise ValueError("Unknown task type")
            self.log.append({"task": task, "result": result})
            return result
        except Exception as e:
            logging.error(f"Error in OrchestratorAgent: {e}")
            self.error_log.append({"task": task, "error": str(e)})
            return None

    def enhance_workspace(self):
        improvements = self.reasoning_agent.propose_enhancements(self.index_agent.index)
        for imp in improvements:
            try:
                self.code_agent.implement(imp)
                self.log.append({"enhancement": imp, "status": "success"})
            except Exception as e:
                self.error_log.append({"enhancement": imp, "error": str(e)})

    def document_workspace(self):
        docs = self.content_agent.generate_docs(self.index_agent.index)
        for doc_path, content in docs.items():
            try:
                print(f"[DEBUG] Writing to {doc_path}: {len(content)} chars. Sample: {content[:200]!r}")
                full_path = self.workspace_root / doc_path
                full_path.parent.mkdir(parents=True, exist_ok=True)
                with open(full_path, "a", encoding="utf-8") as f:
                    f.write(content)
                self.log.append({"doc": doc_path, "status": "appended"})
            except Exception as e:
                print(f"[ERROR] Failed to write documentation to {full_path}: {e}")
                self.error_log.append({"doc": doc_path, "error": str(e)})

    def chart_workspace(self):
        charts = self.reasoning_agent.generate_charts(self.index_agent.index)
        for chart_path, chart_data in charts.items():
            try:
                full_path = self.workspace_root / chart_path
                full_path.parent.mkdir(parents=True, exist_ok=True)
                with open(full_path, "wb") as f:
                    f.write(chart_data)
                self.log.append({"chart": chart_path, "status": "created"})
            except Exception as e:
                self.error_log.append({"chart": chart_path, "error": str(e)})

    def start_background_indexing(self):
        """Start scheduled background indexing."""
        self.logger.info("Starting scheduled background indexing...")
        self.index_agent.start_scheduled_indexing()

    def stop_background_indexing(self):
        """Stop scheduled background indexing."""
        self.logger.info("Stopping scheduled background indexing...")
        self.index_agent.stop_scheduled_indexing()
    
    def get_indexing_status(self):
        """Get current indexing status."""
        return self.index_agent.get_status()
    
    def force_index_update(self):
        """Force an immediate index update."""
        return self.index_agent.force_index_now()

def start_ollama():
    """Start the Ollama service if not already running."""
    try:
        # Try to check if Ollama is running
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True)
        if result.returncode == 0:
            print("[Startup] Ollama service is already running.")
            return
    except Exception:
        pass
    print("[Startup] Starting Ollama service...")
    # Start Ollama in the background
    subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # Wait a few seconds for the service to start
    time.sleep(3)

if __name__ == "__main__":
    start_ollama()
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Create orchestrator with 60-second intervals and 5-second initial delay
    orchestrator = OrchestratorAgent(workspace_root="..", index_interval=60, initial_delay=5)
    
    print("[Orchestrator] Starting background indexing...")
    orchestrator.start_background_indexing()
    
    # Wait for initial index to complete
    print("[Orchestrator] Waiting for initial indexing to complete...")
    time.sleep(10)
    
    # Check indexing status
    status = orchestrator.get_indexing_status()
    print(f"[Orchestrator] Index status: {status['indexed_files_count']} files indexed")
    if status['next_run_time']:
        print(f"[Orchestrator] Next index run: {status['next_run_time']}")
    
    # Run agent tasks
    print("[Orchestrator] Running agent tasks...")
    orchestrator.run({"type": "reasoning", "query": "What are the most outdated scripts in this workspace?"})
    orchestrator.enhance_workspace() 
    orchestrator.document_workspace()
    orchestrator.chart_workspace()
      # Keep orchestrator alive with periodic status updates
    print("[Orchestrator] Entering maintenance mode...")
    try:
        cycle_count = 0
        while True:
            time.sleep(30)  # Check every 30 seconds
            cycle_count += 1
            
            if cycle_count % 4 == 0:  # Every 2 minutes, show status
                status = orchestrator.get_indexing_status()
                print(f"[Orchestrator] Status: {status['indexed_files_count']} files, "
                      f"next run: {status['next_run_time']}")
            
            if cycle_count % 20 == 0:  # Every 10 minutes, regenerate docs
                print("[Orchestrator] Periodic documentation update...")
                orchestrator.document_workspace()
                
            # Periodic cleanup of temporary files (every hour)
            if cycle_count % 120 == 0:  # Every 60 minutes (120 * 30 seconds)
                print("[Orchestrator] Performing periodic cleanup...")
                orchestrator.cleanup_temporary_files()
                
    except KeyboardInterrupt:
        print("[Orchestrator] Shutting down gracefully...")
        print("[Orchestrator] Cleanup will be handled automatically...")
        # Cleanup is now handled by exit handlers
        exit(0)
