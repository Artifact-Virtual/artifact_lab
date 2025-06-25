from typing import Dict, List, Optional
import numpy as np
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class ResourcePool:
    cpu_cores: int
    memory_gb: float
    gpu_devices: int
    quantum_qubits: int
    network_bandwidth: float

class ResourceOptimizer:
    def __init__(self, resource_pool: ResourcePool):
        self.resource_pool = resource_pool
        self.allocated_resources = {}
        self.resource_history = []

    def optimize_allocation(self, tasks: List[Dict]) -> Dict[str, Dict]:
        """Optimize resource allocation across multiple tasks"""
        # Sort tasks by priority and dependencies
        sorted_tasks = self._sort_tasks_by_priority(tasks)
        
        # Calculate optimal allocation
        allocation = {}
        for task in sorted_tasks:
            resources = self._calculate_optimal_resources(task)
            allocation[task['id']] = resources
            
        return allocation

    def _calculate_optimal_resources(self, task: Dict) -> Dict:
        """Calculate optimal resource allocation for a single task"""
        requirements = task.get('requirements', {})
        performance_goal = task.get('performance_goal', 'balanced')
        
        # Base allocation
        allocation = {
            'cpu_cores': self._calculate_cpu_needs(requirements),
            'memory_gb': self._calculate_memory_needs(requirements),
            'gpu_devices': self._calculate_gpu_needs(requirements),
            'quantum_qubits': self._calculate_quantum_needs(requirements)
        }
        
        # Apply performance optimization
        allocation = self._optimize_for_performance(allocation, performance_goal)
        
        return allocation

    def _optimize_for_performance(self, allocation: Dict, goal: str) -> Dict:
        """Optimize resource allocation based on performance goal"""
        if goal == 'speed':
            allocation['cpu_cores'] *= 1.5
            allocation['gpu_devices'] = max(1, allocation['gpu_devices'])
        elif goal == 'memory':
            allocation['memory_gb'] *= 1.3
            allocation['cpu_cores'] *= 0.8
        elif goal == 'efficiency':
            allocation['cpu_cores'] *= 0.7
            allocation['memory_gb'] *= 0.8
            
        return self._normalize_allocation(allocation)

    def _normalize_allocation(self, allocation: Dict) -> Dict:
        """Ensure allocation doesn't exceed pool resources"""
        total_allocated = sum(self.allocated_resources.values())
        available = {
            'cpu_cores': self.resource_pool.cpu_cores - total_allocated['cpu_cores'],
            'memory_gb': self.resource_pool.memory_gb - total_allocated['memory_gb'],
            'gpu_devices': self.resource_pool.gpu_devices - total_allocated['gpu_devices'],
            'quantum_qubits': self.resource_pool.quantum_qubits - total_allocated['quantum_qubits']
        }
        
        # Scale down if necessary
        scale_factor = min(
            available[k] / v for k, v in allocation.items() if v > 0
        )
        
        if scale_factor < 1:
            return {k: v * scale_factor for k, v in allocation.items()}
        return allocation
