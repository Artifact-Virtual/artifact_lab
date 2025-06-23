import os
import json
import pygame
import math
import time
import psutil
import collections

INDEX_PATH = os.path.join(os.path.dirname(__file__), 'dependency_index.json')

# Enhanced display settings
WIDTH, HEIGHT = 1200, 800
BG_COLOR = (8, 8, 12)  # Deep dark blue-black
PANEL_BG = (15, 15, 20)  # Slightly lighter panel background
TEXT_COLOR = (220, 220, 230)  # Soft white
ACCENT_COLOR = (64, 196, 255)  # Bright cyan
ACCENT2_COLOR = (255, 128, 64)  # Orange accent
HIGHLIGHT_COLOR = (255, 255, 255)  # Pure white highlight
ERROR_COLOR = (255, 80, 80)  # Bright red
SUCCESS_COLOR = (80, 255, 80)  # Bright green
WARNING_COLOR = (255, 200, 80)  # Yellow warning

# Chart colors
CHART_COLORS = [
    (64, 196, 255), (255, 128, 64), (128, 255, 64), (255, 64, 196),
    (196, 64, 255), (255, 255, 64), (64, 255, 196), (255, 196, 64)
]


class ViewMode:
    DASHBOARD = 0
    FILE_TREE = 1
    METRICS_CHARTS = 2
    HEATMAP = 3


class AdvancedVisualizer:
    def __init__(self):
        pygame.init()

        # Create main display with better flags
        self.screen = pygame.display.set_mode(
            (WIDTH, HEIGHT),
            pygame.DOUBLEBUF | pygame.HWSURFACE
        )
        pygame.display.set_caption(
            'ARTIFACT VIRTUAL - Enhanced Code Analytics'
        )

        # Enhanced font system
        self.fonts = {
            'title': pygame.font.SysFont('segoe ui', 28, bold=True),
            'heading': pygame.font.SysFont('segoe ui', 20, bold=True),
            'body': pygame.font.SysFont('segoe ui', 16),
            'small': pygame.font.SysFont('segoe ui', 14),
            'code': pygame.font.SysFont('consolas', 14),
            'tiny': pygame.font.SysFont('segoe ui', 12)
        }

        # Load and process data
        self.load_data()

        # Enhanced view state
        self.current_view = ViewMode.DASHBOARD
        self.selected_file = None
        self.selected_directory = None
        self.scroll_y = 0

        # UI layout
        self.sidebar_width = 350
        self.header_height = 80
        self.show_sidebar = True

        # Real-time monitoring
        self.system_stats = {
            'cpu_history': collections.deque(maxlen=120),
            'memory_history': collections.deque(maxlen=120),
            'disk_history': collections.deque(maxlen=120)
        }
        self.last_stats_update = 0

        # Animation
        self.animation_time = 0
        self.mouse_pos = (0, 0)

        self.clock = pygame.time.Clock()

    def load_data(self):
        """Load and process the enhanced dependency index"""
        try:
            with open(INDEX_PATH, 'r', encoding='utf-8') as f:
                self.index = json.load(f)
            self.process_enhanced_metrics()
        except FileNotFoundError:
            self.index = {}
            print(f"Warning: {INDEX_PATH} not found - generating sample data")
            self.create_sample_data()

    def create_sample_data(self):
        """Create sample data for demonstration"""
        self.index = {
            'root': {
                'files': {
                    'main.py': {
                        'size': 2048, 'type': '.py', 'is_dotfile': False,
                        'modified': time.time()
                    },
                    '.gitignore': {
                        'size': 156, 'type': '', 'is_dotfile': True,
                        'modified': time.time()
                    },
                    'config.json': {
                        'size': 512, 'type': '.json', 'is_dotfile': False,
                        'modified': time.time()
                    }
                }
            },
            'src': {
                'files': {
                    'app.py': {
                        'size': 4096, 'type': '.py', 'is_dotfile': False,
                        'modified': time.time()
                    },
                    'utils.py': {
                        'size': 1024, 'type': '.py', 'is_dotfile': False,
                        'modified': time.time()
                    }
                }
            }
        }
        self.process_enhanced_metrics()

    def process_enhanced_metrics(self):
        """Calculate comprehensive metrics for all files and directories"""
        self.metrics = {}
        self.global_stats = {
            'total_files': 0,
            'total_size': 0,
            'file_types': collections.Counter(),
            'dotfiles_count': 0,
            'directories_count': 0
        }

        # Process each directory
        for dir_name, data in self.index.items():
            if dir_name == '_metadata':
                continue

            files = data.get('files', {})

            # Enhanced directory metrics
            file_sizes = [info['size'] for info in files.values()]
            file_types = [info['type'] for info in files.values()]

            self.metrics[dir_name] = {
                'total_files': len(files),
                'total_size': sum(file_sizes),
                'avg_file_size': (
                    sum(file_sizes) / len(file_sizes) if file_sizes else 0
                ),
                'dotfiles': [
                    name for name, info in files.items()
                    if info.get('is_dotfile', False)
                ],
                'language_distribution': self.analyze_languages(files)
            }

            # Update global stats
            self.global_stats['total_files'] += len(files)
            self.global_stats['total_size'] += sum(file_sizes)
            self.global_stats['file_types'].update(file_types)
            self.global_stats['dotfiles_count'] += len(
                self.metrics[dir_name]['dotfiles']
            )
            self.global_stats['directories_count'] += 1

    def analyze_languages(self, files):
        """Analyze programming language distribution"""
        lang_map = {
            '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript',
            '.html': 'HTML', '.css': 'CSS', '.json': 'JSON',
            '.cpp': 'C++', '.c': 'C', '.java': 'Java', '.cs': 'C#',
            '.go': 'Go', '.rs': 'Rust', '.php': 'PHP', '.rb': 'Ruby',
            '.sh': 'Shell', '.bat': 'Batch', '.ps1': 'PowerShell'
        }

        languages = collections.Counter()
        for filename, info in files.items():
            file_type = info.get('type', '')
            if file_type in lang_map:
                languages[lang_map[file_type]] += 1

        return languages

    def update_system_stats(self):
        """Update real-time system statistics"""
        current_time = time.time()
        if current_time - self.last_stats_update < 0.5:
            return

        # Collect system stats
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()

        try:
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
        except Exception:
            disk_percent = 0

        # Update histories
        self.system_stats['cpu_history'].append(cpu_percent)
        self.system_stats['memory_history'].append(memory.percent)
        self.system_stats['disk_history'].append(disk_percent)

        self.last_stats_update = current_time

    def draw_gradient_rect(self, surface, color1, color2, rect):
        """Draw a gradient rectangle"""
        for y in range(rect.height):
            blend = y / rect.height
            r = int(color1[0] * (1 - blend) + color2[0] * blend)
            g = int(color1[1] * (1 - blend) + color2[1] * blend)
            b = int(color1[2] * (1 - blend) + color2[2] * blend)
            pygame.draw.line(
                surface, (r, g, b),
                (rect.x, rect.y + y),
                (rect.x + rect.width, rect.y + y)
            )

    def draw_chart(self, surface, data, rect, color, chart_type='line'):
        """Draw enhanced charts with better graphics"""
        if not data or len(data) < 2:
            return

        # Background
        pygame.draw.rect(surface, PANEL_BG, rect)
        pygame.draw.rect(surface, color, rect, 2)

        # Data normalization
        max_val = max(data) if data else 1
        min_val = min(data) if data else 0
        range_val = max_val - min_val if max_val != min_val else 1

        points = []
        for i, value in enumerate(data):
            x = rect.x + (i * rect.width) // len(data)
            y = rect.y + rect.height - int(
                ((value - min_val) / range_val) * rect.height
            )
            points.append((x, y))

        if chart_type == 'line' and len(points) > 1:
            # Draw gradient fill
            fill_points = points + [
                (rect.right, rect.bottom), (rect.left, rect.bottom)
            ]
            if len(fill_points) > 2:
                # Create transparent fill
                fill_surface = pygame.Surface((rect.width, rect.height))
                fill_surface.set_alpha(50)
                fill_surface.fill(color)

                # Draw the fill shape
                try:
                    adjusted_points = [
                        (p[0] - rect.x, p[1] - rect.y) for p in fill_points
                    ]
                    pygame.draw.polygon(fill_surface, color, adjusted_points)
                    surface.blit(fill_surface, rect.topleft)
                except Exception:
                    pass

            # Draw line
            if len(points) > 1:
                pygame.draw.lines(surface, color, False, points, 3)

        elif chart_type == 'bar':
            bar_width = max(1, rect.width // len(data))
            for i, value in enumerate(data):
                bar_height = int(((value - min_val) / range_val) * rect.height)
                bar_rect = pygame.Rect(
                    rect.x + i * bar_width,
                    rect.y + rect.height - bar_height,
                    bar_width - 1,
                    bar_height
                )
                pygame.draw.rect(surface, color, bar_rect)

        # Draw current value
        if data:
            current_val = data[-1]
            text = self.fonts['small'].render(
                f"{current_val:.1f}%", True, color
            )
            surface.blit(text, (rect.right - text.get_width() - 5, rect.y + 5))

    def draw_pie_chart(self, surface, data, rect, title=""):
        """Draw a pie chart with labels"""
        if not data:
            return

        center = rect.center
        radius = min(rect.width, rect.height) // 2 - 20

        total = sum(data.values())
        if total == 0:
            return

        # Draw title
        if title:
            title_text = self.fonts['heading'].render(title, True, TEXT_COLOR)
            title_rect = title_text.get_rect(centerx=center[0], y=rect.y)
            surface.blit(title_text, title_rect)

        # Draw pie slices
        start_angle = 0
        color_index = 0

        for label, value in data.items():
            angle = (value / total) * 360
            color = CHART_COLORS[color_index % len(CHART_COLORS)]

            # Draw slice
            end_angle = start_angle + angle
            points = [center]

            # Generate arc points
            for a in range(int(start_angle), int(end_angle) + 1, 2):
                x = center[0] + radius * math.cos(math.radians(a))
                y = center[1] + radius * math.sin(math.radians(a))
                points.append((x, y))

            if len(points) > 2:
                pygame.draw.polygon(surface, color, points)
                pygame.draw.polygon(surface, TEXT_COLOR, points, 2)

            # Draw label
            label_angle = math.radians(start_angle + angle / 2)
            label_x = center[0] + (radius + 30) * math.cos(label_angle)
            label_y = center[1] + (radius + 30) * math.sin(label_angle)

            label_text = self.fonts['small'].render(
                f"{label}: {value}", True, color
            )
            surface.blit(
                label_text, (label_x - label_text.get_width()//2, label_y)
            )

            start_angle = end_angle
            color_index += 1

    def draw_dashboard(self):
        """Draw the main dashboard view"""
        # Header
        header_rect = pygame.Rect(0, 0, WIDTH, self.header_height)
        self.draw_gradient_rect(self.screen, PANEL_BG, BG_COLOR, header_rect)

        # Title
        title = self.fonts['title'].render(
            "ARTIFACT VIRTUAL - Code Analytics Dashboard", True, ACCENT_COLOR
        )
        self.screen.blit(title, (20, 20))

        # Stats summary
        stats_text = (
            f"Files: {self.global_stats['total_files']} | "
            f"Size: {self.global_stats['total_size'] / 1024:.1f}KB | "
            f"Dotfiles: {self.global_stats['dotfiles_count']}"
        )

        summary = self.fonts['body'].render(stats_text, True, TEXT_COLOR)
        self.screen.blit(summary, (20, 50))

        # Main content area
        content_y = self.header_height + 20

        # System metrics charts (top row)
        chart_width = (WIDTH - 80) // 3
        chart_height = 150

        # CPU Chart
        cpu_rect = pygame.Rect(20, content_y, chart_width, chart_height)
        cpu_title = self.fonts['heading'].render(
            "CPU Usage", True, ACCENT_COLOR
        )
        self.screen.blit(cpu_title, (cpu_rect.x, cpu_rect.y - 25))

        self.draw_chart(self.screen, list(self.system_stats['cpu_history']),
                       cpu_rect, ACCENT_COLOR)

        # Memory Chart
        mem_rect = pygame.Rect(
            40 + chart_width, content_y, chart_width, chart_height
        )
        mem_title = self.fonts['heading'].render(
            "Memory Usage", True, ACCENT2_COLOR
        )
        self.screen.blit(mem_title, (mem_rect.x, mem_rect.y - 25))

        self.draw_chart(self.screen, list(self.system_stats['memory_history']),
                       mem_rect, ACCENT2_COLOR)

        # Disk Chart
        disk_rect = pygame.Rect(
            60 + 2 * chart_width, content_y, chart_width, chart_height
        )
        disk_title = self.fonts['heading'].render(
            "Disk Usage", True, SUCCESS_COLOR
        )
        self.screen.blit(disk_title, (disk_rect.x, disk_rect.y - 25))

        self.draw_chart(self.screen, list(self.system_stats['disk_history']),
                       disk_rect, SUCCESS_COLOR)

        # File type distribution (bottom left)
        pie_y = content_y + chart_height + 60
        pie_rect = pygame.Rect(20, pie_y, 400, 300)

        # Prepare data for pie chart
        file_types = dict(self.global_stats['file_types'].most_common(8))
        self.draw_pie_chart(
            self.screen, file_types, pie_rect, "File Types Distribution"
        )

        # Directory analysis (bottom right)
        dir_analysis_x = pie_rect.right + 40
        dir_rect = pygame.Rect(
            dir_analysis_x, pie_y, WIDTH - dir_analysis_x - 20, 300
        )

        pygame.draw.rect(self.screen, PANEL_BG, dir_rect)
        pygame.draw.rect(self.screen, ACCENT_COLOR, dir_rect, 2)

        # Directory list
        dir_title = self.fonts['heading'].render(
            "Directory Analysis", True, ACCENT_COLOR
        )
        self.screen.blit(dir_title, (dir_rect.x + 10, dir_rect.y + 10))

        y_offset = 50
        for dir_name, metrics in list(self.metrics.items())[:8]:
            dir_text = (
                f"{dir_name}: {metrics['total_files']} files, "
                f"{metrics['total_size']/1024:.1f}KB"
            )
            dir_surface = self.fonts['small'].render(
                dir_text, True, TEXT_COLOR
            )
            self.screen.blit(
                dir_surface, (dir_rect.x + 20, dir_rect.y + y_offset)
            )

            # Dotfiles indicator
            if metrics['dotfiles']:
                dot_text = f"  • {len(metrics['dotfiles'])} dotfiles"
                dot_surface = self.fonts['tiny'].render(
                    dot_text, True, WARNING_COLOR
                )
                self.screen.blit(
                    dot_surface, (dir_rect.x + 30, dir_rect.y + y_offset + 15)
                )
                y_offset += 35
            else:
                y_offset += 25

    def draw_file_tree(self):
        """Draw enhanced file tree view"""
        # Header
        title = self.fonts['heading'].render(
            "File Tree View", True, ACCENT_COLOR
        )
        self.screen.blit(title, (20, 20))

        y = 60
        for dir_name, data in self.index.items():
            if dir_name == '_metadata':
                continue

            # Directory header
            dir_text = f"📁 {dir_name} ({len(data.get('files', {}))} files)"
            dir_surface = self.fonts['body'].render(
                dir_text, True, ACCENT_COLOR
            )
            self.screen.blit(dir_surface, (30, y))
            y += 30

            # Files in directory
            files = data.get('files', {})
            for filename, info in list(files.items())[:10]:  # Limit display
                # File icon based on type
                if info.get('is_dotfile'):
                    icon = "🔸"
                elif info.get('type') == '.py':
                    icon = "🐍"
                elif info.get('type') == '.js':
                    icon = "📜"
                elif info.get('type') == '.json':
                    icon = "⚙️"
                else:
                    icon = "📄"

                file_text = f"  {icon} {filename} ({info['size']} bytes)"
                file_surface = self.fonts['small'].render(
                    file_text, True, TEXT_COLOR
                )
                self.screen.blit(file_surface, (50, y))
                y += 20

            y += 10

    def handle_events(self):
        """Handle pygame events with enhanced interaction"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return False
                elif event.key == pygame.K_1:
                    self.current_view = ViewMode.DASHBOARD
                elif event.key == pygame.K_2:
                    self.current_view = ViewMode.FILE_TREE
                elif event.key == pygame.K_TAB:
                    self.show_sidebar = not self.show_sidebar

            elif event.type == pygame.MOUSEMOTION:
                self.mouse_pos = event.pos

            elif event.type == pygame.MOUSEWHEEL:
                self.scroll_y += event.y * 20

        return True

    def draw_ui_overlay(self):
        """Draw UI overlay with controls"""
        # Controls panel
        controls_rect = pygame.Rect(WIDTH - 250, HEIGHT - 120, 240, 110)
        pygame.draw.rect(self.screen, PANEL_BG, controls_rect)
        pygame.draw.rect(self.screen, ACCENT_COLOR, controls_rect, 2)

        controls_title = self.fonts['small'].render(
            "Controls:", True, ACCENT_COLOR
        )
        self.screen.blit(
            controls_title, (controls_rect.x + 10, controls_rect.y + 10)
        )

        controls = [
            "1 - Dashboard View",
            "2 - File Tree View",
            "TAB - Toggle Sidebar",
            "ESC - Exit"
        ]

        for i, control in enumerate(controls):
            text = self.fonts['tiny'].render(control, True, TEXT_COLOR)
            self.screen.blit(
                text,
                (controls_rect.x + 10, controls_rect.y + 30 + i * 15)
            )

    def run(self):
        """Main application loop with enhanced rendering"""
        running = True

        while running:
            dt = self.clock.tick(60) / 1000.0
            self.animation_time += dt

            # Handle events
            running = self.handle_events()

            # Update system stats
            self.update_system_stats()

            # Clear screen with gradient
            self.screen.fill(BG_COLOR)

            # Draw current view
            if self.current_view == ViewMode.DASHBOARD:
                self.draw_dashboard()
            elif self.current_view == ViewMode.FILE_TREE:
                self.draw_file_tree()

            # Draw UI overlay
            self.draw_ui_overlay()

            # Update display
            pygame.display.flip()

        pygame.quit()


def launch_enhanced_visualizer():
    """Launch the enhanced visualizer"""
    try:
        visualizer = AdvancedVisualizer()
        visualizer.run()
    except Exception as e:
        print(f"Error launching enhanced visualizer: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    launch_enhanced_visualizer()
