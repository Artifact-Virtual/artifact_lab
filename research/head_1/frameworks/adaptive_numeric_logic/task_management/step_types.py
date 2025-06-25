from enum import Enum
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import timedelta

class StepType(Enum):
    EQUATION = "equation"
    QUANTUM = "quantum"
    NUMERICAL = "numerical"
    VISUALIZATION = "visualization"
    DATA_PROCESSING = "data_processing"
    OPTIMIZATION = "optimization"
    TENSOR = "tensor"
    MACHINE_LEARNING = "ml"
    MONTE_CARLO = "monte_carlo"
    CUSTOM = "custom"

@dataclass
class StepRequirements:
    compute_intensity: str  # "low", "medium", "high"
    memory_requirement: str  # "low", "medium", "high"
    gpu_required: bool
    quantum_required: bool
    precision_bits: int
    estimated_duration: timedelta
    priority: int

class StepValidator:
    @staticmethod
    def validate_parameters(step_type: StepType, parameters: Dict[str, Any]) -> bool:
        validators = {
            StepType.EQUATION: StepValidator._validate_equation_params,
            StepType.QUANTUM: StepValidator._validate_quantum_params,
            # Add validators for other step types
        }
        validator = validators.get(step_type, lambda x: True)
        return validator(parameters)

    @staticmethod
    def _validate_equation_params(params: Dict[str, Any]) -> bool:
        required = {"equation_type", "variables", "constraints"}
        return all(key in params for key in required)
