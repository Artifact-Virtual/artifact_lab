import unittest
import pytest
import numpy as np
from computational_core.tensor_spinor import TensorRepresentation, SpinorRepresentation, validate_tensor_input

class TestTensorRepresentation(unittest.TestCase):
    def test_contract(self):
        tensor1 = TensorRepresentation(dimensions=(2, 2))
        tensor2 = TensorRepresentation(dimensions=(2, 2))
        tensor1.contract(tensor2)  # Ensure no exceptions are raised

    def test_symbolic_transform(self):
        tensor = TensorRepresentation(dimensions=(2, 2))
        tensor.symbolic_transform("x + y")  # Ensure no exceptions are raised

class TestSpinorRepresentation(unittest.TestCase):
    def test_transform(self):
        spinor = SpinorRepresentation(spinor_type="type1")
        spinor.transform([[1, 0], [0, 1]])  # Ensure no exceptions are raised

    def test_spinor_symbolic_transform(self):
        spinor = SpinorRepresentation(spinor_type="type1")
        spinor.spinor_symbolic_transform("a * b")  # Ensure no exceptions are raised

def test_validate_tensor_input():
    """Test tensor component input validation"""
    # Test valid inputs
    assert validate_tensor_input("1.0") == 1.0
    assert validate_tensor_input("-2.5") == -2.5
    assert validate_tensor_input("1e-3") == 0.001
    assert validate_tensor_input(" 3.14 ") == 3.14
    
    # Test invalid inputs
    with pytest.raises(ValueError):
        validate_tensor_input("abc")
    with pytest.raises(ValueError):
        validate_tensor_input("2.5.6")
    with pytest.raises(ValueError):
        validate_tensor_input("")

def test_tensor_creation():
    """Test tensor creation and validation"""
    # Test valid tensor creation
    tensor = TensorRepresentation((2, 2))
    assert tensor.rank == 2
    assert tensor.dimensions == (2, 2)
    
    # Test symmetric tensor
    symmetric_tensor = TensorRepresentation((3, 3), symmetry="symmetric")
    components = np.array([[1, 2, 3], [2, 4, 5], [3, 5, 6]])
    symmetric_tensor.set_components(components)
    assert np.allclose(symmetric_tensor.components, components)
    
    # Test invalid dimensions
    with pytest.raises(ValueError):
        tensor.set_components(np.zeros((3, 3)))
    
    # Test symmetry enforcement
    with pytest.raises(ValueError):
        asymmetric = np.array([[1, 2], [3, 4]])
        symmetric_tensor = TensorRepresentation((2, 2), symmetry="symmetric")
        symmetric_tensor.set_components(asymmetric)

def test_metric_validation():
    """Test metric tensor validation"""
    # Test valid Minkowski metric
    metric = TensorRepresentation((4, 4), symmetry="symmetric")
    minkowski = np.diag([-1, 1, 1, 1])
    metric.set_components(minkowski)
    assert metric.validate_metric_signature(minkowski)
    
    # Test invalid metric signature
    invalid_metric = np.diag([1, 1, 1, 1])
    assert not metric.validate_metric_signature(invalid_metric)
    
    # Test degenerate metric
    with pytest.raises(np.linalg.LinAlgError):
        singular = np.zeros((4, 4))
        metric.set_components(singular)

def test_tensor_operations():
    """Test tensor operations"""
    # Test contraction
    t1 = TensorRepresentation((2, 3))
    t2 = TensorRepresentation((3, 2))
    
    components1 = np.array([[1, 2, 3], [4, 5, 6]])
    components2 = np.array([[7, 8], [9, 10], [11, 12]])
    
    t1.set_components(components1)
    t2.set_components(components2)
    
    result = t1.contract(t2)
    expected = np.dot(components1, components2)
    assert np.allclose(result.components, expected)
    
    # Test invalid contraction
    t3 = TensorRepresentation((2, 4))
    t3.set_components(np.zeros((2, 4)))
    with pytest.raises(ValueError):
        t1.contract(t3)

def test_christoffel_computation():
    """Test Christoffel symbols computation"""
    # Test flat spacetime (should give zero Christoffel symbols)
    metric = TensorRepresentation((4, 4), symmetry="symmetric")
    minkowski = np.diag([-1, 1, 1, 1])
    metric.set_components(minkowski)
    
    christoffel = metric.compute_christoffel_symbols(metric)
    assert np.allclose(christoffel.components, np.zeros((4, 4, 4)))
    
    # Test invalid input
    invalid_metric = TensorRepresentation((3, 4))  # Non-square metric
    with pytest.raises(ValueError):
        invalid_metric.compute_christoffel_symbols(metric)

def test_riemann_computation():
    """Test Riemann tensor computation"""
    # Test flat spacetime (should give zero Riemann tensor)
    metric = TensorRepresentation((4, 4), symmetry="symmetric")
    minkowski = np.diag([-1, 1, 1, 1])
    metric.set_components(minkowski)
    
    christoffel = metric.compute_christoffel_symbols(metric)
    riemann = metric.compute_riemann_tensor(christoffel)
    assert np.allclose(riemann.components, np.zeros((4, 4, 4, 4)))
    
    # Test invalid input
    invalid_christoffel = TensorRepresentation((4, 4))  # Wrong rank
    with pytest.raises(ValueError):
        metric.compute_riemann_tensor(invalid_christoffel)

def test_ricci_computation():
    """Test Ricci tensor computation"""
    # Test flat spacetime (should give zero Ricci tensor)
    metric = TensorRepresentation((4, 4), symmetry="symmetric")
    minkowski = np.diag([-1, 1, 1, 1])
    metric.set_components(minkowski)
    
    christoffel = metric.compute_christoffel_symbols(metric)
    riemann = metric.compute_riemann_tensor(christoffel)
    ricci = metric.compute_ricci_tensor(riemann)
    assert np.allclose(ricci.components, np.zeros((4, 4)))
    
    # Test invalid input
    invalid_riemann = TensorRepresentation((4, 4))  # Wrong rank
    with pytest.raises(ValueError):
        metric.compute_ricci_tensor(invalid_riemann)

def test_ricci_scalar():
    """Test Ricci scalar computation"""
    # Test flat spacetime (should give zero Ricci scalar)
    metric = TensorRepresentation((4, 4), symmetry="symmetric")
    minkowski = np.diag([-1, 1, 1, 1])
    metric.set_components(minkowski)
    
    christoffel = metric.compute_christoffel_symbols(metric)
    riemann = metric.compute_riemann_tensor(christoffel)
    ricci = metric.compute_ricci_tensor(riemann)
    scalar = metric.compute_ricci_scalar(ricci, metric)
    assert np.isclose(scalar, 0.0)
    
    # Test invalid input
    invalid_ricci = TensorRepresentation((3, 4))  # Non-square tensor
    with pytest.raises(ValueError):
        metric.compute_ricci_scalar(invalid_ricci, metric)

if __name__ == "__main__":
    unittest.main()