import time
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import os

WATCH_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class WorkspaceChangeHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        logging.info(f"File event: {event.event_type} - {event.src_path}")


def start_watcher():
    logging.basicConfig(level=logging.INFO)
    event_handler = WorkspaceChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_PATH, recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
