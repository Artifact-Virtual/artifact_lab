from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import networkx as nx

@dataclass
class TaskDependency:
    source_id: str
    target_id: str
    dependency_type: str  # "sequential", "parallel", "conditional"
    condition: Optional[str] = None

@dataclass
class TaskStep:
    step_id: str
    task_type: str
    parameters: Dict
    estimated_duration: timedelta
    required_resources: Dict
    success_criteria: Optional[Dict] = None

class ComplexTaskBuilder:
    """Builds and manages complex multi-step tasks with dependencies"""
    
    def __init__(self):
        self.dependency_graph = nx.DiGraph()
        self.steps: Dict[str, TaskStep] = {}
        self.temporal_constraints = {}
        
    def add_step(self, step: TaskStep) -> None:
        """Add a task step to the complex task"""
        self.steps[step.step_id] = step
        self.dependency_graph.add_node(step.step_id)
        
    def add_dependency(self, dependency: TaskDependency) -> None:
        """Add a dependency between task steps"""
        if dependency.condition:
            self.dependency_graph.add_edge(
                dependency.source_id,
                dependency.target_id,
                type=dependency.dependency_type,
                condition=dependency.condition
            )
        else:
            self.dependency_graph.add_edge(
                dependency.source_id,
                dependency.target_id,
                type=dependency.dependency_type
            )
            
    def validate_task_graph(self) -> bool:
        """Validate the task dependency graph"""
        # Check for cycles
        if not nx.is_directed_acyclic_graph(self.dependency_graph):
            raise ValueError("Task graph contains cycles")
            
        # Validate all dependencies
        for edge in self.dependency_graph.edges(data=True):
            source, target, data = edge
            if source not in self.steps or target not in self.steps:
                raise ValueError(f"Invalid dependency between {source} and {target}")
                
        return True
        
    def estimate_critical_path(self) -> List[str]:
        """Calculate critical path through task graph"""
        return nx.dag_longest_path(self.dependency_graph)
        
    def generate_execution_plan(self) -> Dict:
        """Generate complete execution plan for complex task"""
        self.validate_task_graph()
        return {
            "steps": self.steps,
            "dependencies": [
                {
                    "source": s,
                    "target": t,
                    **self.dependency_graph.edges[s, t]
                }
                for s, t in self.dependency_graph.edges()
            ],
            "critical_path": self.estimate_critical_path(),
            "estimated_duration": sum(
                self.steps[step].estimated_duration 
                for step in self.estimate_critical_path()
            )
        }
