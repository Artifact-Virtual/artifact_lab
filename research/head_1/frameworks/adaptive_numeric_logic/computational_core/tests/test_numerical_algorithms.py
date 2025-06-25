import unittest
import numpy as np
from ..numerical_algorithms import NumericalAlgorithms
from ..numerical_representation import ArbitraryPrecisionFloat

class TestNumericalAlgorithms(unittest.TestCase):
    """System tests for numerical algorithms with arbitrary precision"""
    
    def setUp(self):
        self.na = NumericalAlgorithms(precision_bits=256)
        self.tol = 1e-10

    # Root Finding Tests
    def test_root_finding_methods(self):
        """Test all root finding methods with different functions"""
        # Test function: x^2 - 4
        f1 = lambda x: x**2 - 4
        # Test function: cos(x) - x
        f2 = lambda x: np.cos(float(x)) - float(x)
        
        methods = ['newton', 'bisection', 'secant']
        expected_roots = {
            f1: [2.0, -2.0],
            f2: [0.739085133215]
        }
        
        for f, roots in expected_roots.items():
            for method in methods:
                root = float(self.na.root_finding(f, 1.0, method=method))
                self.assertTrue(any(abs(root - r) < self.tol for r in roots))

    # Integration Tests
    def test_integration_methods(self):
        """Test all integration methods with various functions"""
        # Test function: x^2
        f1 = lambda x: x**2
        # Test function: sin(x)
        f2 = lambda x: np.sin(float(x))
        
        test_cases = [
            (f1, 0, 1, 1/3),  # ∫x^2 dx from 0 to 1 = 1/3
            (f2, 0, np.pi, 2.0)  # ∫sin(x) dx from 0 to π = 2
        ]
        
        methods = ['adaptive_quadrature', 'simpson', 'trapezoidal']
        for f, a, b, expected in test_cases:
            for method in methods:
                result = float(self.na.integrate(f, a, b, method=method))
                self.assertAlmostEqual(result, expected, places=8)

    # Interpolation Tests
    def test_interpolation_methods(self):
        """Test all interpolation methods with different datasets"""
        # Test data: x^2 function
        x = [float(i) for i in range(5)]
        y = [x_i**2 for x_i in x]
        
        test_points = [1.5, 2.5, 3.5]
        expected = [p**2 for p in test_points]
        
        methods = ['cubic_spline', 'linear', 'polynomial']
        for method in methods:
            interp = self.na.interpolate(x, y, method=method)
            for x_test, y_expected in zip(test_points, expected):
                y_interp = float(interp(x_test))
                self.assertAlmostEqual(y_interp, y_expected, places=6)

    def test_error_estimation(self):
        """Test error estimation capabilities"""
        # Test root finding error
        f = lambda x: x**2 - 4
        root = self.na.root_finding(f, 3.0)
        error = self.na._compute_error_estimate(f, root, ArbitraryPrecisionFloat("1e-10", 256))
        self.assertLess(error, self.tol)

    def test_arbitrary_precision(self):
        """Test arbitrary precision capabilities"""
        # Test high-precision root finding
        f = lambda x: x**2 - 2  # √2 calculation
        root = self.na.root_finding(f, 1.5)
        # Check more digits than standard double precision
        self.assertAlmostEqual(float(root**2), 2.0, places=50)

    def test_edge_cases(self):
        """Test edge cases and error handling"""
        # Test invalid intervals
        with self.assertRaises(ValueError):
            self.na.integrate(lambda x: x, 1, 0)  # Invalid interval
        
        # Test singular functions
        f_singular = lambda x: 1/x
        with self.assertRaises(RuntimeError):
            self.na.root_finding(f_singular, 0.1)

    def test_interpolation_constraints(self):
        """Test interpolation with constraints"""
        x = [1.0, 2.0, 3.0, 4.0]
        y = [1.0, 4.0, 9.0, 16.0]
        
        # Test outside domain
        interp = self.na.interpolate(x, y, method='cubic_spline')
        with self.assertRaises(ValueError):
            interp(0.0)  # Point outside range
        with self.assertRaises(ValueError):
            interp(5.0)  # Point outside range

if __name__ == '__main__':
    unittest.main()
