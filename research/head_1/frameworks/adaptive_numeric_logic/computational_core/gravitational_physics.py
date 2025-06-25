import numpy as np
from typing import Dict, List, Optional, Union, Tuple
from .tensor_spinor import TensorRepresentation
from .numerical_representation import ArbitraryPrecisionFloat

class GravitationalPhysics:
    """Handles general relativity and gravitational physics calculations"""
    
    def __init__(self, precision_bits: int = 256):
        self.G = 6.67430e-11  # gravitational constant
        self.c = 299792458    # speed of light
        self.precision_bits = precision_bits
        
    def schwarzschild_metric(self, r: float, theta: float = np.pi/2) -> TensorRepresentation:
        """
        Compute the Schwarzschild metric for a black hole
        ds² = -(1-2GM/rc²)dt² + (1-2GM/rc²)⁻¹dr² + r²(dθ² + sin²θ dφ²)
        """
        M = 1.0  # Mass in geometric units (G=c=1)
        
        # Compute metric components
        g_tt = -(1 - 2*M/r)
        g_rr = 1/(1 - 2*M/r)
        g_theta_theta = r**2
        g_phi_phi = r**2 * np.sin(theta)**2
        
        # Create metric tensor
        metric = TensorRepresentation((4, 4), symmetry="symmetric")
        metric_components = np.zeros((4, 4))
        
        # Set components (t,r,θ,φ)
        metric_components[0][0] = g_tt
        metric_components[1][1] = g_rr
        metric_components[2][2] = g_theta_theta
        metric_components[3][3] = g_phi_phi
        
        metric.set_components(metric_components)
        return metric
    
    def kerr_metric(self, r: float, theta: float, a: float) -> TensorRepresentation:
        """
        Compute the Kerr metric for a rotating black hole
        a: angular momentum parameter
        """
        M = 1.0  # Mass in geometric units
        
        # Compute metric components in Boyer-Lindquist coordinates
        Sigma = r**2 + (a*np.cos(theta))**2
        Delta = r**2 - 2*M*r + a**2
        
        # Create metric tensor
        metric = TensorRepresentation((4, 4), symmetry="symmetric")
        metric_components = np.zeros((4, 4))
        
        # Set components
        metric_components[0][0] = -(1 - 2*M*r/Sigma)
        metric_components[1][1] = Sigma/Delta
        metric_components[2][2] = Sigma
        metric_components[3][3] = (r**2 + a**2 + 2*M*r*a**2*np.sin(theta)**2/Sigma) * np.sin(theta)**2
        metric_components[0][3] = metric_components[3][0] = -2*M*r*a*np.sin(theta)**2/Sigma
        
        metric.set_components(metric_components)
        return metric
    
    def gravitational_wave(self, t: float, r: float, theta: float, phi: float, 
                         amplitude: float, frequency: float) -> TensorRepresentation:
        """
        Compute gravitational wave perturbation metric
        Using the quadrupole approximation for a binary system
        """
        # Create perturbation tensor
        h = TensorRepresentation((4, 4), symmetry="symmetric")
        h_components = np.zeros((4, 4))
        
        # Plus polarization
        h_plus = amplitude * np.cos(2*np.pi*frequency*t - r/self.c)
        
        # Cross polarization
        h_cross = amplitude * np.sin(2*np.pi*frequency*t - r/self.c)
        
        # Set spatial components for plus polarization
        h_components[1][1] = h_plus
        h_components[2][2] = -h_plus
        
        # Set spatial components for cross polarization
        h_components[1][2] = h_components[2][1] = h_cross
        
        h.set_components(h_components)
        return h
    
    def orbit_precession(self, a: float, e: float, M: float) -> float:
        """
        Calculate relativistic orbital precession (Einstein precession)
        a: semi-major axis
        e: eccentricity
        M: central mass
        Returns: precession per orbit in radians
        """
        # Convert to SI units
        precession = 6*np.pi*self.G*M/(self.c**2 * a * (1 - e**2))
        return float(precession)
    
    def gravitational_redshift(self, r: float, M: float) -> float:
        """
        Calculate gravitational redshift
        z = 1/√(1 - 2GM/rc²) - 1
        """
        return 1/np.sqrt(1 - 2*self.G*M/(r*self.c**2)) - 1
    
    def event_horizon_properties(self, M: float, a: float = 0) -> Dict[str, float]:
        """
        Calculate properties of a black hole's event horizon
        M: mass
        a: angular momentum parameter (0 ≤ a ≤ M)
        """
        if abs(a) > M:
            raise ValueError("Angular momentum parameter must not exceed mass")
            
        # Convert to geometric units (G=c=1)
        r_plus = M + np.sqrt(M**2 - a**2)  # Outer horizon
        r_minus = M - np.sqrt(M**2 - a**2)  # Inner horizon
        
        # Surface area
        A = 4*np.pi*(r_plus**2 + a**2)
        
        # Angular velocity of horizon
        Omega_H = a/(r_plus**2 + a**2)
        
        # Surface gravity
        kappa = (r_plus - r_minus)/(2*(r_plus**2 + a**2))
        
        # Hawking temperature
        T_H = kappa/(2*np.pi)
        
        return {
            "outer_horizon_radius": float(r_plus),
            "inner_horizon_radius": float(r_minus),
            "surface_area": float(A),
            "angular_velocity": float(Omega_H),
            "surface_gravity": float(kappa),
            "hawking_temperature": float(T_H)
        }
    
    def gravitational_lensing(self, impact_parameter: float, M: float) -> float:
        """
        Calculate gravitational lensing deflection angle
        impact_parameter: closest approach distance
        M: mass of the lensing object
        Returns: deflection angle in radians
        """
        return 4*self.G*M/(self.c**2 * impact_parameter)
    
    def binary_system_power(self, m1: float, m2: float, a: float, e: float = 0) -> float:
        """
        Calculate gravitational wave power from a binary system
        m1, m2: masses of the objects
        a: semi-major axis
        e: eccentricity
        Returns: power in watts
        """
        # Reduced mass
        mu = (m1*m2)/(m1 + m2)
        
        # Total mass
        M = m1 + m2
        
        # Orbital frequency
        omega = np.sqrt(self.G*M/(a**3))
        
        # Peters-Mathews formula for gravitational wave power
        P = (32/5) * (self.G**4/self.c**5) * \
            (mu**2 * M**3/a**5) * \
            (1 + 73/24*e**2 + 37/96*e**4) * \
            1/(1-e**2)**(7/2)
            
        return float(P)
    
    def gravitational_potential(self, r: float, M: float) -> float:
        """Calculate Newtonian gravitational potential"""
        return -self.G*M/r
    
    def tidal_force(self, r: float, M: float, dr: float) -> float:
        """
        Calculate tidal force difference across a small distance
        dr: separation between two points
        """
        return 2*self.G*M*dr/r**3