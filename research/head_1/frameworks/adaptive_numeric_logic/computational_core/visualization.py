import numpy as np
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.progress import Progress, BarColumn

class PhysicsVisualizer:
    def __init__(self, console=None):
        self.console = console or Console()

    def visualize_energy_scale(self, energy_joules, comparison_points=True):
        """Create a visual scale comparing the energy to known phenomena"""
        energy_log = np.log10(energy_joules)
        
        # Define reference points
        references = {
            -19: "Chemical bond energy (~1eV)",
            -13: "Mobile phone radio wave (~1µeV)",
            -6: "Human metabolism per second",
            3: "Car kinetic energy at 100km/h",
            6: "Lightning bolt",
            12: "Hiroshima bomb",
            15: "Magnitude 9.0 earthquake",
            34: "Total solar energy output per day"
        }
        
        # Create visual scale
        scale = Text()
        scale.append("\nEnergy Scale (log₁₀ Joules):\n", style="bold cyan")
        
        with Progress(
            "[progress.description]{task.description}",
            BarColumn(bar_width=40),
            "[progress.percentage]{task.percentage:>3.0f}%",
            console=self.console
        ) as progress:
            
            # Create the scale
            scale_task = progress.add_task("", total=100)
            progress.update(scale_task, completed=50)  # Center point
            
            # Add reference points
            for log_value, description in references.items():
                marker = "▼" if abs(log_value - energy_log) < 0.1 else "•"
                style = "bold green" if abs(log_value - energy_log) < 0.1 else "white"
                scale.append(f"\n{marker} {log_value:4.0f}: {description}", style=style)
        
        return scale

    def visualize_relativistic_effects(self, beta, include_particle_examples=True):
        """Create a visual representation of relativistic effects vs velocity"""
        gamma = 1 / np.sqrt(1 - beta**2)
        
        # Create a visualization of relativistic effects
        effects = Table(show_header=True, header_style="bold magenta")
        effects.add_column("Effect", style="cyan")
        effects.add_column("Value", style="green")
        effects.add_column("Description", style="yellow")
        
        effects.add_row(
            "Time Dilation",
            f"{gamma:.3f}x",
            "Time slows down by this factor"
        )
        effects.add_row(
            "Length Contraction",
            f"{1/gamma:.3%}",
            "Objects appear this fraction of their rest length"
        )
        effects.add_row(
            "Mass Increase",
            f"{gamma:.3f}x",
            "Mass increases by this factor"
        )
        
        if include_particle_examples:
            # Add real particle examples close to this speed
            particle_examples = {
                0.9: "90% c: Typical particle in cosmic rays",
                0.99: "99% c: LEP electrons",
                0.999: "99.9% c: LHC protons",
                0.99999: "99.999% c: Highest energy cosmic rays"
            }
            
            for v, desc in particle_examples.items():
                if abs(beta - v) < 0.01:
                    effects.add_row(
                        "Similar to",
                        f"{v:.3%} c",
                        desc
                    )
        
        return effects

    def visualize_spacetime_diagram(self, coordinates, transformed_coordinates):
        """Create a text-based visualization of spacetime coordinates"""
        diagram = Text()
        diagram.append("\nSpacetime Diagram:\n", style="bold cyan")
        
        # Original coordinates
        diagram.append("\nOriginal frame (unprimed):", style="bold green")
        for coord, value in coordinates.items():
            diagram.append(f"\n{coord}: {value:10.3e}", style="green")
            
        # Transformed coordinates
        diagram.append("\n\nTransformed frame (primed):", style="bold yellow")
        for coord, value in transformed_coordinates.items():
            diagram.append(f"\n{coord}: {value:10.3e}", style="yellow")
            
        return diagram

    def visualize_uncertainty(self, nominal_value, uncertainty, unit=""):
        """Create a visual representation of a measurement with uncertainty"""
        uncertainty_table = Table(show_header=True)
        uncertainty_table.add_column("Measure", style="cyan")
        uncertainty_table.add_column("Value", style="green")
        
        # Format the values
        if abs(nominal_value) >= 1e6 or abs(nominal_value) <= 1e-6:
            format_str = "{:.6e}"
        else:
            format_str = "{:.6f}"
            
        nominal_str = format_str.format(nominal_value)
        uncertainty_str = format_str.format(uncertainty)
        relative_uncertainty = (uncertainty / nominal_value) * 100
        
        uncertainty_table.add_row(
            "Nominal Value",
            f"{nominal_str} {unit}"
        )
        uncertainty_table.add_row(
            "Uncertainty (±)",
            f"{uncertainty_str} {unit}"
        )
        uncertainty_table.add_row(
            "Relative Uncertainty",
            f"{relative_uncertainty:.4f}%"
        )
        
        # Add confidence interval
        uncertainty_table.add_row(
            "95% Confidence Interval",
            f"{nominal_str} ± {uncertainty_str} {unit}"
        )
        
        return uncertainty_table