"""
Langton's Ant Simulation (with Memory and Simple Decision-Making)

This simulation models a variant of Langton's Ant that:
- Takes inputs (current cell color, optional user input)
- Makes rudimentary decisions (turns, moves, and can react to special cells)
- Logs a memory of its path and actions
- Reacts to special conditions (e.g., colored cells, boundaries)

Usage: Run this script to see the ant's behavior in the console.
"""

import random
import sys

class LangtonsAnt:
    def __init__(self, grid_size=21):
        self.grid_size = grid_size
        self.grid = [[0 for _ in range(grid_size)] for _ in range(grid_size)]  # 0: white, 1: black
        self.x = grid_size // 2
        self.y = grid_size // 2
        self.direction = 0  # 0: up, 1: right, 2: down, 3: left
        self.memory = []  # Log of (step, x, y, direction, action, cell_color)
        self.step = 0
        self.special_cells = set()  # Cells that trigger a reaction

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
        # Clamp to grid
        self.x = max(0, min(self.grid_size - 1, self.x))
        self.y = max(0, min(self.grid_size - 1, self.y))

    def react(self, cell_color):
        # Twist: If the ant steps on a special cell, it reverses direction
        if (self.x, self.y) in self.special_cells:
            self.direction = (self.direction + 2) % 4
            return "reverse"
        # Twist: If the cell is black, 10% chance to jump to a random cell
        if cell_color == 1 and random.random() < 0.1:
            self.x = random.randint(0, self.grid_size - 1)
            self.y = random.randint(0, self.grid_size - 1)
            return "jump"
        return None

    def step_ant(self, user_input=None):
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
        if reaction:
            action += f", react: {reaction}"
        else:
            self.move_forward()
        # Log memory
        self.memory.append({
            "step": self.step,
            "x": self.x,
            "y": self.y,
            "direction": self.direction,
            "action": action,
            "cell_color": cell_color,
            "user_input": user_input
        })
        self.step += 1

    def add_special_cell(self, x, y):
        self.special_cells.add((x, y))

    def print_grid(self):
        for y in range(self.grid_size):
            row = ""
            for x in range(self.grid_size):
                if self.x == x and self.y == y:
                    row += "A"
                elif (x, y) in self.special_cells:
                    row += "*"
                elif self.grid[y][x] == 0:
                    row += "."
                else:
                    row += "#"
            print(row)
        print()

    def run(self, steps=100, user_inputs=None):
        if user_inputs is None:
            user_inputs = [None] * steps
        for i in range(steps):
            self.step_ant(user_inputs[i] if i < len(user_inputs) else None)
            self.print_grid()
            print(f"Step {i+1}: {self.memory[-1]}")
            # Optionally, pause for user input or slow down
            # input("Press Enter for next step...")

if __name__ == "__main__":
    ant = LangtonsAnt(grid_size=11)
    # Add a few special cells for demonstration
    ant.add_special_cell(2, 2)
    ant.add_special_cell(8, 8)
    ant.run(steps=20)
    print("Memory log:")
    for entry in ant.memory:
        print(entry)
