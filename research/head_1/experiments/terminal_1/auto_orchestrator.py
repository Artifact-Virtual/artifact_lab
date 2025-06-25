import os
import subprocess
import sys
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Use absolute path for the directory to watch (terminal_1 and below)
WATCH_DIR = os.path.abspath(os.path.dirname(__file__))
print(f"[Watcher] Absolute path being monitored: {WATCH_DIR}")
print(f"[Watcher] Current working directory: {os.getcwd()}")

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
        # Ignore changes to the documentation output file and docs directory
        if (
            event.src_path.endswith('docs/README_AUTO.md') or
            event.src_path.endswith('docs\\README_AUTO.md') or
            os.path.basename(event.src_path).lower() == 'readme_auto.md' or
            os.path.normpath('docs') in os.path.normpath(event.src_path)
        ):
            return
        # Ignore changes in the venv directory
        if os.path.normpath('venv') in os.path.normpath(event.src_path):
            return
        # Ignore changes to the watcher and runtime script itself
        if os.path.basename(event.src_path) in [
            'auto_orchestrator.py',
            'runtime_optimization.sh'
        ]:
            return
        print(f"[Watcher] EVENT: {event.event_type} on {event.src_path}")
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
        env['PYTHONPATH'] = f".;{os.path.abspath(os.path.join('.', ''))}"
        # Start orchestrator
        self.process = subprocess.Popen(
            ORCH_COMMAND,
            cwd=WATCH_DIR,
            env=env,
            stdout=sys.stdout,
            stderr=sys.stderr,
        )

def start_watcher():
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

if __name__ == "__main__":
    start_watcher()

# Add module entry point

def main():
    start_watcher()
