from typing import Dict, Any, Optional
import threading
from ui_task_definition.dsl_parser import DSLParser
from intelligent_optimization.optimization_agents import AlgorithmSelectionAgent
from control_orchestration.task_management import TaskScheduler
from control_orchestration.resource_manager import HardwareResourceManager
from computational_core.quantum_computing import QuantumIntegration 
from anf.core import (
    HybridNumericalRepresentation,
    AdaptiveAlgorithm,
    HardwareAccelerator,
    AIOptimizer,
    DataManager
)

class ResourceManager:
    _instance = None
    _instances: Dict[str, 'ResourceManager'] = {}
    _lock = threading.Lock()
    
    @classmethod
    def get_instance(cls, instance_name: str = "default") -> 'ResourceManager':
        """Get a specific named instance or create if not exists"""
        with cls._lock:
            if instance_name not in cls._instances:
                cls._instances[instance_name] = super(ResourceManager, cls).__new__(cls)
                cls._instances[instance_name]._initialized = False
                cls._instances[instance_name]._init_instance(instance_name)
            return cls._instances[instance_name]
    
    @classmethod
    def create_new_instance(cls, instance_name: str) -> 'ResourceManager':
        """Force creation of a new instance, overriding any existing one"""
        with cls._lock:
            instance = super(ResourceManager, cls).__new__(cls)
            instance._initialized = False
            instance._init_instance(instance_name)
            cls._instances[instance_name] = instance
            return instance

    def _init_instance(self, instance_name: str):
        """Initialize a specific instance"""
        if self._initialized:
            return
        self._resources: Dict[str, Any] = {}
        self._instance_name = instance_name
        self._initialized = True

    def __new__(cls):
        """Maintain backward compatibility with singleton pattern"""
        return cls.get_instance("default")

    def __init__(self):
        if self._initialized:
            return
            
        # Initialize resource holders
        self._resources: Dict[str, Any] = {}
        self._initialized = True

    def get_resource(self, resource_name: str) -> Any:
        """Get or lazily initialize a resource"""
        if resource_name not in self._resources:
            with self._lock:
                if resource_name not in self._resources:
                    self._resources[resource_name] = self._initialize_resource(resource_name)
        return self._resources[resource_name]

    def _initialize_resource(self, resource_name: str) -> Any:
        """Lazy initialization of resources"""
        initializers = {
            'dsl_parser': lambda: DSLParser(),
            'scheduler': lambda: TaskScheduler(),
            'resource_manager': lambda: HardwareResourceManager(),
            'num_rep': lambda: HybridNumericalRepresentation(),
            'algorithm': lambda: AdaptiveAlgorithm(),
            'accelerator': lambda: HardwareAccelerator(),
            'optimizer': lambda: AIOptimizer(),
            'data_mgr': lambda: DataManager(),
            'quantum_integration': lambda: QuantumIntegration(quantum_backend="simulator"),
            'algorithm_agent': lambda: AlgorithmSelectionAgent()
        }
        
        initializer = initializers.get(resource_name)
        if initializer:
            return initializer()
        raise KeyError(f"Unknown resource: {resource_name}")

    def cleanup(self):
        """Cleanup resources when needed"""
        with self._lock:
            for resource in self._resources.values():
                if hasattr(resource, 'cleanup'):
                    resource.cleanup()
            self._resources.clear()

    @classmethod
    def cleanup_instance(cls, instance_name: str):
        """Cleanup a specific instance"""
        with cls._lock:
            if instance_name in cls._instances:
                cls._instances[instance_name].cleanup()
                del cls._instances[instance_name]

    @classmethod
    def cleanup_all(cls):
        """Cleanup all instances"""
        with cls._lock:
            instance_names = list(cls._instances.keys())
            for name in instance_names:
                cls.cleanup_instance(name)

    def __del__(self):
        """Ensure cleanup on deletion"""
        self.cleanup()
