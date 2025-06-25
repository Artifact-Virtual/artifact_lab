import unittest
from computational_core.quantum_computing import QuantumIntegration
from ui_task_definition.task_object import TaskObject

class TestQuantumIntegration(unittest.TestCase):
    def test_execute_quantum_task(self):
        quantum = QuantumIntegration(quantum_backend="backend1")
        task = TaskObject(task_id="task_1", description="Quantum task", parameters={})
        quantum.execute_quantum_task(task)  # Ensure no exceptions are raised

    def test_execute_symbolic_quantum_task(self):
        quantum = QuantumIntegration(quantum_backend="backend1")
        task = TaskObject(task_id="task_2", description="Symbolic quantum task", parameters={})
        quantum.execute_symbolic_quantum_task("x * y", task)  # Ensure no exceptions are raised

if __name__ == "__main__":
    unittest.main()