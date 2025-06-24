import sys
import os
sys.path.append(os.path.dirname(__file__))

import threading
from watcher import start_watcher
from dependency_indexer import build_dependency_index
from summarizer import summarize_codebase
from enhanced_visualizer import launch_enhanced_visualizer


def run_summarizer():
    try:
        summarize_codebase()
    except Exception as e:
        print(f"[Summarizer error] {e}")


if __name__ == "__main__":
    print("Starting ARTIFACT VIRTUAL Workspace Manager...")
    
    # Start background services
    watcher_thread = threading.Thread(target=start_watcher, daemon=True)
    watcher_thread.start()
    
    build_dependency_index()
    
    summarizer_thread = threading.Thread(target=run_summarizer, daemon=True)
    summarizer_thread.start()
    
    # Launch Enhanced Metrics Visualizer directly (default)
    print("Launching Enhanced Metrics Visualizer...")
    launch_enhanced_visualizer()
