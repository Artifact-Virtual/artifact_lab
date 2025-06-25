import numpy as np
from decimal import Decimal, getcontext
from .numerical_representation import ArbitraryPrecisionFloat

class RelativisticCalculator:
    """Handler for relativistic physics calculations with arbitrary precision"""
    
    def __init__(self, precision_bits=256):
        self.c = 299792458  # speed of light in m/s
        self.precision_bits = precision_bits
        getcontext().prec = precision_bits // 4  # Convert bits to decimal digits
        
    def rest_energy(self, mass_kg, include_uncertainty=True):
        """Calculate rest energy (E = mc²) with uncertainty"""
        try:
            mass = ArbitraryPrecisionFloat(mass_kg, self.precision_bits)
            c_squared = ArbitraryPrecisionFloat(self.c ** 2, self.precision_bits)
            energy = mass * c_squared
            
            # Convert to different units
            energy_joules = float(energy)
            energy_ev = energy_joules / 1.602176634e-19
            energy_mev = energy_ev / 1e6
            energy_gev = energy_ev / 1e9
            
            result = {
                "energy_joules": energy_joules,
                "energy_ev": energy_ev,
                "energy_mev": energy_mev,
                "energy_gev": energy_gev
            }
            
            if include_uncertainty:
                # Add uncertainties (typical mass measurement uncertainty ~0.01%)
                mass_uncertainty = mass_kg * 0.0001
                energy_uncertainty = mass_uncertainty * (self.c ** 2)
                result["uncertainties"] = {
                    "mass_uncertainty_kg": mass_uncertainty,
                    "energy_uncertainty_joules": energy_uncertainty,
                    "energy_uncertainty_gev": energy_uncertainty / (1.602176634e-19) / 1e9
                }
            
            return result
        except Exception as e:
            raise ValueError(f"Error in rest energy calculation: {str(e)}")

    def time_dilation(self, proper_time, velocity):
        """Calculate relativistic time dilation"""
        try:
            beta = velocity / self.c
            if abs(beta) >= 1:
                raise ValueError("Velocity cannot be equal to or greater than speed of light")
                
            gamma = 1 / np.sqrt(1 - beta**2)
            dilated_time = proper_time * gamma
            
            result = {
                "proper_time": proper_time,
                "dilated_time": dilated_time,
                "gamma_factor": gamma,
                "beta": beta
            }
            
            # Add some useful comparisons
            if proper_time == 1:  # If input is 1 second
                result["comparisons"] = {
                    "muon_lifetime": f"A muon moving at this speed would appear to live {gamma * 2.2e-6:.2e} seconds (vs 2.2µs at rest)",
                    "human_perception": f"1 second for the moving observer would be {gamma:.2f} seconds for a stationary observer"
                }
                
            return result
        except Exception as e:
            raise ValueError(f"Error in time dilation calculation: {str(e)}")

    def length_contraction(self, proper_length, velocity):
        """Calculate relativistic length contraction"""
        try:
            beta = velocity / self.c
            if abs(beta) >= 1:
                raise ValueError("Velocity cannot be equal to or greater than speed of light")
                
            gamma = 1 / np.sqrt(1 - beta**2)
            contracted_length = proper_length / gamma
            
            result = {
                "proper_length": proper_length,
                "contracted_length": contracted_length,
                "gamma_factor": gamma,
                "beta": beta,
                "contraction_percentage": (1 - 1/gamma) * 100
            }
            
            # Add comparisons for better understanding
            if proper_length == 1:
                result["comparisons"] = {
                    "human_scale": f"A 1 meter object would appear {contracted_length:.3f} meters long",
                    "particle_scale": f"At this speed, particle accelerator length requirements are reduced by {(1 - 1/gamma) * 100:.1f}%"
                }
                
            return result
        except Exception as e:
            raise ValueError(f"Error in length contraction calculation: {str(e)}")

    def relativistic_mass(self, rest_mass, velocity):
        """Calculate relativistic mass"""
        try:
            beta = velocity / self.c
            if abs(beta) >= 1:
                raise ValueError("Velocity cannot be equal to or greater than speed of light")
                
            gamma = 1 / np.sqrt(1 - beta**2)
            rel_mass = rest_mass * gamma
            
            # Calculate kinetic energy as well
            kinetic_energy = (gamma - 1) * rest_mass * (self.c ** 2)
            
            result = {
                "rest_mass": rest_mass,
                "relativistic_mass": rel_mass,
                "gamma_factor": gamma,
                "beta": beta,
                "kinetic_energy_joules": kinetic_energy,
                "kinetic_energy_gev": kinetic_energy / (1.602176634e-19) / 1e9
            }
            
            # Add comparisons
            if rest_mass == 9.1093837015e-31:  # electron mass
                result["comparisons"] = {
                    "electron_mass_increase": f"An electron's mass increases by {(gamma - 1) * 100:.1f}%",
                    "accelerator_energy": f"Required accelerator energy: {kinetic_energy / 1e6:.2f} MeV"
                }
                
            return result
        except Exception as e:
            raise ValueError(f"Error in relativistic mass calculation: {str(e)}")

    def lorentz_transform(self, t, x, y, z, velocity):
        """Perform Lorentz transformation of spacetime coordinates"""
        try:
            beta = velocity / self.c
            if abs(beta) >= 1:
                raise ValueError("Velocity cannot be equal to or greater than speed of light")
                
            gamma = 1 / np.sqrt(1 - beta**2)
            
            # Transform to moving frame
            t_prime = gamma * (t - beta * x / self.c)
            x_prime = gamma * (x - beta * self.c * t)
            y_prime = y  # unchanged
            z_prime = z  # unchanged
            
            result = {
                "original_coordinates": {
                    "t": t, "x": x, "y": y, "z": z
                },
                "transformed_coordinates": {
                    "t_prime": t_prime,
                    "x_prime": x_prime,
                    "y_prime": y_prime,
                    "z_prime": z_prime
                },
                "transformation_parameters": {
                    "beta": beta,
                    "gamma": gamma,
                    "velocity": velocity
                }
            }
            
            # Calculate spacetime interval (should be invariant)
            interval = (self.c * t)**2 - x**2 - y**2 - z**2
            interval_prime = (self.c * t_prime)**2 - x_prime**2 - y_prime**2 - z_prime**2
            
            result["invariant_checks"] = {
                "spacetime_interval": interval,
                "transformed_interval": interval_prime,
                "is_invariant": abs(interval - interval_prime) < 1e-10
            }
            
            return result
        except Exception as e:
            raise ValueError(f"Error in Lorentz transformation: {str(e)}")

    def get_physical_constants(self):
        """Return relevant physical constants with descriptions"""
        return {
            "c": {
                "value": self.c,
                "units": "m/s",
                "description": "Speed of light in vacuum"
            },
            "h": {
                "value": 6.62607015e-34,
                "units": "J⋅s",
                "description": "Planck constant"
            },
            "e": {
                "value": 1.602176634e-19,
                "units": "C",
                "description": "Elementary charge"
            },
            "m_e": {
                "value": 9.1093837015e-31,
                "units": "kg",
                "description": "Electron rest mass"
            },
            "m_p": {
                "value": 1.67262192369e-27,
                "units": "kg",
                "description": "Proton rest mass"
            }
        }