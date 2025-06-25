from enum import Enum
from typing import Dict, List, Optional
from datetime import datetime
import threading
import queue

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SUSPENDED = "suspended"

class TaskScheduler:
    def __init__(self):
        self.task_queue = queue.PriorityQueue()
        self.active_tasks: Dict[str, dict] = {}
        self.task_history: List[dict] = []
        self._lock = threading.Lock()

    def schedule(self, task_object) -> bool:
        task_priority = self._calculate_priority(task_object)
        task_info = {
            'task_id': task_object.task_id,
            'priority': task_priority,
            'status': TaskStatus.PENDING,
            'created_at': datetime.now(),
            'started_at': None,
            'completed_at': None,
            'resources': None,
            'performance_metrics': {}
        }

        try:
            with self._lock:
                self.task_queue.put((-task_priority, task_info))
                self.active_tasks[task_object.task_id] = task_info
            return True
        except Exception as e:
            print(f"Error scheduling task {task_object.task_id}: {str(e)}")
            return False

    def _calculate_priority(self, task_object) -> int:
        base_priority = {
            'high': 100,
            'medium': 50,
            'low': 10
        }.get(task_object.priority, 50)

        if task_object.quantum_integration:
            base_priority += 20
        if task_object.arbitrary_precision_level and task_object.arbitrary_precision_level > 64:
            base_priority += 10
        if task_object.performance_goals == 'speed_optimized':
            base_priority += 15

        return base_priority

    def get_next_task(self) -> Optional[dict]:
        try:
            if not self.task_queue.empty():
                with self._lock:
                    _, task_info = self.task_queue.get()
                    task_info['status'] = TaskStatus.RUNNING
                    task_info['started_at'] = datetime.now()
                    return task_info
        except queue.Empty:
            return None
        return None

    def update_task_status(self, task_id: str, status: TaskStatus, metrics: Dict = None):
        with self._lock:
            if task_id in self.active_tasks:
                self.active_tasks[task_id]['status'] = status
                if metrics:
                    self.active_tasks[task_id]['performance_metrics'].update(metrics)
                if status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                    self.active_tasks[task_id]['completed_at'] = datetime.now()
                    self.task_history.append(self.active_tasks[task_id])
                    del self.active_tasks[task_id]

    def get_queue_size(self) -> int:
        """Get the current size of the task queue"""
        return self.task_queue.qsize()

    def get_active_tasks_count(self) -> int:
        """Get number of currently active tasks"""
        return len(self.active_tasks)
    
    def get_task_history_count(self) -> int:
        """Get number of completed tasks"""
        return len(self.task_history)

class TaskMonitoring:
    def __init__(self):
        self.monitored_tasks: Dict[str, Dict] = {}
        self._lock = threading.Lock()

    def monitor(self, task_id: str) -> Dict:
        with self._lock:
            if task_id not in self.monitored_tasks:
                self.monitored_tasks[task_id] = {
                    'start_time': datetime.now(),
                    'last_check': datetime.now(),
                    'status_history': [],
                    'resource_usage': [],
                    'performance_metrics': {}
                }
            return self.monitored_tasks[task_id]

    def update_metrics(self, task_id: str, metrics: Dict):
        with self._lock:
            if task_id in self.monitored_tasks:
                self.monitored_tasks[task_id]['last_check'] = datetime.now()
                self.monitored_tasks[task_id]['performance_metrics'].update(metrics)
                self.monitored_tasks[task_id]['resource_usage'].append({
                    'timestamp': datetime.now(),
                    **metrics
                })

    def get_task_metrics(self, task_id: str) -> Optional[Dict]:
        with self._lock:
            return self.monitored_tasks.get(task_id)

    def cleanup_task(self, task_id: str):
        with self._lock:
            if task_id in self.monitored_tasks:
                del self.monitored_tasks[task_id]