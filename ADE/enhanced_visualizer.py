import os
import time
import psutil
import collections
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.text import Text
from rich.style import Style
from rich.align import Align
from rich import box
from rich.columns import Columns
from rich import print as rprint
from tqdm import tqdm

try:
    import GPUtil
except ImportError:
    GPUtil = None

try:
    import wmi
except ImportError:
    wmi = None

# NOTE: This script is intended to be run via L:/devops/artifact_lab/run.sh in a detached bash terminal.
# Direct execution is not supported.

PIXEL_HEIGHT = 16  # Number of rows for spectrogram
PIXEL_WIDTH = 60   # Number of columns (history length)

console = Console()

class AdvancedVisualizer:
    def __init__(self):
        self.console = console
        self.stats = {
            'CPU': collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH),
            'RAM': collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH),
            'GPU0': collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH),
            'GPU1': collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH),
        }
        self.gpu_temps = [None, None]
        self.cpu_temp = None
        self.fan_speed = None
        self.c = wmi.WMI(namespace="root\\wmi") if wmi else None

    def update_stats(self):
        self.stats['CPU'].append(psutil.cpu_percent())
        self.stats['RAM'].append(psutil.virtual_memory().percent)
        # GPU
        if GPUtil:
            gpus = GPUtil.getGPUs()
            for i in range(2):
                if i < len(gpus):
                    self.stats[f'GPU{i}'].append(gpus[i].load * 100)
                    self.gpu_temps[i] = gpus[i].temperature
                else:
                    self.stats[f'GPU{i}'].append(0)
                    self.gpu_temps[i] = None
        else:
            self.stats['GPU0'].append(0)
            self.stats['GPU1'].append(0)
            self.gpu_temps = [None, None]
        # CPU temp/fan
        if self.c:
            try:
                temps = self.c.MSAcpi_ThermalZoneTemperature()
                if temps:
                    self.cpu_temp = (temps[0].CurrentTemperature / 10.0) - 273.15
            except Exception:
                self.cpu_temp = None
            try:
                fans = self.c.Win32_Fan()
                if fans:
                    self.fan_speed = fans[0].DesiredSpeed
            except Exception:
                self.fan_speed = None

    def pixel_color(self, value):
        # Map value (0-100) to a color gradient (blue-green-yellow-red)
        if value < 30:
            return 'blue'
        elif value < 60:
            return 'green'
        elif value < 85:
            return 'yellow'
        else:
            return 'red'

    def render_spectrogram(self):
        # Each stat gets a row of colored blocks, history scrolls left to right
        rows = []
        for label, history in self.stats.items():
            blocks = []
            for v in history:
                color = self.pixel_color(v)
                blocks.append(f'[bold {color}]█[/]')
            # Add stat label and current value
            blocks.append(f' [white]{label}[/] [bold]{history[-1]:5.1f}%[/]')
            if label == 'CPU' and self.cpu_temp:
                blocks.append(f' [cyan]{self.cpu_temp:.1f}°C[/]')
            if label.startswith('GPU') and self.gpu_temps[int(label[-1])] is not None:
                blocks.append(f' [magenta]{self.gpu_temps[int(label[-1])]:.1f}°C[/]')
            rows.append(''.join(blocks))
        return '\n'.join(rows)

    def run(self):
        with Live(refresh_per_second=5, screen=True) as live:
            for _ in tqdm(range(999999), desc="[bpytop-style] Monitoring", ncols=80, bar_format="{desc} |{bar}|"):
                self.update_stats()
                spectro = self.render_spectrogram()
                panel = Panel(spectro, title="[bold cyan]ARTIFACT VIRTUAL - Spectrogram", box=box.ROUNDED, padding=(1,2))
                live.update(panel)
                time.sleep(0.2)

# No direct execution: always run via run.sh
# if __name__ == "__main__":
#     launch_enhanced_visualizer()

def launch_enhanced_visualizer():
    try:
        visualizer = AdvancedVisualizer()
        visualizer.run()
    except Exception as e:
        rprint(f"[bold red]Error launching enhanced visualizer: {e}")
        import traceback
        traceback.print_exc()
