import unittest
from ui_task_definition.task_object import TaskObject

class TestTaskObject(unittest.TestCase):
    def test_initialization(self):
        task = TaskObject(
            task_id="task_1",
            description="Test task",
            parameters={"param1": "value1"},
            priority="high",
            performance_goals="fast",
            precision="double",
            tensor_representation="tensor_1",
            quantum_integration="quantum_1",
            symbolic_computation=True,
            spinor_representation="spinor_1",
            arbitrary_precision_level=100
        )

        self.assertEqual(task.task_id, "task_1")
        self.assertEqual(task.description, "Test task")
        self.assertEqual(task.parameters, {"param1": "value1"})
        self.assertEqual(task.priority, "high")
        self.assertEqual(task.performance_goals, "fast")
        self.assertEqual(task.precision, "double")
        self.assertEqual(task.tensor_representation, "tensor_1")
        self.assertEqual(task.quantum_integration, "quantum_1")
        self.assertTrue(task.symbolic_computation)
        self.assertEqual(task.spinor_representation, "spinor_1")
        self.assertEqual(task.arbitrary_precision_level, 100)

    def test_to_dict(self):
        task = TaskObject(
            task_id="task_2",
            description="Another test task",
            parameters={"param2": "value2"}
        )

        expected_dict = {
            "task_id": "task_2",
            "description": "Another test task",
            "parameters": {"param2": "value2"},
            "priority": None,
            "performance_goals": None,
            "precision": None,
            "tensor_representation": None,
            "quantum_integration": None,
            "symbolic_computation": None,
            "spinor_representation": None,
            "arbitrary_precision_level": None,
        }

        self.assertEqual(task.to_dict(), expected_dict)

if __name__ == "__main__":
    unittest.main()