"""
Langton's Ant Live Server (Extreme Speed, Memory, and Advanced Features)

- Serves a live HTML/JS simulation to localhost
- Ant logic is in Python (no random jumps unless specified)
- Logs memory and allows download
- Reacts to previously changed blocks as per memory
- Extreme speed: supports fast step rates and time management

Run: python langtons_ant_server.py
Then open http://localhost:8000 in your browser.
"""

import uvicorn
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import json
from pathlib import Path

app = FastAPI()

# --- Ant Logic ---
class LangtonsAnt:
    def __init__(self, grid_size=51):
        self.grid_size = grid_size
        self.grid = [[0 for _ in range(grid_size)] for _ in range(grid_size)]
        self.x = grid_size // 2
        self.y = grid_size // 2
        self.direction = 0  # 0: up, 1: right, 2: down, 3: left
        self.memory = []
        self.step = 0
        self.special_cells = set()
        self.visited = set()

    def turn_right(self):
        self.direction = (self.direction + 1) % 4

    def turn_left(self):
        self.direction = (self.direction - 1) % 4

    def move_forward(self):
        if self.direction == 0:
            self.y -= 1
        elif self.direction == 1:
            self.x += 1
        elif self.direction == 2:
            self.y += 1
        elif self.direction == 3:
            self.x -= 1
        self.x = max(0, min(self.grid_size - 1, self.x))
        self.y = max(0, min(self.grid_size - 1, self.y))

    def react(self, cell_color):
        # If the ant steps on a special cell, it reverses direction
        if (self.x, self.y) in self.special_cells:
            self.direction = (self.direction + 2) % 4
            return "reverse"
        # If the ant steps on a previously visited block, pause for a moment
        if (self.x, self.y) in self.visited:
            return "visited"
        return None

    def step_ant(self):
        cell_color = self.grid[self.y][self.x]
        action = None
        # Decision: turn based on cell color
        if cell_color == 0:
            self.turn_right()
            self.grid[self.y][self.x] = 1
            action = "turn_right, flip to black"
        else:
            self.turn_left()
            self.grid[self.y][self.x] = 0
            action = "turn_left, flip to white"
        # React to special conditions
        reaction = self.react(cell_color)
        if reaction == "reverse":
            action += ", react: reverse"
        elif reaction == "visited":
            action += ", react: visited"
        else:
            self.move_forward()
        # Log memory
        self.memory.append({
            "step": self.step,
            "x": self.x,
            "y": self.y,
            "direction": self.direction,
            "action": action,
            "cell_color": cell_color
        })
        self.visited.add((self.x, self.y))
        self.step += 1

    def get_state(self):
        return {
            "grid": self.grid,
            "x": self.x,
            "y": self.y,
            "direction": self.direction,
            "step": self.step,
            "memory": self.memory[-100:],  # last 100 steps
            "special_cells": list(self.special_cells),
            "visited": list(self.visited)
        }

    def add_special_cell(self, x, y):
        self.special_cells.add((x, y))

    def reset(self):
        self.__init__(self.grid_size)

ant = LangtonsAnt(grid_size=51)
ant.add_special_cell(10, 10)
ant.add_special_cell(40, 40)

# --- Static HTML/JS ---
@app.get("/", response_class=HTMLResponse)
def index():
    html_path = Path(__file__).parent / "langtons_ant_live.html"
    if html_path.exists():
        return FileResponse(str(html_path))
    return HTMLResponse("<h1>Langton's Ant Live Server</h1><p>HTML file missing.</p>")

# --- WebSocket for Live Updates ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    speed = 0.005  # seconds per step (extreme speed)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("cmd") == "step":
                ant.step_ant()
                await websocket.send_json(ant.get_state())
            elif msg.get("cmd") == "run":
                for _ in range(msg.get("steps", 100)):
                    ant.step_ant()
                    await websocket.send_json(ant.get_state())
                    await asyncio.sleep(speed)
            elif msg.get("cmd") == "reset":
                ant.reset()
                await websocket.send_json(ant.get_state())
            elif msg.get("cmd") == "get_state":
                await websocket.send_json(ant.get_state())
            elif msg.get("cmd") == "download_memory":
                await websocket.send_json({"memory": ant.memory})
    except Exception:
        pass

# --- API for Memory Download ---
@app.get("/memory.json")
def download_memory():
    return JSONResponse(ant.memory)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
