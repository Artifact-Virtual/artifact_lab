import os
import subprocess
import sys
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

def start_ollama():
    """Start the Ollama service if not already running."""
    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True)
        if result.returncode == 0:
            print("[Watcher] Ollama service is already running.")
            return
    except Exception:
        pass
    print("[Watcher] Starting Ollama service...")
    subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(3)

# Directory to watch (absolute path, always points to terminal_1 root)
WATCH_DIR = os.path.abspath(os.path.dirname(__file__))
AUTOMATIONS_PARENT = WATCH_DIR

# Command to run orchestrator
ORCH_COMMAND = [
    sys.executable, '-m', 'automations.teams.orchestrator_agent'
]

class OrchestratorTriggerHandler(FileSystemEventHandler):
    def __init__(self):
        self.process = None
        self.last_event_time = 0
        self.cooldown = 2  # seconds to avoid rapid retriggers

    def on_any_event(self, event):
        now = time.time()
        if now - self.last_event_time < self.cooldown:
            return
        self.last_event_time = now
        print(f"[Watcher] Change detected: {event.src_path}. Triggering orchestrator...")
        self.run_orchestrator()

    def run_orchestrator(self):
        # Kill previous process if running
        if self.process and self.process.poll() is None:
            print("[Watcher] Terminating previous orchestrator run...")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
        # Set up environment
        env = os.environ.copy()
        env['PYTHONPATH'] = AUTOMATIONS_PARENT
        # Start orchestrator
        self.process = subprocess.Popen(
            ORCH_COMMAND,
            cwd=AUTOMATIONS_PARENT,
            env=env,
            stdout=sys.stdout,
            stderr=sys.stderr,
        )

if __name__ == "__main__":
    start_ollama()
    event_handler = OrchestratorTriggerHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=True)
    print(f"[Watcher] Monitoring {WATCH_DIR} for changes...")
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
    # Clean up orchestrator process
    if event_handler.process and event_handler.process.poll() is None:
        event_handler.process.terminate()
