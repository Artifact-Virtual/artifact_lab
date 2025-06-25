import unittest
import pytest
import numpy as np
from core.singleton_resource_manager import ResourceManager
from computational_core.numerical_algorithms import NumericalAlgorithms
from computational_core.numerical_representation import ArbitraryPrecisionFloat

class TestSystemIntegration(unittest.TestCase):
    """System integration tests for ANF"""
    
    def setUp(self):
        """Initialize test components"""
        self.na = NumericalAlgorithms(precision_bits=256)
        self.rm = ResourceManager()
        self.tol = 1e-10

    def test_basic_numerical_operations(self):
        """Test basic numerical algorithms"""
        # Root finding
        f = lambda x: x**2 - 2  # √2 calculation
        root = self.na.root_finding(f, 1.5)
        self.assertAlmostEqual(float(root**2), 2.0, places=10)

        # Integration
        f = lambda x: x**2
        integral = self.na.integrate(f, 0, 1)
        self.assertAlmostEqual(float(integral), 1/3, places=10)

        # Interpolation
        x = [1.0, 2.0, 3.0, 4.0]
        y = [1.0, 4.0, 9.0, 16.0]
        interp = self.na.interpolate(x, y)
        self.assertAlmostEqual(float(interp(2.5)), 6.25, places=8)

    def test_advanced_algorithms(self):
        """Test advanced numerical capabilities"""
        # Multi-dimensional integration
        f = lambda x, y: x**2 + y**2
        result = self.na.integrate_multi(f, [(0,1), (0,1)])
        self.assertAlmostEqual(float(result), 2/3, places=10)

        # ODE solver
        def ode(t, y): return -y  # y' = -y
        y0 = 1.0
        t_span = (0, 1)
        sol = self.na.solve_ode(ode, t_span, y0)
        self.assertAlmostEqual(float(sol(1)), np.exp(-1), places=10)

        # Special functions
        x = 2.0
        bessel = self.na.special_function("bessel_j", 0, x)
        self.assertAlmostEqual(float(bessel), 0.223891217, places=8)

    def test_statistical_methods(self):
        """Test statistical and Monte Carlo methods"""
        # Monte Carlo integration
        def f(x): return np.sin(x)
        result = self.na.monte_carlo_integrate(f, 0, np.pi, samples=10000)
        self.assertAlmostEqual(float(result), 2.0, places=2)

        # Statistical analysis
        data = [1.0, 2.0, 3.0, 4.0, 5.0]
        stats = self.na.compute_statistics(data)
        self.assertAlmostEqual(stats['mean'], 3.0)
        self.assertAlmostEqual(stats['std'], np.sqrt(2.0), places=8)

    def test_error_handling(self):
        """Test error handling and validation"""
        with self.assertRaises(ValueError):
            self.na.root_finding(lambda x: x, 1.0, method='invalid')
        
        with self.assertRaises(ValueError):
            self.na.integrate(lambda x: x, 1.0, 0.0)  # Invalid interval

        with self.assertRaises(ValueError):
            self.na.interpolate([1.0], [1.0], method='cubic_spline')  # Not enough points

    def test_precision_control(self):
        """Test arbitrary precision capabilities"""
        # High precision calculation
        f = lambda x: x**2 - 2
        root = self.na.root_finding(f, 1.5)
        self.assertTrue(abs(float(root**2) - 2.0) < 1e-50)

        # Precision maintenance in operations
        x = ArbitraryPrecisionFloat("1.23456789123456789", 256)
        y = ArbitraryPrecisionFloat("2.34567891234567891", 256)
        result = self.na.high_precision_operation(x, y, operation='multiply')
        self.assertEqual(self.na.get_precision(result), 256)

if __name__ == '__main__':
    unittest.main()
