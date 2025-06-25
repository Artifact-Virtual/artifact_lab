from typing import Callable, Dict, List
from enum import Enum
import operator
from datetime import datetime, timedelta

class DependencyType(Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    CONDITIONAL = "conditional"
    TEMPORAL = "temporal"
    DATA = "data"
    RESOURCE = "resource"

class DependencyCondition:
    def __init__(self, condition_type: str, parameters: Dict):
        self.condition_type = condition_type
        self.parameters = parameters
        self._condition_funcs = {
            "output_equals": operator.eq,
            "output_greater": operator.gt,
            "output_less": operator.lt,
            "resource_available": self._check_resource_availability,
            "time_window": self._check_time_window,
            "data_quality": self._check_data_quality
        }

    def evaluate(self, context: Dict) -> bool:
        func = self._condition_funcs.get(self.condition_type)
        if not func:
            raise ValueError(f"Unknown condition type: {self.condition_type}")
        return func(context, self.parameters)

    def _check_resource_availability(self, context: Dict, params: Dict) -> bool:
        required = params.get("required_resources", {})
        available = context.get("available_resources", {})
        return all(available.get(r, 0) >= v for r, v in required.items())

    def _check_time_window(self, context: Dict, params: Dict) -> bool:
        current_time = context.get("current_time", datetime.now())
        start_time = params.get("start_time")
        end_time = params.get("end_time")
        return start_time <= current_time <= end_time if start_time and end_time else True

    def _check_data_quality(self, context: Dict, params: Dict) -> bool:
        data_metrics = context.get("data_metrics", {})
        required_quality = params.get("minimum_quality", 0.0)
        return data_metrics.get("quality_score", 0.0) >= required_quality
