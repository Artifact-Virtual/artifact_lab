import unittest
from control_orchestration.task_management import TaskScheduler
from control_orchestration.resource_manager import HardwareResourceManager
from ui_task_definition.task_object import TaskObject

class TestTaskScheduler(unittest.TestCase):
    def test_schedule(self):
        scheduler = TaskScheduler()
        task = TaskObject(task_id="task_1", description="Scheduling task", parameters={}, priority="high")
        scheduler.schedule(task)  # Ensure no exceptions are raised

class TestHardwareResourceManager(unittest.TestCase):
    def test_allocate(self):
        manager = HardwareResourceManager()
        task = TaskObject(task_id="task_2", description="Resource allocation task", parameters={}, performance_goals="fast")
        manager.allocate(task)  # Ensure no exceptions are raised

    def test_deallocate(self):
        manager = HardwareResourceManager()
        task = TaskObject(task_id="task_3", description="Resource deallocation task", parameters={})
        manager.deallocate(task)  # Ensure no exceptions are raised

if __name__ == "__main__":
    unittest.main()