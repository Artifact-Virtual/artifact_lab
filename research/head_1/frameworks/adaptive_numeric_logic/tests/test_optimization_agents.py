import unittest
from intelligent_optimization.optimization_agents import AlgorithmSelectionAgent, ResourceAllocationAgent
from ui_task_definition.task_object import TaskObject

class TestAlgorithmSelectionAgent(unittest.TestCase):
    def test_select_algorithm(self):
        agent = AlgorithmSelectionAgent()
        task = TaskObject(task_id="task_1", description="Optimization task", parameters={}, precision="high", arbitrary_precision_level=64)
        agent.select_algorithm(task)  # Ensure no exceptions are raised

class TestResourceAllocationAgent(unittest.TestCase):
    def test_allocate_resources(self):
        agent = ResourceAllocationAgent()
        task = TaskObject(task_id="task_2", description="Resource allocation task", parameters={}, performance_goals="fast")
        agent.allocate_resources(task)  # Ensure no exceptions are raised

if __name__ == "__main__":
    unittest.main()