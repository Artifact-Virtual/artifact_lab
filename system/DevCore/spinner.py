import threading
import time

class Spinner:
    def __init__(self, message="Processing..."):
        self.message = message
        self._running = False
        self._thread = None
        self.chars = ['|', '/', '-', '\\']

    def start(self):
        self._running = True
        self._thread = threading.Thread(target=self._spin)
        self._thread.start()

    def _spin(self):
        idx = 0
        while self._running:
            print(f"\r{self.message} {self.chars[idx % len(self.chars)]}", end='', flush=True)
            idx += 1
            time.sleep(0.1)
        print("\r" + " " * (len(self.message) + 4) + "\r", end='', flush=True)

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join()
