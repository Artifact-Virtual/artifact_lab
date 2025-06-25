#!/usr/bin/env python3
"""
Test script for the redesigned IndexAgent with scheduled intervals and cooldown periods.
This demonstrates the new cron-like scheduling approach.
"""

import logging
import time
from pathlib import Path
import sys

# Add the current directory to the path for imports
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from automations.teams.index_agent import IndexAgent

def test_scheduled_indexing():
    """Test the new scheduled indexing functionality."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("=== IndexAgent Scheduled Indexing Test ===")
    
    # Create an IndexAgent with short intervals for testing
    workspace_root = ".."  # Parent directory
    index_agent = IndexAgent(
        workspace_root=workspace_root,
        index_interval=30,  # 30 seconds between runs
        initial_delay=5     # 5 seconds before first run
    )
    
    print(f"Created IndexAgent for workspace: {workspace_root}")
    print(f"Index interval: {index_agent.index_interval}s")
    print(f"Initial delay: {index_agent.initial_delay}s")
    
    # Start scheduled indexing
    print("\nStarting scheduled indexing...")
    index_agent.start_scheduled_indexing()
    
    # Monitor for a few cycles
    print("\nMonitoring indexing cycles for 2 minutes...")
    start_time = time.time()
    last_status_time = 0
    
    try:
        while time.time() - start_time < 120:  # Run for 2 minutes
            current_time = time.time()
            
            # Print status every 15 seconds
            if current_time - last_status_time >= 15:
                status = index_agent.get_status()
                print(f"\n--- Status Update ---")
                print(f"Files indexed: {status['indexed_files_count']}")
                print(f"Last index time: {status['last_index_time']}")
                print(f"Next run time: {status['next_run_time']}")
                print(f"Is running: {status['is_running']}")
                last_status_time = current_time
            
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    
    # Test force index update
    print("\nTesting force index update...")
    success = index_agent.force_index_now()
    print(f"Force update successful: {success}")
    
    # Final status
    final_status = index_agent.get_status()
    print(f"\n--- Final Status ---")
    print(f"Files indexed: {final_status['indexed_files_count']}")
    print(f"Total index runs observed")
    
    # Stop indexing
    print("\nStopping scheduled indexing...")
    index_agent.stop_scheduled_indexing()
    
    print("Test completed!")

if __name__ == "__main__":
    test_scheduled_indexing()
