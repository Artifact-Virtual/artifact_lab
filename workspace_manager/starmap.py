import os
import json
import pygame
import math
import random
from pathlib import Path
import psutil
import time
import threading
from collections import deque

INDEX_PATH = os.path.join(os.path.dirname(__file__), 'dependency_index.json')

# Display settings
WIDTH, HEIGHT = 1920, 1200
BG_COLOR = (0, 0, 0)  # Deep space black
STAR_COLORS = [
    (255, 255, 255),  # White dwarf
    (120, 220, 255),  # Blue giant
    (255, 120, 220),  # Pink nebula
    (255, 255, 120),  # Yellow star
    (255, 120, 120),  # Red giant
    (120, 255, 120),  # Green pulsar
    (220, 120, 255),  # Purple supernova
    (255, 220, 120),  # Orange star
]

# System for exclusions
EXCLUDED_DIRS = {'.git', '.vscode', '.idea', '__pycache__', '.pytest_cache', 
                 '.mypy_cache', '.tox', '.coverage', '.env', '.venv', 'node_modules',
                 '.DS_Store', '.svn', '.hg', '.bzr'}

class StarFile:
    def __init__(self, name, pos3d, file_type, size=1, connections=None):
        self.name = name
        self.pos3d = pos3d
        self.screen_pos = (0, 0)
        self.file_type = file_type
        self.size = size  # Brightness/importance
        self.connections = connections or []
        self.selected = False
        self.constellation_id = 0
        self.pulse_phase = random.uniform(0, 2 * math.pi)
        self.base_radius = max(2, min(8, size * 3))
        
    def get_color(self):
        if self.selected:
            return (255, 255, 255)
        return CONSTELLATION_COLORS[self.constellation_id % len(CONSTELLATION_COLORS)]
    
    def get_radius(self, time_factor):
        pulse = math.sin(self.pulse_phase + time_factor * 2) * 0.3 + 1
        return int(self.base_radius * pulse)

class Constellation:
    def __init__(self, name, stars, center_pos):
        self.name = name
        self.stars = stars
        self.center_pos = center_pos
        self.color = CONSTELLATION_COLORS[len(CONSTELLATION_COLORS) % len(CONSTELLATION_COLORS)]
        self.selected = False
        self.rotation_speed = random.uniform(0.001, 0.003)
        self.orbit_radius = random.uniform(200, 400)

class StarmapVisualizer:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.DOUBLEBUF)
        pygame.display.set_caption('ARTIFACT VIRTUAL - Starmap Code Constellation')
        
        # Fonts
        self.font_large = pygame.font.SysFont('consolas', 28, bold=True)
        self.font_medium = pygame.font.SysFont('consolas', 20)
        self.font_small = pygame.font.SysFont('consolas', 16)
        
        # 3D Camera
        self.camera_pos = [0, 0, -800]
        self.camera_rotation = [0, 0, 0]  # pitch, yaw, roll
        self.fov = 60
        
        # Interaction
        self.selected_star = None
        self.selected_constellation = None
        self.mouse_sensitivity = 0.005
        self.zoom_speed = 50
        self.last_mouse_pos = (0, 0)
        self.dragging = False
        
        # Animation
        self.time_factor = 0
        self.auto_rotate = True
        self.constellation_view = False
        
        # Data
        self.stars = []
        self.constellations = []
        self.background_stars = []
        
        # UI
        self.show_info = True
        self.show_connections = True
        self.show_labels = True
        
        self.clock = pygame.time.Clock()
        self.load_data()
        self.generate_background_stars()
        
    def load_data(self):
        """Load and convert codebase data into star constellations"""
        try:
            with open(INDEX_PATH, 'r', encoding='utf-8') as f:
                index = json.load(f)
            self.create_starmap_from_index(index)
        except FileNotFoundError:
            print(f"Warning: {INDEX_PATH} not found, creating demo starmap")
            self.create_demo_starmap()
    
    def create_starmap_from_index(self, index):
        """Transform codebase into a beautiful starmap"""
        self.stars = []
        self.constellations = []
        
        constellation_id = 0
        
        for dir_name, data in index.items():
            files = data.get('files', [])
            if not files:
                continue
            
            # Create constellation center
            angle = constellation_id * (2 * math.pi / len(index))
            base_radius = 300 + constellation_id * 50
            
            # Constellation center in 3D space
            center_x = math.cos(angle) * base_radius
            center_y = math.sin(angle) * base_radius  
            center_z = random.uniform(-200, 200)
            center_pos = [center_x, center_y, center_z]
            
            constellation_stars = []
            
            # Create stars for each file
            for i, filename in enumerate(files):
                # Position files in 3D around constellation center
                if len(files) == 1:
                    # Single file at center
                    star_pos = center_pos[:]
                else:
                    # Distribute files in 3D sphere around center
                    theta = (i / len(files)) * 2 * math.pi
                    phi = math.acos(1 - 2 * random.random())  # Uniform sphere distribution
                    radius = random.uniform(50, 120)
                    
                    star_x = center_x + radius * math.sin(phi) * math.cos(theta)
                    star_y = center_y + radius * math.sin(phi) * math.sin(theta)
                    star_z = center_z + radius * math.cos(phi)
                    star_pos = [star_x, star_y, star_z]
                
                # Determine file importance (size/brightness)
                file_ext = Path(filename).suffix.lower()
                importance = self.get_file_importance(file_ext, filename)
                
                # Create star
                star = StarFile(
                    name=f"{dir_name}/{filename}",
                    pos3d=star_pos,
                    file_type=file_ext,
                    size=importance
                )
                star.constellation_id = constellation_id
                
                constellation_stars.append(star)
                self.stars.append(star)
            
            # Create constellation
            constellation = Constellation(dir_name, constellation_stars, center_pos)
            constellation.color = CONSTELLATION_COLORS[constellation_id % len(CONSTELLATION_COLORS)]
            self.constellations.append(constellation)
            
            constellation_id += 1
        
        # Create connections between related files
        self.create_star_connections()
    
    def get_file_importance(self, file_ext, filename):
        """Calculate file importance for star brightness"""
        importance = 1
        
        # Base importance by file type
        if file_ext in ['.py', '.js', '.ts']:
            importance += 2
        elif file_ext in ['.html', '.css']:
            importance += 1.5
        elif file_ext in ['.json', '.yaml', '.yml']:
            importance += 1
        
        # Special files get extra importance
        special_names = ['main', 'index', 'app', '__init__', 'config']
        for special in special_names:
            if special in filename.lower():
                importance += 2
                break
        
        return min(importance, 5)  # Cap at 5
    
    def create_star_connections(self):
        """Create connections between related stars"""
        # Connect files within same constellation
        for constellation in self.constellations:
            stars = constellation.stars
            if len(stars) > 1:
                # Connect to constellation center (main files)
                main_stars = [s for s in stars if 'main' in s.name.lower() or '__init__' in s.name.lower()]
                if main_stars:
                    main_star = main_stars[0]
                    for star in stars:
                        if star != main_star:
                            star.connections.append(main_star)
                else:
                    # Connect in chain if no main file
                    for i in range(len(stars) - 1):
                        stars[i].connections.append(stars[i + 1])
        
        # Connect related constellations (cross-constellation links)
        for i, const1 in enumerate(self.constellations):
            for j, const2 in enumerate(self.constellations[i+1:], i+1):
                # Create sparse connections between constellations
                if random.random() < 0.3:  # 30% chance of connection
                    if const1.stars and const2.stars:
                        star1 = random.choice(const1.stars)
                        star2 = random.choice(const2.stars)
                        star1.connections.append(star2)
    
    def generate_background_stars(self):
        """Generate background star field"""
        self.background_stars = []
        for _ in range(200):
            x = random.uniform(-1000, 1000)
            y = random.uniform(-1000, 1000)
            z = random.uniform(-1000, 1000)
            brightness = random.uniform(0.1, 0.5)
            self.background_stars.append(([x, y, z], brightness))
    
    def create_demo_starmap(self):
        """Create a demo starmap for testing"""
        self.stars = []
        self.constellations = []
        
        # Demo constellation
        center_pos = [0, 0, 0]
        demo_files = ['main.py', 'utils.py', 'config.json', 'README.md']
        demo_stars = []
        
        for i, filename in enumerate(demo_files):
            angle = (i / len(demo_files)) * 2 * math.pi
            radius = 100
            pos = [
                math.cos(angle) * radius,
                math.sin(angle) * radius,
                random.uniform(-50, 50)
            ]
            
            star = StarFile(filename, pos, Path(filename).suffix, random.uniform(1, 3))
            demo_stars.append(star)
            self.stars.append(star)
        
        constellation = Constellation("Demo", demo_stars, center_pos)
        self.constellations.append(constellation)
    
    def project_3d_to_2d(self, pos3d):
        """Project 3D point to 2D screen coordinates"""
        x, y, z = pos3d
        
        # Apply camera rotation
        # Simplified rotation for performance
        cos_yaw = math.cos(self.camera_rotation[1])
        sin_yaw = math.sin(self.camera_rotation[1])
        cos_pitch = math.cos(self.camera_rotation[0])
        sin_pitch = math.sin(self.camera_rotation[0])
        
        # Rotate around Y axis (yaw)
        x_rot = x * cos_yaw - z * sin_yaw
        z_rot = x * sin_yaw + z * cos_yaw
        
        # Rotate around X axis (pitch)
        y_rot = y * cos_pitch - z_rot * sin_pitch
        z_final = y * sin_pitch + z_rot * cos_pitch
        
        # Translate by camera position
        z_final += self.camera_pos[2]
        
        # Perspective projection
        if z_final > -50:  # Prevent division by zero and behind camera
            z_final = -50
        
        scale = (-400) / z_final  # Perspective scaling
        screen_x = int(WIDTH / 2 + x_rot * scale)
        screen_y = int(HEIGHT / 2 + y_rot * scale)
        
        return (screen_x, screen_y, z_final)
    
    def update_star_positions(self):
        """Update all star screen positions"""
        for star in self.stars:
            proj = self.project_3d_to_2d(star.pos3d)
            star.screen_pos = (proj[0], proj[1])
            star.depth = proj[2]
        
        # Sort stars by depth for proper rendering
        self.stars.sort(key=lambda s: s.depth, reverse=True)
    
    def draw_background_stars(self):
        """Draw background star field"""
        for star_pos, brightness in self.background_stars:
            proj = self.project_3d_to_2d(star_pos)
            if (0 <= proj[0] <= WIDTH and 0 <= proj[1] <= HEIGHT):
                alpha = int(brightness * 255)
                color = (alpha, alpha, alpha)
                pygame.draw.circle(self.screen, color, (proj[0], proj[1]), 1)
    
    def draw_star_connections(self):
        """Draw connections between stars"""
        if not self.show_connections:
            return
        
        for star in self.stars:
            for connected_star in star.connections:
                if (0 <= star.screen_pos[0] <= WIDTH and 0 <= star.screen_pos[1] <= HEIGHT and
                    0 <= connected_star.screen_pos[0] <= WIDTH and 0 <= connected_star.screen_pos[1] <= HEIGHT):
                    
                    # Connection line with fade based on distance
                    color = star.get_color()
                    alpha_color = (*color, 100)  # Semi-transparent
                    
                    # Draw connection line
                    pygame.draw.aaline(self.screen, color, star.screen_pos, connected_star.screen_pos)
    
    def draw_stars(self):
        """Draw all stars with pulsing effects"""
        for star in self.stars:
            if not (0 <= star.screen_pos[0] <= WIDTH and 0 <= star.screen_pos[1] <= HEIGHT):
                continue
            
            color = star.get_color()
            radius = star.get_radius(self.time_factor)
            
            # Draw star with glow effect
            if star.selected or star.size > 3:
                # Outer glow
                for i in range(3, 0, -1):
                    glow_alpha = 50 - i * 15
                    glow_color = (*color, glow_alpha)
                    glow_radius = radius + i * 2
                    
                    # Create glow surface
                    glow_surf = pygame.Surface((glow_radius * 4, glow_radius * 4), pygame.SRCALPHA)
                    pygame.draw.circle(glow_surf, glow_color, 
                                     (glow_radius * 2, glow_radius * 2), glow_radius)
                    
                    self.screen.blit(glow_surf, 
                                   (star.screen_pos[0] - glow_radius * 2, 
                                    star.screen_pos[1] - glow_radius * 2),
                                   special_flags=pygame.BLEND_ALPHA_SDL2)
            
            # Main star
            pygame.draw.circle(self.screen, color, star.screen_pos, radius)
            
            # Star center highlight
            pygame.draw.circle(self.screen, (255, 255, 255), star.screen_pos, max(1, radius // 2))
    
    def draw_constellation_labels(self):
        """Draw constellation names and info"""
        if not self.show_labels:
            return
        
        for constellation in self.constellations:
            if not constellation.stars:
                continue
            
            # Find constellation center on screen
            center_x = sum(star.screen_pos[0] for star in constellation.stars) / len(constellation.stars)
            center_y = sum(star.screen_pos[1] for star in constellation.stars) / len(constellation.stars)
            
            if 0 <= center_x <= WIDTH and 0 <= center_y <= HEIGHT:
                # Constellation name
                name_color = constellation.color if constellation.selected else (200, 200, 200)
                name_surface = self.font_medium.render(constellation.name, True, name_color)
                name_rect = name_surface.get_rect(center=(center_x, center_y - 30))
                self.screen.blit(name_surface, name_rect)
                
                # File count
                count_text = f"{len(constellation.stars)} files"
                count_surface = self.font_small.render(count_text, True, (150, 150, 150))
                count_rect = count_surface.get_rect(center=(center_x, center_y - 10))
                self.screen.blit(count_surface, count_rect)
    
    def draw_ui(self):
        """Draw user interface"""
        if not self.show_info:
            return
        
        # Control panel
        ui_bg = pygame.Surface((350, 200), pygame.SRCALPHA)
        ui_bg.fill((0, 0, 0, 180))
        self.screen.blit(ui_bg, (WIDTH - 370, 20))
        
        ui_y = 30
        ui_x = WIDTH - 360
        
        # Title
        title = self.font_large.render("STARMAP CONTROLS", True, (255, 255, 255))
        self.screen.blit(title, (ui_x, ui_y))
        ui_y += 35
        
        controls = [
            "Mouse: Rotate view",
            "Scroll: Zoom in/out", 
            "Space: Auto-rotate toggle",
            "C: Constellation view",
            "L: Toggle labels",
            "I: Toggle info panel",
            "R: Reload data",
            "ESC: Exit"
        ]
        
        for control in controls:
            control_surface = self.font_small.render(control, True, (200, 200, 200))
            self.screen.blit(control_surface, (ui_x, ui_y))
            ui_y += 18
        
        # Selected item info
        if self.selected_star:
            info_bg = pygame.Surface((400, 120), pygame.SRCALPHA)
            info_bg.fill((0, 0, 0, 200))
            self.screen.blit(info_bg, (20, HEIGHT - 140))
            
            info_y = HEIGHT - 130
            
            # File name
            name_surface = self.font_medium.render(f"Selected: {self.selected_star.name}", True, (255, 255, 255))
            self.screen.blit(name_surface, (30, info_y))
            info_y += 25
            
            # File type
            type_surface = self.font_small.render(f"Type: {self.selected_star.file_type}", True, (200, 200, 200))
            self.screen.blit(type_surface, (30, info_y))
            info_y += 20
            
            # Connections
            conn_text = f"Connections: {len(self.selected_star.connections)}"
            conn_surface = self.font_small.render(conn_text, True, (200, 200, 200))
            self.screen.blit(conn_surface, (30, info_y))
            info_y += 20
            
            # Importance
            imp_text = f"Importance: {self.selected_star.size:.1f}"
            imp_surface = self.font_small.render(imp_text, True, (200, 200, 200))
            self.screen.blit(imp_surface, (30, info_y))
        
        # Stats
        stats_text = f"Stars: {len(self.stars)} | Constellations: {len(self.constellations)}"
        stats_surface = self.font_small.render(stats_text, True, (150, 150, 150))
        self.screen.blit(stats_surface, (20, 20))
    
    def handle_mouse_click(self, pos):
        """Handle mouse clicks for star selection"""
        closest_star = None
        closest_distance = float('inf')
        
        for star in self.stars:
            distance = math.sqrt((star.screen_pos[0] - pos[0])**2 + 
                               (star.screen_pos[1] - pos[1])**2)
            if distance < 30 and distance < closest_distance:  # 30 pixel selection radius
                closest_distance = distance
                closest_star = star
        
        # Update selection
        if self.selected_star:
            self.selected_star.selected = False
        
        self.selected_star = closest_star
        if self.selected_star:
            self.selected_star.selected = True
    
    def update_camera(self):
        """Update camera based on input"""
        if self.auto_rotate:
            self.camera_rotation[1] += 0.005  # Slow auto-rotation
        
        # Keep rotation values in reasonable range
        self.camera_rotation[1] = self.camera_rotation[1] % (2 * math.pi)
        self.camera_rotation[0] = max(-math.pi/2, min(math.pi/2, self.camera_rotation[0]))
    
    def run(self):
        """Main visualization loop"""
        running = True
        
        while running:
            dt = self.clock.tick(60) / 1000.0  # Delta time in seconds
            self.time_factor += dt
            
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_SPACE:
                        self.auto_rotate = not self.auto_rotate
                    elif event.key == pygame.K_c:
                        self.constellation_view = not self.constellation_view
                    elif event.key == pygame.K_l:
                        self.show_labels = not self.show_labels
                    elif event.key == pygame.K_i:
                        self.show_info = not self.show_info
                    elif event.key == pygame.K_r:
                        self.load_data()
                    elif event.key == pygame.K_LSHIFT:
                        self.show_connections = not self.show_connections
                
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1:  # Left click
                        self.dragging = True
                        self.last_mouse_pos = pygame.mouse.get_pos()
                        self.handle_mouse_click(event.pos)
                    elif event.button == 4:  # Scroll up
                        self.camera_pos[2] += self.zoom_speed
                    elif event.button == 5:  # Scroll down
                        self.camera_pos[2] -= self.zoom_speed
                
                elif event.type == pygame.MOUSEBUTTONUP:
                    if event.button == 1:
                        self.dragging = False
                
                elif event.type == pygame.MOUSEMOTION:
                    if self.dragging and not self.auto_rotate:
                        mouse_pos = pygame.mouse.get_pos()
                        dx = mouse_pos[0] - self.last_mouse_pos[0]
                        dy = mouse_pos[1] - self.last_mouse_pos[1]
                        
                        self.camera_rotation[1] += dx * self.mouse_sensitivity
                        self.camera_rotation[0] += dy * self.mouse_sensitivity
                        
                        self.last_mouse_pos = mouse_pos
            
            # Update camera and positions
            self.update_camera()
            self.update_star_positions()
            
            # Clear screen
            self.screen.fill(BG_COLOR)
            
            # Draw everything
            self.draw_background_stars()
            self.draw_star_connections()
            self.draw_stars()
            self.draw_constellation_labels()
            self.draw_ui()
            
            pygame.display.flip()
        
        pygame.quit()

def launch_starmap_visualizer():
    """Launch the starmap constellation visualizer"""
    visualizer = StarmapVisualizer()
    visualizer.run()

if __name__ == "__main__":
    launch_starmap_visualizer()
