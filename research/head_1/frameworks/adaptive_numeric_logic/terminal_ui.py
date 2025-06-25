import numpy as np
from typing import Dict, List, Optional, Union, Tuple
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt
from rich.layout import Layout
from rich.style import Style
from rich.text import Text
from rich.columns import Columns
from rich.tree import Tree
from rich.markdown import Markdown
import json
from ui_task_definition.dsl_parser import DSLParser
from control_orchestration.task_management import TaskScheduler
from computational_core.quantum_computing import QuantumIntegration
from computational_core.relativistic_physics import RelativisticCalculator
from computational_core.gravitational_physics import GravitationalPhysics
from computational_core.tensor_spinor import TensorRepresentation
from computational_core.visualization import PhysicsVisualizer
from computational_core.report_generation import ReportGenerator
from ai_core.ai_model import AIModel
from ui_task_definition.task_management.complex_task_builder import ComplexTaskBuilder, TaskStep
from datetime import timedelta
from task_management.step_types import StepType, StepRequirements, StepValidator
from task_management.dependency_rules import DependencyType, DependencyCondition
from task_management.resource_optimizer import ResourceOptimizer, ResourcePool
from control_orchestration.resource_manager import HardwareResourceManager

# Global instances
console = Console()
dsl_parser = DSLParser()
task_scheduler = TaskScheduler()
ai_model = AIModel()
physics_calc = RelativisticCalculator(precision_bits=256)
grav_physics = GravitationalPhysics(precision_bits=256)
visualizer = PhysicsVisualizer(console=console)

def create_physics_task(category, name, params=None):
    """Create a standardized physics task definition"""
    return {
        "task_id": f"{category}_{name}",
        "description": name,
        "parameters": params or {},
        "priority": "high",
        "precision": "arbitrary",
        "symbolic_computation": True
    }

def get_tensor_component(prompt: str, default: str = "0.0") -> float:
    """Get and validate tensor component input from user"""
    while True:
        try:
            value_str = Prompt.ask(prompt, default=default)
            return float(value_str)
        except ValueError as e:
            console.print(f"[red]{str(e)}[/red] Please try again.")

def show_relativistic_mechanics_menu():
    """Display relativistic mechanics computation options"""
    menu = Table(show_header=True, header_style="bold magenta")
    menu.add_column("ID", style="cyan", justify="right")
    menu.add_column("Operation", style="white")
    menu.add_column("Description", style="green")
    
    menu.add_row("1", "E = mc²", "Calculate rest energy from mass")
    menu.add_row("2", "Lorentz Transformation", "Calculate spacetime transformations")
    menu.add_row("3", "Time Dilation", "Calculate relativistic time effects")
    menu.add_row("4", "Length Contraction", "Calculate relativistic length effects")
    menu.add_row("5", "Relativistic Mass", "Calculate mass at relativistic speeds")
    
    console.print(Panel(menu, title="🚀 Relativistic Mechanics", border_style="blue"))
    
    choice = Prompt.ask("Select operation", choices=["1", "2", "3", "4", "5", "back"], default="back")
    
    if choice == "1":
        mass = float(Prompt.ask("Enter mass (kg)", default="1.0"))
        include_uncertainty = Prompt.ask("Include uncertainty analysis? (y/n)", choices=["y", "n"], default="y") == "y"
        result = physics_calc.rest_energy(mass, include_uncertainty)
        
        return create_physics_task("relativity", "rest_energy", {
            "mass": mass,
            "equation": "E = mc²",
            "precision_bits": 256,
            "include_uncertainty": include_uncertainty,
            "result": result
        })
    
    elif choice == "2":
        t = float(Prompt.ask("Enter time (s)", default="0.0"))
        x = float(Prompt.ask("Enter x position (m)", default="0.0"))
        y = float(Prompt.ask("Enter y position (m)", default="0.0"))
        z = float(Prompt.ask("Enter z position (m)", default="0.0"))
        
        while True:
            try:
                v_fraction = float(Prompt.ask("Enter relative velocity (as fraction of c)", default="0.5"))
                if abs(v_fraction) >= 1:
                    console.print("[red]Error: Velocity cannot be equal to or greater than the speed of light[/red]")
                    continue
                v = v_fraction * physics_calc.c
                break
            except ValueError:
                console.print("[red]Please enter a valid number[/red]")
        
        result = physics_calc.lorentz_transform(t, x, y, z, v)
        return create_physics_task("relativity", "lorentz_transform", {
            "coordinates": {"t": t, "x": x, "y": y, "z": z},
            "velocity": v,
            "result": result
        })
    
    elif choice == "3":
        time = float(Prompt.ask("Enter proper time (s)", default="1.0"))
        while True:
            try:
                v_fraction = float(Prompt.ask("Enter relative velocity (as fraction of c)", default="0.5"))
                if abs(v_fraction) >= 1:
                    console.print("[red]Error: Velocity cannot be equal to or greater than the speed of light[/red]")
                    continue
                v = v_fraction * physics_calc.c
                break
            except ValueError:
                console.print("[red]Please enter a valid number[/red]")
        
        result = physics_calc.time_dilation(time, v)
        return create_physics_task("relativity", "time_dilation", {
            "proper_time": time,
            "velocity": v,
            "result": result
        })
    
    elif choice == "4":
        length = float(Prompt.ask("Enter proper length (m)", default="1.0"))
        while True:
            try:
                v_fraction = float(Prompt.ask("Enter relative velocity (as fraction of c)", default="0.5"))
                if abs(v_fraction) >= 1:
                    console.print("[red]Error: Velocity cannot be equal to or greater than the speed of light[/red]")
                    continue
                v = v_fraction * physics_calc.c
                break
            except ValueError:
                console.print("[red]Please enter a valid number[/red]")
        
        result = physics_calc.length_contraction(length, v)
        return create_physics_task("relativity", "length_contraction", {
            "proper_length": length,
            "velocity": v,
            "result": result
        })
    
    elif choice == "5":
        mass = float(Prompt.ask("Enter rest mass (kg)", default="9.1093837015e-31"))
        while True:
            try:
                v_fraction = float(Prompt.ask("Enter relative velocity (as fraction of c)", default="0.5"))
                if abs(v_fraction) >= 1:
                    console.print("[red]Error: Velocity cannot be equal to or greater than the speed of light[/red]")
                    continue
                v = v_fraction * physics_calc.c
                break
            except ValueError:
                console.print("[red]Please enter a valid number[/red]")
        
        result = physics_calc.relativistic_mass(mass, v)
        return create_physics_task("relativity", "relativistic_mass", {
            "rest_mass": mass,
            "velocity": v,
            "result": result
        })
    
    return None

def show_quantum_mechanics_menu():
    """Display quantum mechanics computation options"""
    menu = Table(show_header=True, header_style="bold magenta")
    menu.add_column("ID", style="cyan", justify="right")
    menu.add_column("Operation", style="white")
    menu.add_column("Description", style="green")
    
    menu.add_row("1", "Schrödinger Equation", "Solve time-dependent systems")
    menu.add_row("2", "Quantum Entanglement", "Simulate entangled states")
    menu.add_row("3", "Quantum Tunneling", "Calculate tunneling probabilities")
    menu.add_row("4", "Energy Levels", "Compute quantum energy states")
    menu.add_row("5", "Quantum Circuit", "Design and simulate circuits")
    
    console.print(Panel(menu, title="⚛️ Quantum Mechanics", border_style="green"))
    
    choice = Prompt.ask("Select operation", choices=["1", "2", "3", "4", "5", "back"], default="back")
    
    quantum_integration = QuantumIntegration(quantum_backend="ibm_quantum")
    
    if choice == "1":
        # Schrödinger equation
        psi0 = [float(x) for x in Prompt.ask(
            "Enter initial state components (comma-separated)", 
            default="1.0, 0.0"
        ).split(",")]
        
        t = float(Prompt.ask("Enter time (s)", default="0.0"))
        
        # Simple 2x2 Hamiltonian for demonstration
        H = [[float(x) for x in row.split(",")] for row in [
            Prompt.ask("Enter Hamiltonian row 1 (comma-separated)", default="1.0, 0.0"),
            Prompt.ask("Enter Hamiltonian row 2 (comma-separated)", default="0.0, 1.0")
        ]]
        
        result = quantum_integration.solve_schrodinger({
            "initial_state": psi0,
            "time": t,
            "hamiltonian": H
        })
        
        return create_physics_task("quantum", "schrodinger", {
            "initial_state": psi0,
            "time": t,
            "hamiltonian": H,
            "result": result
        })
        
    elif choice == "2":
        # Quantum entanglement
        num_qubits = int(Prompt.ask("Enter number of qubits", default="2"))
        result = quantum_integration.create_bell_state(num_qubits)
        
        return create_physics_task("quantum", "entanglement", {
            "num_qubits": num_qubits,
            "operation": "bell_state",
            "quantum_integration": {"enabled": True, "backend": "ibm_quantum"},
            "result": result
        })
        
    elif choice == "3":
        # Quantum tunneling
        E = float(Prompt.ask("Enter particle energy (eV)", default="5.0"))
        V0 = float(Prompt.ask("Enter barrier height (eV)", default="10.0"))
        a = float(Prompt.ask("Enter barrier width (nm)", default="1.0"))
        m = float(Prompt.ask("Enter particle mass (electron masses)", default="1.0"))
        
        # Convert to SI units
        E *= 1.602176634e-19  # eV to Joules
        V0 *= 1.602176634e-19
        a *= 1e-9  # nm to m
        m *= 9.1093837015e-31  # electron mass to kg
        
        result = quantum_integration.calculate_tunneling({
            "energy": E,
            "barrier_height": V0,
            "barrier_width": a,
            "mass": m
        })
        
        return create_physics_task("quantum", "tunneling", {
            "parameters": {
                "energy_ev": E/1.602176634e-19,
                "barrier_height_ev": V0/1.602176634e-19,
                "barrier_width_nm": a*1e9,
                "mass_me": m/9.1093837015e-31
            },
            "result": result
        })
        
    elif choice == "4":
        # Energy levels
        potential_type = Prompt.ask(
            "Select potential type",
            choices=["harmonic", "infinite_well"],
            default="harmonic"
        )
        
        num_levels = int(Prompt.ask("Enter number of energy levels", default="5"))
        
        if potential_type == "harmonic":
            omega = float(Prompt.ask("Enter angular frequency (rad/s)", default="1.0"))
            result = quantum_integration.compute_energy_levels({
                "potential_type": "harmonic",
                "num_levels": num_levels,
                "frequency": omega
            })
        else:
            L = float(Prompt.ask("Enter well width (nm)", default="1.0"))
            m = float(Prompt.ask("Enter particle mass (electron masses)", default="1.0"))
            
            # Convert to SI units
            L *= 1e-9  # nm to m
            m *= 9.1093837015e-31  # electron mass to kg
            
            result = quantum_integration.compute_energy_levels({
                "potential_type": "infinite_well",
                "num_levels": num_levels,
                "length": L,
                "mass": m
            })
        
        return create_physics_task("quantum", "energy_levels", {
            "potential_type": potential_type,
            "num_levels": num_levels,
            "parameters": result["parameters"],
            "result": result
        })
        
    elif choice == "5":
        # Quantum circuit
        num_qubits = int(Prompt.ask("Enter number of qubits", default="2"))
        
        # Simple circuit demonstration with basic gates
        circuit = []
        while True:
            gate = Prompt.ask(
                "Enter gate (h=Hadamard, x=NOT, cnot=CNOT, m=Measure, done=Finish)",
                choices=["h", "x", "cnot", "m", "done"],
                default="done"
            )
            
            if gate == "done":
                break
                
            if gate in ["h", "x"]:
                qubit = int(Prompt.ask(f"Enter target qubit (0-{num_qubits-1})", default="0"))
                circuit.append({"gate": gate, "target": qubit})
            elif gate == "cnot":
                control = int(Prompt.ask(f"Enter control qubit (0-{num_qubits-1})", default="0"))
                target = int(Prompt.ask(f"Enter target qubit (0-{num_qubits-1})", default="1"))
                circuit.append({"gate": "cnot", "control": control, "target": target})
            else:  # measure
                qubit = int(Prompt.ask(f"Enter qubit to measure (0-{num_qubits-1})", default="0"))
                circuit.append({"gate": "measure", "target": qubit})
        
        # This would be implemented to use real quantum hardware or simulation
        result = {
            "circuit": circuit,
            "num_qubits": num_qubits,
            "backend": "ibm_quantum",
            "status": "simulation_pending"
        }
        
        return create_physics_task("quantum", "circuit", {
            "num_qubits": num_qubits,
            "circuit": circuit,
            "quantum_integration": {"enabled": True, "backend": "ibm_quantum"},
            "result": result
        })
    
    return None

def show_gravitational_physics_menu():
    """Display gravitational physics computation options"""
    menu = Table(show_header=True, header_style="bold magenta")
    menu.add_column("ID", style="cyan", justify="right")
    menu.add_column("Operation", style="white")
    menu.add_column("Description", style="green")
    
    menu.add_row("1", "Black Hole Metrics", "Calculate spacetime curvature")
    menu.add_row("2", "Gravitational Waves", "Simulate wave propagation")
    menu.add_row("3", "Orbital Dynamics", "Compute relativistic orbits")
    menu.add_row("4", "Event Horizon", "Analyze horizon properties")
    menu.add_row("5", "Mass Distribution", "Calculate gravitational fields")
    
    console.print(Panel(menu, title="🌌 Gravitational Physics", border_style="yellow"))
    
    choice = Prompt.ask("Select operation", choices=["1", "2", "3", "4", "5", "back"], default="back")
    
    if choice == "1":
        metric_type = Prompt.ask(
            "Select metric type", 
            choices=["schwarzschild", "kerr"],
            default="schwarzschild"
        )
        
        if metric_type == "schwarzschild":
            r = float(Prompt.ask("Enter radial coordinate (in Schwarzschild radii)", default="3.0"))
            theta = float(Prompt.ask("Enter theta coordinate (in radians)", default="1.5708"))
            
            metric = grav_physics.schwarzschild_metric(r, theta)
            return create_physics_task("gravity", "black_hole_metric", {
                "type": "schwarzschild",
                "coordinates": {"r": r, "theta": theta},
                "metric": metric.components.tolist(),
                "result": {
                    "metric_components": metric.components.tolist(),
                    "horizon_radius": 2.0,  # in geometric units where G=c=1
                    "singularity": 0.0
                }
            })
            
        else:  # Kerr metric
            r = float(Prompt.ask("Enter radial coordinate (in geometric units)", default="3.0"))
            theta = float(Prompt.ask("Enter theta coordinate (in radians)", default="1.5708"))
            a = float(Prompt.ask("Enter angular momentum parameter (0-1)", default="0.5"))
            
            metric = grav_physics.kerr_metric(r, theta, a)
            return create_physics_task("gravity", "black_hole_metric", {
                "type": "kerr",
                "coordinates": {"r": r, "theta": theta},
                "spin_parameter": a,
                "metric": metric.components.tolist(),
                "result": {
                    "metric_components": metric.components.tolist(),
                    "outer_horizon": 1.0 + np.sqrt(1.0 - a**2),
                    "inner_horizon": 1.0 - np.sqrt(1.0 - a**2),
                    "ergosphere": 2.0
                }
            })
            
    elif choice == "2":
        t = float(Prompt.ask("Enter time (s)", default="0.0"))
        r = float(Prompt.ask("Enter distance from source (m)", default="1e8"))
        theta = float(Prompt.ask("Enter theta coordinate (radians)", default="1.5708"))
        phi = float(Prompt.ask("Enter phi coordinate (radians)", default="0.0"))
        amplitude = float(Prompt.ask("Enter wave amplitude", default="1e-21"))
        frequency = float(Prompt.ask("Enter frequency (Hz)", default="100.0"))
        
        wave = grav_physics.gravitational_wave(t, r, theta, phi, amplitude, frequency)
        return create_physics_task("gravity", "gravitational_wave", {
            "coordinates": {"t": t, "r": r, "theta": theta, "phi": phi},
            "wave_parameters": {"amplitude": amplitude, "frequency": frequency},
            "result": {
                "wave_components": wave.components.tolist(),
                "strain_plus": wave.components[1][1],
                "strain_cross": wave.components[1][2]
            }
        })
        
    elif choice == "3":
        a = float(Prompt.ask("Enter semi-major axis (m)", default="1e8"))
        e = float(Prompt.ask("Enter eccentricity (0-1)", default="0.5"))
        M = float(Prompt.ask("Enter central mass (solar masses)", default="1.0"))
        M *= 1.989e30  # Convert to kg
        
        precession = grav_physics.orbit_precession(a, e, M)
        return create_physics_task("gravity", "orbital_dynamics", {
            "orbit_parameters": {"semi_major_axis": a, "eccentricity": e},
            "central_mass": M,
            "result": {
                "precession_per_orbit": precession,
                "precession_arcsec": precession * 206265,  # Convert to arcseconds
                "orbital_period": 2*np.pi*np.sqrt(a**3/(6.67430e-11*M))
            }
        })
        
    elif choice == "4":
        M = float(Prompt.ask("Enter black hole mass (solar masses)", default="10.0"))
        M *= 1.989e30  # Convert to kg
        a = float(Prompt.ask("Enter spin parameter (0-1)", default="0.0"))
        
        properties = grav_physics.event_horizon_properties(M, a)
        return create_physics_task("gravity", "event_horizon", {
            "mass": M,
            "spin": a,
            "result": properties
        })
        
    elif choice == "5":
        r = float(Prompt.ask("Enter distance from center (m)", default="1e6"))
        M = float(Prompt.ask("Enter mass (solar masses)", default="1.0"))
        M *= 1.989e30  # Convert to kg
        dr = float(Prompt.ask("Enter separation for tidal force (m)", default="1.0"))
        
        potential = grav_physics.gravitational_potential(r, M)
        tidal = grav_physics.tidal_force(r, M, dr)
        redshift = grav_physics.gravitational_redshift(r, M)
        
        return create_physics_task("gravity", "mass_distribution", {
            "distance": r,
            "mass": M,
            "separation": dr,
            "result": {
                "potential": potential,
                "tidal_force": tidal,
                "redshift": redshift,
                "escape_velocity": np.sqrt(-2*potential)
            }
        })
    
    return None

def show_complex_task_menu():
    """Display complex task builder menu"""
    menu = Table(show_header=True)
    menu.add_column("ID", style="cyan", justify="right")
    menu.add_column("Action", style="white")
    menu.add_column("Description", style="green")
    
    menu.add_row("1", "Create New Complex Task", "Build multi-step task workflow")
    menu.add_row("2", "Add Task Step", "Add step to existing task")
    menu.add_row("3", "Define Dependencies", "Set step dependencies")
    menu.add_row("4", "Set Temporal Constraints", "Add time-based constraints")
    menu.add_row("5", "Review Task Graph", "View dependency visualization")
    menu.add_row("6", "Generate Execution Plan", "Create detailed execution plan")
    
    console.print(Panel(menu, title="🔄 Complex Task Builder", border_style="blue"))
    choice = Prompt.ask("Select action", choices=["1", "2", "3", "4", "5", "6", "back"])
    
    if choice == "1":
        return build_complex_task()
    elif choice == "2":
        return add_task_step()
    elif choice == "3":
        return define_dependencies()
    elif choice == "4":
        return set_temporal_constraints()
    elif choice == "5":
        return review_task_graph()
    elif choice == "6":
        return generate_execution_plan()
    return None

def build_complex_task():
    """Interface for building complex multi-step tasks"""
    console.print("\n[bold cyan]Complex Task Builder[/bold cyan]")
    
    task_builder = ComplexTaskBuilder()
    
    # Initialize resource optimizer
    resource_pool = ResourcePool(
        cpu_cores=8,
        memory_gb=32.0,
        gpu_devices=2,
        quantum_qubits=5,
        network_bandwidth=1000.0
    )
    resource_optimizer = ResourceOptimizer(resource_pool)
    
    # Get basic task information
    task_name = Prompt.ask("Enter task name")
    description = Prompt.ask("Enter task description")
    
    while True:
        console.print("\n[bold]Add Task Step[/bold]")
        step_id = f"step_{len(task_builder.steps) + 1}"
        
        # Get step details
        step_type = Prompt.ask(
            "Step type",
            choices=[t.value for t in StepType] + ["done"]
        )
        
        if step_type.lower() == "done":
            break
            
        # Get step parameters based on type
        parameters = build_step_parameters(StepType(step_type))
        
        # Validate parameters
        if not StepValidator.validate_parameters(StepType(step_type), parameters):
            console.print("[red]Invalid parameters for step type[/red]")
            continue
        
        # Get step requirements
        requirements = build_step_requirements()
        
        # Add step to task
        task_builder.add_step(TaskStep(
            step_id=step_id,
            task_type=step_type,
            parameters=parameters,
            estimated_duration=requirements.estimated_duration,
            required_resources=resource_optimizer.optimize_allocation([{
                'id': step_id,
                'requirements': requirements.__dict__,
                'performance_goal': 'balanced'
            }])[step_id]
        ))
        
        # Handle dependencies
        if len(task_builder.steps) > 1:
            add_dependencies = Prompt.ask("Add dependencies?", choices=["y", "n"])
            if add_dependencies.lower() == "y":
                define_step_dependencies(task_builder, step_id)
    
    # Generate and validate execution plan
    try:
        execution_plan = task_builder.generate_execution_plan()
        console.print("[green]Task graph validated successfully![/green]")
        visualize_task_graph(task_builder)
        return execution_plan
    except ValueError as e:
        console.print(f"[red]Error in task graph: {str(e)}[/red]")
        return None

def build_step_parameters(step_type: StepType) -> Dict:
    """Build parameters based on step type"""
    # Implementation specific to each step type
    pass

def build_step_requirements() -> StepRequirements:
    """Get step requirements from user"""
    # Implementation to gather requirements
    pass

def define_step_dependencies(task_builder: ComplexTaskBuilder, step_id: str):
    """Enhanced dependency definition with conditions"""
    # Implementation of advanced dependency management
    pass

def visualize_task_graph(task_builder: ComplexTaskBuilder) -> None:
    """Visualize task dependency graph"""
    tree = Tree("🔄 Task Graph")
    
    for step_id, step in task_builder.steps.items():
        branch = tree.add(f"[cyan]{step_id}[/cyan]: {step.task_type}")
        
        # Add dependencies
        deps = [e for e in task_builder.dependency_graph.edges(data=True) if e[1] == step_id]
        if deps:
            dep_branch = branch.add("[yellow]Dependencies[/yellow]")
            for src, _, data in deps:
                dep_type = data.get('type', 'sequential')
                condition = data.get('condition', 'none')
                dep_branch.add(f"[green]{src}[/green] ({dep_type}, {condition})")
                
    console.print(tree)

def add_task_step():
    """Add a step to existing task"""
    step_type = Prompt.ask(
        "Step type",
        choices=["equation", "quantum", "numerical", "visualization"]
    )
    parameters = {}
    if step_type == "equation":
        parameters["equation"] = Prompt.ask("Enter equation")
    elif step_type == "quantum":
        parameters["num_qubits"] = int(Prompt.ask("Number of qubits", default="2"))
    # Add more step types as needed
    
    return create_physics_task(step_type, "step", parameters)

def define_dependencies():
    """Define dependencies between task steps"""
    source = Prompt.ask("Source step ID")
    target = Prompt.ask("Target step ID")
    dep_type = Prompt.ask(
        "Dependency type",
        choices=["sequential", "parallel", "conditional"]
    )
    
    dependency = {
        "source": source,
        "target": target,
        "type": dep_type
    }
    
    if dep_type == "conditional":
        dependency["condition"] = Prompt.ask("Enter condition")
    
    return dependency

def set_temporal_constraints():
    """Set temporal constraints for tasks"""
    step_id = Prompt.ask("Step ID")
    start_time = Prompt.ask("Start time (HH:MM)", default="00:00")
    duration = int(Prompt.ask("Duration (minutes)", default="30"))
    
    return {
        "step_id": step_id,
        "start_time": start_time,
        "duration": duration
    }

def review_task_graph():
    """Display task graph for review"""
    console.print("\n[bold cyan]Task Graph Review[/bold cyan]")
    # Implementation depends on your graph visualization needs
    return None

def generate_execution_plan():
    """Generate and display execution plan"""
    console.print("\n[bold cyan]Execution Plan[/bold cyan]")
    # Implementation depends on your execution planning needs
    return None

def show_welcome_screen():
    """Display welcome screen with system information"""
    title = Text()
    title.append("Welcome to ", style="bold cyan")
    title.append("ANF Apex", style="bold magenta")
    title.append("\nAdaptive Numerical Framework for Advanced Physics", style="cyan")

    features = Table.grid()
    features.add_column(style="cyan")
    features.add_row("• Ultra-Precise Hybrid Numerical Computations")
    features.add_row("• Quantum Computing Integration")
    features.add_row("• AI-Powered Algorithm Selection")
    features.add_row("• Advanced Task Management")
    features.add_row("• Hardware Acceleration Support")

    status = {
        "Quantum Backend": "[green]Connected[/green]",
        "GPU Acceleration": "[green]Available[/green]",
        "Precision Bits": "[cyan]256[/cyan]",
        "AI Optimization": "[green]Enabled[/green]"
    }

    status_table = Table.grid()
    status_table.add_column(style="bold cyan")
    status_table.add_column()
    for k, v in status.items():
        status_table.add_row(k + ":", v)

    console.print(Panel(title, border_style="cyan"))
    console.print(Panel(features, title="[bold cyan]Features", border_style="blue"))
    console.print(Panel(status_table, title="[bold cyan]System Status", border_style="green"))
    console.print()

def show_menu():
    """Display the main menu"""
    while True:
        console.print(Panel(
            "[bold cyan]Main Menu[/bold cyan]\n\n" +
            "1. Advanced Computations\n" +
            "2. Quick Task Entry\n" +
            "3. View Examples\n" +
            "4. System Status\n" +
            "5. Complex Task Management\n" +
            "6. Exit",
            border_style="cyan"
        ))
        choice = Prompt.ask("Select an option", choices=["1", "2", "3", "4", "5", "6"], default="6")

        if choice == "1":
            show_advanced_computation_menu()
        elif choice == "2":
            run_task_interactive()
        elif choice == "3":
            show_suggested_tasks()
        elif choice == "4":
            show_system_status()
        elif choice == "5":
            show_complex_task_menu()
        elif choice == "6":
            console.print("[bold yellow]Thank you for using ANF Apex. Goodbye![/bold yellow]")
            break

def show_advanced_computation_menu():
    """Display advanced computation options"""
    menu = Table(show_header=True)
    menu.add_column("ID", style="cyan", justify="right")
    menu.add_column("Category", style="white")
    menu.add_column("Description", style="green")
    
    menu.add_row("1", "Relativistic Mechanics", "Special & General Relativity")
    menu.add_row("2", "Quantum Mechanics", "Quantum Computations")
    menu.add_row("3", "Gravitational Physics", "Gravity & Fields")
    menu.add_row("4", "Complex Task Builder", "Multi-step Workflows")
    
    console.print(Panel(menu, title="🔬 Advanced Computations", border_style="blue"))
    choice = Prompt.ask("Select category", choices=["1", "2", "3", "4", "back"], default="back")
    
    if choice == "1":
        return show_relativistic_mechanics_menu()
    elif choice == "2":
        return show_quantum_mechanics_menu()
    elif choice == "3":
        return show_gravitational_physics_menu()
    elif choice == "4":
        return show_complex_task_menu()
    return None

def run_task_interactive():
    """Interactive task input and execution"""
    console.print("\n[bold cyan]Quick Task Entry[/bold cyan]")
    console.print("Enter task in JSON format or type 'help' for examples")
    
    while True:
        try:
            user_input = Prompt.ask("Task definition")
            if user_input.lower() == 'help':
                show_suggested_tasks()
                continue
            elif user_input.lower() == 'back':
                break
                
            try:
                task_def = json.loads(user_input)
                if not isinstance(task_def, dict):
                    raise ValueError("Input must be a dictionary")
                task = dsl_parser.parse(task_def)
                task_scheduler.schedule(task)
                console.print("[green]Task scheduled successfully![/green]")
                break
            except json.JSONDecodeError:
                console.print("[red]Value Error in input: Invalid JSON input[/red]")
            except ValueError as e:
                console.print(f"[red]Value Error in input: {str(e)}[/red]")
            except Exception as e:
                console.print(f"[red]Error: {str(e)}[/red]")
        except Exception as e:
            console.print(f"[red]Error: {str(e)}[/red]")

def show_suggested_tasks():
    """Display AI-suggested common tasks"""
    examples = ai_model.get_task_suggestions()
    
    menu = Table(show_header=True)
    menu.add_column("ID", style="cyan", justify="right")
    menu.add_column("Task Type", style="white")
    menu.add_column("Description", style="green")
    
    for i, example in enumerate(examples, 1):
        menu.add_row(str(i), example['type'], example['description'])
    
    console.print(Panel(menu, title="🤖 AI-Suggested Tasks", border_style="magenta"))

def show_system_status():
    """Display current system status"""
    status = Table(show_header=True)
    status.add_column("Component", style="cyan")
    status.add_column("Status", style="white")
    status.add_column("Details", style="green")
    
    # Get actual system metrics
    quantum_status = QuantumIntegration.check_backend_status()
    hardware_manager = HardwareResourceManager()
    resource_status = hardware_manager.get_status()
    
    status.add_row(
        "Quantum Backend",
        "[green]Connected[/green]" if quantum_status['connected'] else "[red]Disconnected[/red]",
        f"Available qubits: {quantum_status.get('qubits', 'N/A')}"
    )
    
    status.add_row(
        "Computing Resources",
        "[green]Available[/green]",
        f"CPU: {resource_status['cpu_usage']}%, RAM: {resource_status['memory_usage']}%"
    )
    
    status.add_row(
        "Task Queue",
        "[cyan]Active[/cyan]",
        f"Pending: {task_scheduler.get_queue_size()}"
    )
    
    console.print(Panel(status, title="🖥️ System Status", border_style="blue"))

def main():
    show_welcome_screen()
    show_menu()

if __name__ == "__main__":
    main()