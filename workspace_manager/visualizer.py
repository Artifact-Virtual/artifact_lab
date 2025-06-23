import os
import json
import pygame
import math
import random
import psutil
import time
import collections

INDEX_PATH = os.path.join(os.path.dirname(__file__), 'dependency_index.json')

WIDTH, HEIGHT = 1400, 900
BG_COLOR = (12, 14, 24)
NODE_COLOR = (80, 180, 255)
EDGE_COLOR = (90, 160, 255)
FONT_COLOR = (240, 240, 255)
SELECTED_COLOR = (255, 180, 80)
DIR_COLOR = (120, 255, 180)
FILE_COLOR = (80, 180, 255)
GLOW_COLOR = (255, 255, 120)

NODE_RADIUS = 26
CAMERA_DIST = 900
ROTATE_SPEED = 0.008
ZOOM_STEP = 40

CPU_HISTORY = collections.deque(maxlen=200)
RAM_HISTORY = collections.deque(maxlen=200)

# --- Add panning state ---
pan_offset = [0, 0]
panning = False

# --- Add base node rotation state ---
base_angle_offset = 0.0

# --- Add force-directed layout and interactivity ---
class Node:
    def __init__(self, name, pos3d, is_dir=False):
        self.name = name
        self.pos3d = list(pos3d)
        self.screen_pos = (0, 0)
        self.selected = False
        self.is_dir = is_dir
        self.neighbors = set()
        self.fixed = False  # For pinning base nodes
        self.file_size = 1
        self.info = {}

class Edge:
    def __init__(self, src, dst):
        self.src = src
        self.dst = dst


def project_3d(pos, camera_z):
    x, y, z = pos
    factor = CAMERA_DIST / (camera_z - z + 1e-5)
    return int(WIDTH // 2 + x * factor + pan_offset[0]), int(HEIGHT // 2 + y * factor + pan_offset[1])


def build_graph(index, view_mode=1):
    global base_angle_offset
    nodes = {}
    edges = []
    # Exclude unwanted directories (segment match, robust for Windows/Unix paths)
    exclude_names = {'.core', '.data', '.ollama_models'}
    def is_excluded(key):
        parts = key.replace('\\', '/').split('/')
        return any(part in exclude_names for part in parts)
    dirs = {k: v for k, v in index.items() if k != '_metadata' and not is_excluded(k)}
    if view_mode == 6:
        n_dirs = len(dirs)
        for i, (dir_name, data) in enumerate(dirs.items()):
            # Pin base nodes in a 3D circle, allow rotation
            angle = base_angle_offset + i * 2 * math.pi / max(1, n_dirs)
            x = math.cos(angle) * 400
            y = math.sin(angle) * 300
            z = random.uniform(-120, 120)  # Add z-depth for 3D
            node = Node(dir_name, (x, y, z), is_dir=True)
            node.fixed = True
            node.info = {'type': 'directory', 'name': dir_name}
            nodes[dir_name] = node
        # Place files with random z, let physics spread them
        for dir_name, data in dirs.items():
            dir_node = nodes[dir_name]
            files_dict = data.get('files', {}) or {}
            file_names = sorted(files_dict.keys())
            n_files = len(file_names)
            if n_files == 0:
                continue
            for fname in file_names:
                fx = dir_node.pos3d[0] + random.uniform(-40, 40)
                fy = dir_node.pos3d[1] + random.uniform(-40, 40)
                fz = dir_node.pos3d[2] + random.uniform(-40, 40)
                file_node = Node(f"{dir_name}/{fname}", (fx, fy, fz), is_dir=False)
                try:
                    file_node.file_size = int(files_dict[fname].get('size', 1))
                except Exception:
                    file_node.file_size = 1
                file_node.info = {'type': 'file', 'name': fname, 'path': f"{dir_name}/{fname}", 'size': file_node.file_size}
                nodes[file_node.name] = file_node
                edges.append(Edge(dir_node, file_node))
                dir_node.neighbors.add(file_node)
                file_node.neighbors.add(dir_node)
    # For heatmap, calculate dependency counts
    dep_counts = {name: 0 for name in nodes}
    for edge in edges:
        dep_counts[edge.dst.name] += 1
    for node in nodes.values():
        node.dep_count = dep_counts.get(node.name, 0)
    return nodes, edges

# --- Physics simulation ---
def apply_forces(nodes, edges, steps=1):
    k_rep = 12000  # repulsion constant
    k_spring = 0.08  # spring constant
    damping = 0.85
    for _ in range(steps):
        forces = {n: [0.0, 0.0, 0.0] for n in nodes}
        # Repulsion
        node_list = list(nodes.values())
        for i, n1 in enumerate(node_list):
            for n2 in node_list[i+1:]:
                dx = n1.pos3d[0] - n2.pos3d[0]
                dy = n1.pos3d[1] - n2.pos3d[1]
                dz = n1.pos3d[2] - n2.pos3d[2]
                dist2 = dx*dx + dy*dy + dz*dz + 1e-2
                force = k_rep / dist2
                fx = force * dx
                fy = force * dy
                fz = force * dz
                forces[n1.name][0] += fx
                forces[n1.name][1] += fy
                forces[n1.name][2] += fz
                forces[n2.name][0] -= fx
                forces[n2.name][1] -= fy
                forces[n2.name][2] -= fz
        # Attraction (edges)
        for edge in edges:
            src, dst = edge.src, edge.dst
            dx = dst.pos3d[0] - src.pos3d[0]
            dy = dst.pos3d[1] - src.pos3d[1]
            dz = dst.pos3d[2] - src.pos3d[2]
            dist = math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-2
            force = k_spring * (dist - 120)
            fx = force * dx / dist
            fy = force * dy / dist
            fz = force * dz / dist
            forces[src.name][0] += fx
            forces[src.name][1] += fy
            forces[src.name][2] += fz
            forces[dst.name][0] -= fx
            forces[dst.name][1] -= fy
            forces[dst.name][2] -= fz
        # Update positions
        for node in nodes.values():
            if node.fixed:
                continue
            node.pos3d[0] += forces[node.name][0] * damping
            node.pos3d[1] += forces[node.name][1] * damping
            node.pos3d[2] += forces[node.name][2] * damping


def draw_glow_circle(surface, color, pos, radius):
    for i in range(8, 0, -1):
        alpha = max(10, 32 - i * 3)
        glow = pygame.Surface((radius*4, radius*4), pygame.SRCALPHA)
        pygame.draw.circle(glow, (*color, alpha), (radius*2, radius*2), radius+i*4)
        surface.blit(glow, (pos[0]-radius*2, pos[1]-radius*2), special_flags=pygame.BLEND_RGBA_ADD)


def draw_waveform(surface, data, color, rect, label, font):
    if len(data) < 2:
        return
    pygame.draw.rect(surface, (30, 30, 50), rect, border_radius=8)
    points = []
    for i, v in enumerate(data):
        x = rect[0] + int(i * rect[2] / len(data))
        y = rect[1] + rect[3] - int(v * rect[3])
        points.append((x, y))
    if len(points) > 1:
        pygame.draw.aalines(surface, color, False, points)
    label_surf = font.render(label, True, (200, 200, 255))
    surface.blit(label_surf, (rect[0]+8, rect[1]+4))


def launch_visualizer():
    global pan_offset, panning, base_angle_offset
    try:
        pygame.init()
        screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.DOUBLEBUF)
        pygame.display.set_caption('Artifact Lab 3D Codebase Visualizer')
        font = pygame.font.SysFont('consolas', 18)
        button_font = pygame.font.SysFont('consolas', 16, bold=True)
        
        # Enhanced Visualizer Button
        button_rect = pygame.Rect(WIDTH - 250, 20, 220, 40)
        
        with open(INDEX_PATH, 'r', encoding='utf-8') as f:
            index = json.load(f)
        view_mode = 6
        nodes, edges = build_graph(index, view_mode)
        camera_z = CAMERA_DIST
        angle_x, angle_y = 0, 0
        running = True
        selected = None
        hovered = None
        dragging = False
        last_mouse = (0, 0)
        clock = pygame.time.Clock()
        # System stats
        for _ in range(200):
            CPU_HISTORY.append(psutil.cpu_percent() / 100)
            RAM_HISTORY.append(psutil.virtual_memory().percent / 100)
        last_stats = time.time()
        
        while running:
            mx, my = pygame.mouse.get_pos()
            button_hovered = button_rect.collidepoint(mx, my)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1:
                        if button_rect.collidepoint(mx, my):
                            print("Launching Enhanced Metrics Visualizer...")
                            pygame.quit()
                            try:
                                from enhanced_visualizer import launch_enhanced_visualizer
                                launch_enhanced_visualizer()
                                return
                            except ImportError:
                                print("Enhanced visualizer not available")
                                return
                        else:
                            dragging = True
                            last_mouse = pygame.mouse.get_pos()
                            # --- Start panning if right mouse button ---
                    elif event.button == 3:
                        panning = True
                        last_mouse = pygame.mouse.get_pos()
                    elif event.button == 4:
                        camera_z -= ZOOM_STEP
                    elif event.button == 5:
                        camera_z += ZOOM_STEP
                elif event.type == pygame.MOUSEBUTTONUP:
                    if event.button == 1:
                        dragging = False
                    elif event.button == 3:
                        panning = False
                elif event.type == pygame.MOUSEMOTION:
                    if panning:
                        mx, my = pygame.mouse.get_pos()
                        dx, dy = mx - last_mouse[0], my - last_mouse[1]
                        pan_offset[0] += dx
                        pan_offset[1] += dy
                        last_mouse = (mx, my)
            if dragging:
                mx, my = pygame.mouse.get_pos()
                dx, dy = mx - last_mouse[0], my - last_mouse[1]
                angle_x += dx * ROTATE_SPEED
                angle_y += dy * ROTATE_SPEED
                last_mouse = (mx, my)
            # 3D transform
            for node in nodes.values():
                x, y, z = node.pos3d
                # Rotate around Y and X
                rx = x * math.cos(angle_x) - z * math.sin(angle_x)
                rz = x * math.sin(angle_x) + z * math.cos(angle_x)
                ry = y * math.cos(angle_y) - rz * math.sin(angle_y)
                rz2 = y * math.sin(angle_y) + rz * math.cos(angle_y)
                node.screen_pos = project_3d((rx, ry, rz2), camera_z)
            # Hover detection
            mx, my = pygame.mouse.get_pos()
            hovered = None
            for node in nodes.values():
                if (node.screen_pos[0] - mx) ** 2 + (node.screen_pos[1] - my) ** 2 < NODE_RADIUS ** 2:
                    hovered = node
                    break
            screen.fill(BG_COLOR)
            # Draw edges
            for edge in edges:
                color = GLOW_COLOR if hovered and (edge.src == hovered or edge.dst == hovered) else EDGE_COLOR
                pygame.draw.aaline(screen, color, edge.src.screen_pos, edge.dst.screen_pos)
            # Draw nodes (dependency heatmap: size/color by file size/complexity)
            min_size, max_size = 8, 48
            min_file_size, max_file_size = 1, 1
            for node in nodes.values():
                if not node.is_dir and hasattr(node, 'file_size'):
                    try:
                        max_file_size = max(max_file_size, int(node.file_size))
                    except Exception:
                        pass
            for node in nodes.values():
                if node.is_dir:
                    color = (180, 255, 180)
                    radius = NODE_RADIUS
                else:
                    # Node size and color by file size
                    try:
                        size_norm = (math.log(int(node.file_size)+1) - math.log(min_file_size+1)) / (math.log(max_file_size+1) - math.log(min_file_size+1) + 1e-5)
                    except Exception:
                        size_norm = 0
                    radius = int(min_size + (max_size - min_size) * size_norm)
                    # Color: blue (small) to red (large)
                    c = int(255 * size_norm)
                    r = max(0, min(255, 255))
                    g = max(0, min(255, 180-c))
                    b = max(0, min(255, 180-c))
                    color = (r, g, b)
                if node == hovered:
                    draw_glow_circle(screen, GLOW_COLOR, node.screen_pos, radius)
                pygame.draw.circle(screen, color, node.screen_pos, radius)
                pygame.draw.circle(screen, (40, 40, 60), node.screen_pos, radius, 2)
            # Draw edges (directional: upward for dependencies)
            for edge in edges:
                src, dst = edge.src, edge.dst
                # Draw upward if file depends on dir (file above dir), else downward
                if src.is_dir and not dst.is_dir:
                    # File node to dir: draw upward
                    start = (dst.screen_pos[0], dst.screen_pos[1] - 10)
                    end = (src.screen_pos[0], src.screen_pos[1] + 10)
                    color = (255, 200, 120)
                else:
                    # Default
                    start = src.screen_pos
                    end = dst.screen_pos
                    color = EDGE_COLOR
                pygame.draw.aaline(screen, color, start, end)
            # Draw labels and tooltips
            for node in nodes.values():
                if node == hovered or node == selected:
                    label = font.render(node.name, True, FONT_COLOR)
                    screen.blit(label, (node.screen_pos[0] + NODE_RADIUS + 6, node.screen_pos[1] - NODE_RADIUS // 2))
            if hovered:
                pygame.draw.rect(screen, (40, 40, 60, 220), (mx+20, my-10, 320, 40), border_radius=8)
                tip = font.render(f"{hovered.name} ({'dir' if hovered.is_dir else 'file'})", True, (255,255,200))
                screen.blit(tip, (mx+30, my))
            # --- System stats ---
            now = time.time()
            if now - last_stats > 0.2:
                CPU_HISTORY.append(psutil.cpu_percent() / 100)
                RAM_HISTORY.append(psutil.virtual_memory().percent / 100)
                last_stats = now
            draw_waveform(screen, CPU_HISTORY, (255, 120, 120), (40, HEIGHT-180, 600, 60), 'CPU Usage', font)
            draw_waveform(screen, RAM_HISTORY, (120, 255, 180), (40, HEIGHT-110, 600, 60), 'RAM Usage', font)
            # Detailed stats
            stats_font = pygame.font.SysFont('consolas', 16)
            cpu = psutil.cpu_percent()
            ram = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            net = psutil.net_io_counters()
            stats = [
                f"CPU: {cpu:.1f}%  Cores: {psutil.cpu_count(logical=True)}",
                f"RAM: {ram.percent:.1f}%  Used: {ram.used//1024//1024}MB / {ram.total//1024//1024}MB",
                f"Disk: {disk.percent:.1f}%  Used: {disk.used//1024//1024}MB / {disk.total//1024//1024}MB",
                f"Net: Sent {net.bytes_sent//1024//1024}MB  Recv {net.bytes_recv//1024//1024}MB"
            ]
            for i, line in enumerate(stats):
                stat_surf = stats_font.render(line, True, (200, 220, 255))
                screen.blit(stat_surf, (700, HEIGHT-170 + i*28))
            
            # Draw Enhanced Visualizer Button
            button_color = (80, 120, 200) if button_hovered else (60, 80, 120)
            border_color = (120, 160, 255) if button_hovered else (100, 120, 180)
            pygame.draw.rect(screen, button_color, button_rect, border_radius=8)
            pygame.draw.rect(screen, border_color, button_rect, 2, border_radius=8)
            
            button_text = button_font.render("Enhanced Visualizer (E)", True, (255, 255, 255))
            text_rect = button_text.get_rect(center=button_rect.center)
            screen.blit(button_text, text_rect)
            
            pygame.display.flip()
            clock.tick(60)
        # --- Physics simulation step ---
        apply_forces(nodes, edges, steps=2)
    except Exception as e:
        import traceback
        print("[CRITICAL] Visualizer crashed:")
        traceback.print_exc()
        input("Press Enter to exit...")
    pygame.quit()


if __name__ == "__main__":
    launch_visualizer()
