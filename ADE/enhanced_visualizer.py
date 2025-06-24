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
from rich.table import Table
from rich.box import SIMPLE

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

BAR_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
BAR_LEVELS = len(BAR_CHARS) - 1

COLOR_GRAD = ["#00bfff", "#00ff00", "#ffff00", "#ff8000", "#ff0000"]  # blue, green, yellow, orange, red

def value_to_bar(val):
    idx = int((val / 100) * BAR_LEVELS)
    idx = max(0, min(BAR_LEVELS, idx))
    return BAR_CHARS[idx]

def value_to_color(val):
    if val < 30:
        return COLOR_GRAD[0]
    elif val < 60:
        return COLOR_GRAD[1]
    elif val < 80:
        return COLOR_GRAD[2]
    elif val < 90:
        return COLOR_GRAD[3]
    else:
        return COLOR_GRAD[4]

class AdvancedVisualizer:
    def __init__(self):
        self.console = console
        self.num_cores = psutil.cpu_count(logical=True)
        self.stats = {}
        # Per-core CPU
        for i in range(self.num_cores):
            self.stats[f'CPU{i}'] = collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH)
        # Aggregate CPU, RAM, GPU
        self.stats['CPU'] = collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH)
        self.stats['RAM'] = collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH)
        self.stats['GPU0'] = collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH)
        self.stats['GPU1'] = collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH)
        # Disk I/O (read, write in MB/s)
        self.stats['DISK_READ'] = collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH)
        self.stats['DISK_WRITE'] = collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH)
        # Network (per interface, bytes sent/recv in KB/s)
        self.net_ifaces = list(psutil.net_io_counters(pernic=True).keys())
        for iface in self.net_ifaces:
            self.stats[f'NET_{iface}_SENT'] = collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH)
            self.stats[f'NET_{iface}_RECV'] = collections.deque([0]*PIXEL_WIDTH, maxlen=PIXEL_WIDTH)
        self.gpu_temps = [None, None]
        self.cpu_temp = None
        self.fan_speed = None
        self.c = wmi.WMI(namespace="root\\wmi") if wmi else None
        # For disk/network deltas
        self._last_disk = psutil.disk_io_counters()
        self._last_net = psutil.net_io_counters(pernic=True)
        self._last_time = None  # Fix: start as None

    def update_stats(self):
        now = time.time()
        if self._last_time is None:
            self._last_time = now
            return  # Skip deltas on first run
        dt = now - self._last_time if self._last_time else 1
        self._last_time = now
        # Per-core CPU
        per_core = psutil.cpu_percent(percpu=True)
        for i, val in enumerate(per_core):
            self.stats[f'CPU{i}'].append(val)
        # Aggregate CPU
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
        # Disk I/O (MB/s)
        disk = psutil.disk_io_counters()
        read_mb = (disk.read_bytes - self._last_disk.read_bytes) / (1024*1024) / dt
        write_mb = (disk.write_bytes - self._last_disk.write_bytes) / (1024*1024) / dt
        self.stats['DISK_READ'].append(read_mb*100/10)  # scale to 0-100 for bar, 10MB/s = 100%
        self.stats['DISK_WRITE'].append(write_mb*100/10)
        self._last_disk = disk
        # Network (KB/s)
        net = psutil.net_io_counters(pernic=True)
        for iface in self.net_ifaces:
            sent = (net[iface].bytes_sent - self._last_net[iface].bytes_sent) / 1024 / dt
            recv = (net[iface].bytes_recv - self._last_net[iface].bytes_recv) / 1024 / dt
            self.stats[f'NET_{iface}_SENT'].append(sent*100/1000)  # scale to 0-100 for bar, 1000KB/s = 100%
            self.stats[f'NET_{iface}_RECV'].append(recv*100/1000)
        self._last_net = net

    def render_waveform(self, history):
        # Render a waveform for total CPU usage
        max_height = 8
        bars = []
        for v in history:
            idx = int((v / 100) * max_height)
            idx = max(0, min(max_height, idx))
            bars.append(BAR_CHARS[idx])
        # Stack vertically for waveform
        lines = []
        for h in range(max_height, 0, -1):
            line = ''.join('█' if int((v / 100) * max_height) >= h else ' ' for v in history)
            lines.append(f'[dim]{line}[/]')
        return '\n'.join(lines)

    def render_process_table(self):
        # Top 10 processes by CPU
        procs = [(p.info['cpu_percent'], p.info['name'], p.info['pid'])
                 for p in psutil.process_iter(['cpu_percent', 'name', 'pid'])]
        procs = sorted(procs, reverse=True)[:10]
        table = Table(show_header=True, header_style="bold magenta", box=SIMPLE, expand=True)
        table.add_column("PID", style="dim", width=6)
        table.add_column("Process", min_width=12)
        table.add_column("CPU %", justify="right", width=7)
        for cpu, name, pid in procs:
            table.add_row(str(pid), name, f"{cpu:5.1f}")
        return table

    def render_bars(self):
        lines = []
        # Waveform for total CPU
        lines.append('[bold white]CPU Usage Waveform[/]')
        lines.append(self.render_waveform(self.stats['CPU']))
        # Per-core CPU
        lines.append('[bold white]Per-Core CPU Usage[/]')
        for i in range(self.num_cores):
            label = f'CPU{i}'
            history = self.stats[label]
            bars = []
            for v in history:
                color = value_to_color(v)
                bars.append(f"[bold {color}]{value_to_bar(v)}[/]")
            minv = min(history)
            maxv = max(history)
            avgv = sum(history) / len(history)
            curv = history[-1]
            stat_str = f"[white]{label:<5}[/] [bold]{curv:5.1f}%[/] [dim]min:{minv:4.1f} max:{maxv:4.1f} avg:{avgv:4.1f}[/]"
            lines.append(''.join(bars) + '  ' + stat_str)
        axis = '[dim]' + ''.join(['─' for _ in range(PIXEL_WIDTH)]) + '[/]'
        lines.append(axis)
        # System metrics
        lines.append('[bold white]System Metrics[/]')
        for label in ['CPU', 'RAM', 'GPU0', 'GPU1']:
            history = self.stats[label]
            bars = []
            for v in history:
                color = value_to_color(v)
                bars.append(f"[bold {color}]{value_to_bar(v)}[/]")
            minv = min(history)
            maxv = max(history)
            avgv = sum(history) / len(history)
            curv = history[-1]
            stat_str = f"[white]{label:<8}[/] [bold]{curv:5.1f}%[/] [dim]min:{minv:4.1f} max:{maxv:4.1f} avg:{avgv:4.1f}[/]"
            if label == 'CPU' and self.cpu_temp:
                stat_str += f' [cyan]{self.cpu_temp:.1f}°C[/]'
            if label.startswith('GPU') and self.gpu_temps[int(label[-1])] is not None:
                stat_str += f' [magenta]{self.gpu_temps[int(label[-1])]:.1f}°C[/]'
            lines.append(''.join(bars) + '  ' + stat_str)
        # Disk I/O
        lines.append('[bold white]Disk I/O (MB/s)[/]')
        for label, desc in [('DISK_READ', 'Read'), ('DISK_WRITE', 'Write')]:
            history = self.stats[label]
            bars = []
            for v in history:
                color = value_to_color(v)
                bars.append(f"[bold {color}]{value_to_bar(v)}[/]")
            minv = min(history)
            maxv = max(history)
            avgv = sum(history) / len(history)
            curv = history[-1]
            stat_str = f"[white]{desc:<8}[/] [bold]{curv*10/100:5.2f}[/] [dim]min:{minv*10/100:4.2f} max:{maxv*10/100:4.2f} avg:{avgv*10/100:4.2f}[/]"
            lines.append(''.join(bars) + '  ' + stat_str)
        # Network
        lines.append('[bold white]Network (KB/s)[/]')
        # Filter interfaces: only show if any nonzero traffic or if it's the main (most active) interface
        iface_activity = {}
        for iface in self.net_ifaces:
            total = 0
            for typ in ['SENT', 'RECV']:
                label = f'NET_{iface}_{typ}'
                total += sum(self.stats[label])
            iface_activity[iface] = total
        # Sort interfaces by activity
        sorted_ifaces = sorted(self.net_ifaces, key=lambda i: iface_activity[i], reverse=True)
        shown = 0
        for iface in sorted_ifaces:
            if iface_activity[iface] == 0 and shown > 0:
                continue  # skip zero-traffic unless it's the most active
            for typ, desc in [('SENT', 'Up'), ('RECV', 'Down')]:
                label = f'NET_{iface}_{typ}'
                history = self.stats[label]
                bars = []
                for v in history:
                    color = value_to_color(v)
                    bars.append(f"[bold {color}]{value_to_bar(v)}[/]")
                minv = min(history)
                maxv = max(history)
                avgv = sum(history) / len(history)
                curv = history[-1]
                stat_str = f"[white]{iface[:8]} {desc:<4}[/] [bold]{curv*1000/100:6.1f}[/] [dim]min:{minv*1000/100:5.1f} max:{maxv*1000/100:5.1f} avg:{avgv*1000/100:5.1f}[/]"
                lines.append(''.join(bars) + '  ' + stat_str)
            shown += 1
        return '\n'.join(lines)

    def run(self):
        with Live(refresh_per_second=5, screen=True, transient=False) as live:
            for _ in tqdm(range(999999), desc="[bpytop-style] Monitoring", ncols=80, bar_format="{desc} |{bar}|"):
                self.update_stats()
                bars = self.render_bars()
                proc_table = self.render_process_table()
                # Compose layout: waveform, bars, process table
                panel = Panel(bars, title="[bold cyan]ARTIFACT VIRTUAL - Metrics", box=box.ROUNDED, padding=(1,2))
                live.update(Columns([panel, proc_table], expand=True))
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

if __name__ == "__main__":
    launch_enhanced_visualizer()
