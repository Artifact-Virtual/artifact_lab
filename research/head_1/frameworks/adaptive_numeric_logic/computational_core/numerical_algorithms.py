import numpy as np
from typing import Union, List, Tuple, Optional
from .numerical_representation import ArbitraryPrecisionFloat

class NumericalAlgorithms:
    """Core numerical algorithms with arbitrary precision support"""
    
    def __init__(self, precision_bits: int = 256):
        self.precision_bits = precision_bits
        
    def root_finding(self, 
                     func: callable,
                     x0: Union[float, ArbitraryPrecisionFloat],
                     method: str = 'newton',
                     tol: float = 1e-10,
                     max_iter: int = 100) -> ArbitraryPrecisionFloat:
        """
        Root finding with multiple methods
        Supported methods: newton, bisection, secant
        """
        if method == 'newton':
            return self._newton_method(func, x0, tol, max_iter)
        elif method == 'bisection':
            return self._bisection_method(func, x0, x0 + 1, tol, max_iter)
        elif method == 'secant':
            return self._secant_method(func, x0, x0 + 1, tol, max_iter)
        else:
            raise ValueError(f"Unsupported method: {method}")

    def _newton_method(self, func: callable, x0: float, tol: float, max_iter: int) -> ArbitraryPrecisionFloat:
        """Newton-Raphson method implementation"""
        x = ArbitraryPrecisionFloat(x0, self.precision_bits)
        h = ArbitraryPrecisionFloat("1e-10", self.precision_bits)
        
        for i in range(max_iter):
            # Compute derivative using central difference
            deriv = (func(x + h) - func(x - h)) / (2 * h)
            dx = func(x) / deriv
            x = x - dx
            
            if abs(dx) < tol:
                return x
                
        raise RuntimeError("Newton method failed to converge")

    def integrate(self, 
                 func: callable,
                 a: Union[float, ArbitraryPrecisionFloat],
                 b: Union[float, ArbitraryPrecisionFloat],
                 method: str = 'adaptive_quadrature',
                 tol: float = 1e-10) -> ArbitraryPrecisionFloat:
        """
        Numerical integration with multiple methods
        Supported methods: adaptive_quadrature, simpson, trapezoidal
        """
        if method == 'adaptive_quadrature':
            return self._adaptive_quadrature(func, a, b, tol)
        elif method == 'simpson':
            return self._simpson_rule(func, a, b, 1000)
        elif method == 'trapezoidal':
            return self._trapezoidal_rule(func, a, b, 1000)
        else:
            raise ValueError(f"Unsupported method: {method}")

    def _adaptive_quadrature(self, func: callable, a: ArbitraryPrecisionFloat, b: ArbitraryPrecisionFloat, 
                           tol: float) -> ArbitraryPrecisionFloat:
        """Adaptive quadrature implementation using recursive subdivision"""
        def quad_step(x0: ArbitraryPrecisionFloat, x1: ArbitraryPrecisionFloat, f0: ArbitraryPrecisionFloat, 
                     f1: ArbitraryPrecisionFloat, f_mid: ArbitraryPrecisionFloat, area: ArbitraryPrecisionFloat, 
                     depth: int) -> ArbitraryPrecisionFloat:
            # Calculate midpoints
            x_mid = (x0 + x1) / 2     
            f_left_mid = func((x0 + x_mid) / 2)
            f_right_mid = func((x_mid + x1) / 2)
            
            # Calculate areas using Simpson's rule
            area_left = (x_mid - x0) * (f0 + 4*f_left_mid + f_mid) / 6
            area_right = (x1 - x_mid) * (f_mid + 4*f_right_mid + f1) / 6
            
            # Check if areas are sufficiently close
            if depth > 50:  # Maximum recursion depth
                return area_left + area_right
            
            if abs(area_left + area_right - area) < tol:
                return area_left + area_right
            
            # Recurse on subintervals
            return (quad_step(x0, x_mid, f0, f_mid, f_left_mid, area_left, depth + 1) +
                    quad_step(x_mid, x1, f_mid, f1, f_right_mid, area_right, depth + 1))
        
        # Initial evaluations
        f_a = func(a)
        f_b = func(b)
        x_mid = (a + b) / 2
        f_mid = func(x_mid)
        area = (b - a) * (f_a + 4*f_mid + f_b) / 6  # Initial area using Simpson's rule
        
        return quad_step(a, b, f_a, f_b, f_mid, area, 0)

    def _simpson_rule(self, func: callable, a: ArbitraryPrecisionFloat, b: ArbitraryPrecisionFloat, n: int) -> ArbitraryPrecisionFloat:
        """Simpson's rule implementation with arbitrary precision"""
        if n % 2 != 0:
            n += 1  # Ensure even number of intervals
            
        h = (b - a) / n
        x = a
        sum1 = ArbitraryPrecisionFloat(0, self.precision_bits)  # Even terms
        sum2 = ArbitraryPrecisionFloat(0, self.precision_bits)  # Odd terms
        
        for i in range(1, n):
            x += h
            if i % 2 == 0:
                sum1 += func(x)
            else:
                sum2 += func(x)
                
        return (h / 3) * (func(a) + func(b) + 4 * sum2 + 2 * sum1)

    def _trapezoidal_rule(self, func: callable, a: ArbitraryPrecisionFloat, b: ArbitraryPrecisionFloat, n: int) -> ArbitraryPrecisionFloat:
        """Trapezoidal rule implementation with arbitrary precision"""
        h = (b - a) / n
        sum_value = (func(a) + func(b)) / 2
        
        for i in range(1, n):
            sum_value += func(a + i * h)
            
        return h * sum_value

    def interpolate(self,
                   x: List[Union[float, ArbitraryPrecisionFloat]],
                   y: List[Union[float, ArbitraryPrecisionFloat]],
                   method: str = 'cubic_spline') -> callable:
        """
        Interpolation with multiple methods
        Supported methods: cubic_spline, linear, polynomial
        """
        if method == 'cubic_spline':
            return self._cubic_spline_interpolation(x, y)
        elif method == 'linear':
            return self._linear_interpolation(x, y)
        elif method == 'polynomial':
            return self._polynomial_interpolation(x, y)
        else:
            raise ValueError(f"Unsupported method: {method}")

    def _cubic_spline_interpolation(self, x: List[Union[float, ArbitraryPrecisionFloat]], 
                                  y: List[Union[float, ArbitraryPrecisionFloat]]) -> callable:
        """Cubic spline interpolation implementation"""
        n = len(x)
        if n < 3:
            raise ValueError("Cubic spline requires at least 3 points")
            
        # Convert to arbitrary precision
        x = [ArbitraryPrecisionFloat(xi, self.precision_bits) for xi in x]
        y = [ArbitraryPrecisionFloat(yi, self.precision_bits) for yi in y]
        
        # Calculate divided differences
        h = [x[i+1] - x[i] for i in range(n-1)]
        a = [yi for yi in y]
        
        # Create tridiagonal system
        A = np.zeros((n, n))
        b = np.zeros(n)
        A[0, 0] = 1
        A[-1, -1] = 1
        
        for i in range(1, n-1):
            A[i, i-1] = h[i-1]
            A[i, i] = 2 * (h[i-1] + h[i])
            A[i, i+1] = h[i]
            b[i] = 3 * ((a[i+1] - a[i]) / h[i] - (a[i] - a[i-1]) / h[i-1])
            
        # Solve for coefficients
        c = np.linalg.solve(A, b)
        
        # Calculate remaining coefficients
        b = [(a[i+1] - a[i]) / h[i] - h[i] * (2 * c[i] + c[i+1]) / 3 for i in range(n-1)]
        d = [(c[i+1] - c[i]) / (3 * h[i]) for i in range(n-1)]
        
        def interpolate(x_new):
            """Return interpolated value at x_new"""
            # Find appropriate interval
            for i in range(n-1):
                if x[i] <= x_new <= x[i+1]:
                    dx = x_new - x[i]
                    return a[i] + b[i]*dx + c[i]*dx**2 + d[i]*dx**3
            raise ValueError("Interpolation point outside data range")
            
        return interpolate

    def _linear_interpolation(self, x: List[Union[float, ArbitraryPrecisionFloat]], 
                            y: List[Union[float, ArbitraryPrecisionFloat]]) -> callable:
        """Linear interpolation implementation"""
        n = len(x)
        if n < 2:
            raise ValueError("Linear interpolation requires at least 2 points")
            
        # Convert to arbitrary precision
        x = [ArbitraryPrecisionFloat(xi, self.precision_bits) for xi in x]
        y = [ArbitraryPrecisionFloat(yi, self.precision_bits) for yi in y]
        
        def interpolate(x_new):
            """Return interpolated value at x_new"""
            for i in range(n-1):
                if x[i] <= x_new <= x[i+1]:
                    t = (x_new - x[i]) / (x[i+1] - x[i])
                    return y[i] * (1 - t) + y[i+1] * t
            raise ValueError("Interpolation point outside data range")
            
        return interpolate

    def _polynomial_interpolation(self, x: List[Union[float, ArbitraryPrecisionFloat]], 
                                y: List[Union[float, ArbitraryPrecisionFloat]]) -> callable:
        """Polynomial interpolation using Lagrange method"""
        n = len(x)
        if n < 2:
            raise ValueError("Polynomial interpolation requires at least 2 points")
            
        # Convert to arbitrary precision
        x = [ArbitraryPrecisionFloat(xi, self.precision_bits) for xi in x]
        y = [ArbitraryPrecisionFloat(yi, self.precision_bits) for yi in y]
        
        def interpolate(x_new):
            """Return interpolated value at x_new"""
            result = ArbitraryPrecisionFloat(0, self.precision_bits)
            
            for i in range(n):
                term = y[i]
                for j in range(n):
                    if i != j:
                        term *= (x_new - x[j]) / (x[i] - x[j])
                result += term
                
            return result
            
        return interpolate

    def compute_statistics(self, data: List[Union[float, ArbitraryPrecisionFloat]]) -> dict:
        """Calculate basic statistical measures with arbitrary precision"""
        n = len(data)
        if n == 0:
            raise ValueError("Empty dataset")
            
        # Convert to arbitrary precision
        values = [ArbitraryPrecisionFloat(x, self.precision_bits) for x in data]
        
        # Calculate mean
        mean = sum(values) / n
        
        # Calculate variance and std
        squared_diff_sum = sum((x - mean)**2 for x in values)
        variance = squared_diff_sum / (n - 1)
        std = variance**0.5
        
        # Calculate median
        sorted_values = sorted(values)
        median = sorted_values[n//2] if n % 2 == 1 else (sorted_values[n//2-1] + sorted_values[n//2]) / 2
        
        return {
            'mean': mean,
            'median': median,
            'variance': variance,
            'std': std,
            'min': min(values),
            'max': max(values)
        }

    def special_function(self, func_name: str, *args) -> ArbitraryPrecisionFloat:
        """Evaluate special functions with arbitrary precision"""
        special_funcs = {
            'bessel_j': self._bessel_j,
            'gamma': self._gamma,
            'erf': self._error_function,
            'legendre': self._legendre_polynomial
        }
        
        if func_name not in special_funcs:
            raise ValueError(f"Unsupported special function: {func_name}")
            
        return special_funcs[func_name](*args)

    def _bessel_j(self, n: int, x: Union[float, ArbitraryPrecisionFloat]) -> ArbitraryPrecisionFloat:
        """Bessel function of first kind"""
        x = ArbitraryPrecisionFloat(x, self.precision_bits)
        result = ArbitraryPrecisionFloat(0, self.precision_bits)
        
        for k in range(50):  # Truncate series at 50 terms
            numerator = (-1)**k * (x/2)**(2*k + n)
            denominator = self._gamma(k + 1) * self._gamma(k + n + 1)
            term = numerator / denominator
            result += term
            if abs(term) < 1e-20:  # Convergence check
                break
                
        return result

    def _gamma(self, x: Union[float, ArbitraryPrecisionFloat]) -> ArbitraryPrecisionFloat:
        """Gamma function using Lanczos approximation"""
        if isinstance(x, (int, float)):
            x = ArbitraryPrecisionFloat(x, self.precision_bits)
            
        if x <= 0:
            raise ValueError("Gamma function undefined for x <= 0")
            
        # Lanczos coefficients
        g = 7
        p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
             771.32342877765313, -176.61502916214059, 12.507343278686905,
             -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
        
        x -= 1
        y = ArbitraryPrecisionFloat(p[0], self.precision_bits)
        for i in range(1, g+2):
            y += p[i]/(x + i)
            
        t = x + g + 0.5
        return (2*np.pi)**0.5 * t**(x + 0.5) * np.exp(-t) * y

    def monte_carlo_integrate(self, func: callable, a: float, b: float, 
                            samples: int = 10000) -> ArbitraryPrecisionFloat:
        """Monte Carlo integration with arbitrary precision"""
        # Generate random points
        x = np.random.uniform(a, b, samples)
        y = np.array([float(func(xi)) for xi in x])
        
        # Calculate mean and convert to arbitrary precision
        mean = ArbitraryPrecisionFloat(np.mean(y), self.precision_bits)
        
        # Scale by interval width
        result = (b - a) * mean
        
        return result
