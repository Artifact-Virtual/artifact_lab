import pytest
import numpy as np
from computational_core.numerical_algorithms import NumericalAlgorithms
from computational_core.numerical_representation import ArbitraryPrecisionFloat

@pytest.fixture
def test_config():
    return {
        "precision_bits": 256,
        "quantum_backend": "simulator",
        "gpu_enabled": True,
        "ai_optimization": True
    }

@pytest.fixture
def test_problem():
    return {
        "type": "quantum_simulation",
        "dimensions": 3,
        "precision_required": 128,
        "max_runtime": 3600
    }

@pytest.fixture
def numerical_algorithms():
    """Fixture providing numerical algorithms instance"""
    return NumericalAlgorithms(precision_bits=256)

@pytest.fixture
def test_functions():
    """Fixture providing test functions"""
    return {
        'polynomial': lambda x: x**2 - 4,
        'trig': lambda x: np.sin(float(x)),
        'rational': lambda x: 1/(1 + float(x)**2),
    }

@pytest.fixture
def test_data():
    """Fixture providing test data"""
    return {
        'x': [float(i) for i in range(5)],
        'y': [float(i**2) for i in range(5)],
        'precision': 256,
        'tol': 1e-10
    }

@pytest.fixture
def test_matrices():
    """Fixture providing test matrices of different dimensions"""
    return {
        'small': np.array([[1, 2], [3, 4]]),
        'medium': np.random.rand(5, 5),
        'tensor': np.random.rand(2, 3, 4),
        'genetic': np.array(list('ATCG')),
        'quantum': np.array([0.707, 0.707j])  # |+⟩ state
    }

@pytest.fixture
def base_conversion_cases():
    """Fixture providing test cases for base conversion"""
    return [
        ('1234', 10, 2),
        ('FF', 16, 10),
        ('1010', 2, 8),
        ('ATCG', 'genetic', 2),
        ('0.707,0.707j', 'quantum', 2)
    ]
