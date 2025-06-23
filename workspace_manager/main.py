import threading
import sys
from watcher import start_watcher
from dependency_indexer import build_dependency_index
from summarizer import summarize_codebase
from visualizer import launch_visualizer

def run_summarizer():
    try:
        summarize_codebase()
    except Exception as e:
        print(f"[Summarizer error] {e}")

def choose_visualizer():
    """Let user choose between visualizers"""
    print("\n" + "="*70)
    print("ARTIFACT VIRTUAL - Choose Your Visualizer")
    print("="*70)
    print("1. Enhanced Metrics Visualizer (Recommended)")
    print("   - Advanced tree view with file analysis")
    print("   - Interactive heatmaps and charts")
    print("   - Real-time system metrics dashboard")
    print("   - File dependency mapping")
    print("   - Includes hidden files (dotfiles)")
    print()
    print("2. 3D Node Visualizer")
    print("   - 3D circular node display")
    print("   - System performance graphs")
    print("   - Classic visualization")
    print()
    
    while True:
        try:
            choice = input("Enter choice (1, 2, or 'q' to quit): ").strip()
            if choice.lower() == 'q':
                print("Exiting...")
                sys.exit(0)
            elif choice == '1':
                print("Launching Enhanced Metrics Visualizer...")
                from enhanced_visualizer import launch_enhanced_visualizer
                return launch_enhanced_visualizer
            elif choice == '2':
                print("Launching 3D Node Visualizer...")
                return launch_visualizer
            else:
                print("Please enter 1, 2, or 'q'")
        except KeyboardInterrupt:
            print("\nExiting...")
            sys.exit(0)

if __name__ == "__main__":
    print("Starting ARTIFACT VIRTUAL Workspace Manager...")
    
    # Start background services
    watcher_thread = threading.Thread(target=start_watcher, daemon=True)
    watcher_thread.start()
    
    build_dependency_index()
    
    summarizer_thread = threading.Thread(target=run_summarizer, daemon=True)
    summarizer_thread.start()
    
    # Launch 3D Node Visualizer directly (default)
    print("Launching 3D Node Visualizer...")
    launch_visualizer()
