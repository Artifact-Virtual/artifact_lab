import pytest
import numpy as np
from computational_core.mathematical_framework import MathematicalFramework
from sympy import Symbol, diff, integrate, exp

class TestMathematicalFramework:
    @pytest.fixture
    def math_framework(self):
        return MathematicalFramework(precision_bits=256)
    
    def test_coordinate_systems(self, math_framework):
        """Test coordinate system transformations and metrics"""
        # Test Cartesian metric (should be identity)
        cartesian_metric = math_framework.coordinate_systems['cartesian']['metric'](1, 1, 1)
        assert np.allclose(cartesian_metric, np.eye(3))
        
        # Test spherical metric components
        r, theta = 2.0, np.pi/4
        spherical_metric = math_framework.coordinate_systems['spherical']['metric'](r, theta, 0)
        expected = np.diag([1, r**2, r**2 * np.sin(theta)**2])
        assert np.allclose(spherical_metric, expected)
        
        # Test coordinate Jacobians
        spherical_jacobian = math_framework._spherical_jacobian(r, theta, 0)
        assert spherical_jacobian.shape == (3, 3)
        
        cylindrical_jacobian = math_framework._cylindrical_jacobian(1, np.pi/4, 1)
        assert cylindrical_jacobian.shape == (3, 3)
    
    def test_differential_operators(self, math_framework):
        """Test vector calculus operators"""
        # Test gradient
        x, y, z = Symbol('x'), Symbol('y'), Symbol('z')
        f = x**2 + y**2 + z**2
        coords = [x, y, z]
        gradient = math_framework.operators['differential']['gradient'](f, coords)
        assert len(gradient) == 3
        assert gradient[0] == 2*x
        assert gradient[1] == 2*y
        assert gradient[2] == 2*z
        
        # Test divergence
        vector_field = [x*y, y*z, z*x]
        divergence = math_framework._divergence_operator(vector_field, coords)
        assert divergence == y + z + x
        
        # Test curl
        curl = math_framework._curl_operator(vector_field, coords)
        assert len(curl) == 3
        
        # Test Laplacian
        laplacian = math_framework._laplacian_operator(f, coords)
        assert laplacian == 6  # ∇²(x² + y² + z²) = 6
    
    def test_equation_building(self, math_framework):
        """Test equation building functionality"""
        components = {
            'variables': [
                {'name': 'x', 'type': 'real'},
                {'name': 'y', 'type': 'real'}
            ],
            'operators': [
                {'type': 'differential', 'name': 'gradient'}
            ],
            'constants': [
                {'name': 'c', 'symbolic': False, 'value': 299792458}
            ]
        }
        
        equation = math_framework.build_equation(components)
        assert equation is not None
    
    def test_equation_solving(self, math_framework):
        """Test equation solving methods"""
        x = Symbol('x')
        equation = x**2 - 4
        
        result = math_framework.solve_equation(equation, method='analytical')
        assert result['solution'] == [-2, 2]
        assert result['method_used'] == 'analytical'
        assert 'error_estimate' in result
    
    def test_special_functions(self, math_framework):
        """Test special mathematical functions"""
        assert 'bessel' in math_framework.special_functions
        assert 'spherical_harmonics' in math_framework.special_functions
        assert 'orthogonal_polynomials' in math_framework.special_functions
        assert 'hypergeometric' in math_framework.special_functions
        assert 'elliptic' in math_framework.special_functions