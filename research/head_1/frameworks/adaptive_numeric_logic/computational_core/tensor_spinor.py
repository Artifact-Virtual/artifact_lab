import numpy as np
from typing import List, Tuple, Dict, Optional, Union
from .numerical_representation import ArbitraryPrecisionFloat

def validate_tensor_input(value_str: str) -> float:
    """Validate and convert tensor component input to float"""
    try:
        # Remove any whitespace and common mathematical symbols
        value_str = value_str.strip().replace(' ', '')
        return float(value_str)
    except ValueError:
        raise ValueError(f"Invalid tensor component: {value_str}. Must be a numeric value.")

class TensorRepresentation:
    """Handles tensor operations with arbitrary precision support"""
    
    def __init__(self, dimensions: Tuple[int, ...], symmetry: Optional[str] = None):
        """Initialize tensor with given dimensions and optional symmetry"""
        self.dimensions = dimensions
        self.symmetry = symmetry
        self.rank = len(dimensions)
        self.components = np.zeros(dimensions)
        
        # Validate dimensions for special tensor types
        if symmetry == "symmetric" and len(dimensions) == 2:
            if dimensions[0] != dimensions[1]:
                raise ValueError("Symmetric tensors must be square")
    
    def validate_metric_signature(self, components: np.ndarray) -> bool:
        """Validate metric tensor signature for physical spacetime"""
        if self.rank != 2:
            return True  # Only validate rank-2 metric tensors
            
        # For zero metric, we don't enforce signature requirements
        if np.allclose(components, 0):
            return True
            
        # Check for correct signature (-,+,+,+) for 4D spacetime
        if self.dimensions == (4, 4):
            eigenvals = np.linalg.eigvals(components)
            # Should have one negative and three positive eigenvalues
            neg_count = sum(1 for ev in eigenvals if ev < 0)
            pos_count = sum(1 for ev in eigenvals if ev > 0)
            return neg_count == 1 and pos_count == 3
            
        return True
    
    def set_components(self, components: np.ndarray):
        """Set tensor components with validation"""
        if components.shape != self.dimensions:
            raise ValueError(f"Components shape {components.shape} does not match tensor dimensions {self.dimensions}")
            
        # Additional validation for metric tensors
        if self.symmetry == "symmetric":
            if not np.allclose(components, components.T):
                raise ValueError("Components must be symmetric")
            if self.rank == 2:  # For metric tensors
                if not self.validate_metric_signature(components):
                    raise ValueError("Invalid metric signature for physical spacetime")
                    
        self.components = components.copy()  # Make a copy to avoid external modifications
        
        if self.symmetry:
            self._enforce_symmetry()
            
        # For metric tensors, verify non-degeneracy
        if self.rank == 2 and self.symmetry == "symmetric":
            try:
                np.linalg.inv(self.components)
            except np.linalg.LinAlgError:
                raise np.linalg.LinAlgError("Metric tensor is degenerate (not invertible)")
    
    def contract(self, other_tensor: 'TensorRepresentation', axes: Optional[Tuple[int, int]] = None) -> 'TensorRepresentation':
        """Perform tensor contraction"""
        # For matrix multiplication behavior, contract last index of first tensor with first index of second tensor
        if axes is None:
            if len(self.dimensions) >= 1 and len(other_tensor.dimensions) >= 1:
                axes = (len(self.dimensions) - 1, 0)
            else:
                raise ValueError("No compatible dimensions found for contraction")
                
        # Validate contraction axes
        if self.dimensions[axes[0]] != other_tensor.dimensions[axes[1]]:
            raise ValueError(f"Incompatible dimensions for contraction: {self.dimensions[axes[0]]} ≠ {other_tensor.dimensions[axes[1]]}")
            
        # Perform contraction using numpy's tensordot
        result = np.tensordot(self.components, other_tensor.components, axes=(axes[0], axes[1]))
        
        # Create new tensor with resulting dimensions
        new_dims = tuple(d for i, d in enumerate(self.dimensions) if i != axes[0]) + \
                  tuple(d for i, d in enumerate(other_tensor.dimensions) if i != axes[1])
        new_tensor = TensorRepresentation(new_dims)
        new_tensor.set_components(result)
        
        return new_tensor
    
    def raise_index(self, metric: 'TensorRepresentation', index: int) -> 'TensorRepresentation':
        """Raise a tensor index using the metric tensor"""
        if not isinstance(metric, TensorRepresentation) or metric.rank != 2:
            raise ValueError("Metric must be a rank-2 tensor")
            
        # Contract with metric to raise index
        return self.contract(metric, axes=(index, 0))
    
    def lower_index(self, metric: 'TensorRepresentation', index: int) -> 'TensorRepresentation':
        """Lower a tensor index using the metric tensor"""
        if not isinstance(metric, TensorRepresentation) or metric.rank != 2:
            raise ValueError("Metric must be a rank-2 tensor")
            
        # Contract with metric to lower index
        return self.contract(metric, axes=(index, 1))
    
    def compute_christoffel_symbols(self, metric: 'TensorRepresentation') -> 'TensorRepresentation':
        """Compute Christoffel symbols from metric tensor"""
        # Validate self tensor dimensions (must be square metric)
        if len(self.dimensions) != 2 or self.dimensions[0] != self.dimensions[1]:
            raise ValueError("Computing tensor must be a square metric tensor")
            
        # Basic type validation of input
        if not isinstance(metric, TensorRepresentation):
            raise ValueError("Input must be a TensorRepresentation")
            
        # Validate metric is rank 2
        if metric.rank != 2:
            raise ValueError("Metric must be a rank-2 tensor")
            
        # Validate metric dimensions
        if len(metric.dimensions) != 2 or metric.dimensions[0] != metric.dimensions[1]:
            raise ValueError("Metric tensor must be square")
            
        # Get dimension
        dim = metric.dimensions[0]
            
        # Initialize Christoffel symbols (rank 3 tensor)
        christoffel = TensorRepresentation((dim, dim, dim))
        
        try:
            metric_inverse = np.linalg.inv(metric.components)
        except np.linalg.LinAlgError:
            raise ValueError("Metric tensor is not invertible")
        
        # Compute partial derivatives of metric (assuming coordinates are orthogonal)
        # In real applications, this would use actual coordinate derivatives
        partial_g = np.zeros((dim, dim, dim))
        
        # Compute Christoffel symbols
        for mu in range(dim):
            for nu in range(dim):
                for rho in range(dim):
                    sum_term = 0
                    for sigma in range(dim):
                        sum_term += 0.5 * metric_inverse[mu][sigma] * \
                                  (partial_g[nu][rho][sigma] + \
                                   partial_g[rho][nu][sigma] - \
                                   partial_g[sigma][nu][rho])
                    christoffel.components[mu][nu][rho] = sum_term
                    
        return christoffel
    
    def compute_riemann_tensor(self, christoffel: 'TensorRepresentation') -> 'TensorRepresentation':
        """Compute Riemann curvature tensor from Christoffel symbols"""
        if not isinstance(christoffel, TensorRepresentation) or christoffel.rank != 3:
            raise ValueError("Input must be Christoffel symbols (rank-3 tensor)")
            
        dim = christoffel.dimensions[0]
        riemann = TensorRepresentation((dim, dim, dim, dim))
        
        # Compute Riemann tensor components
        for mu in range(dim):
            for nu in range(dim):
                for rho in range(dim):
                    for sigma in range(dim):
                        # R^μ_νρσ = ∂_ρΓ^μ_νσ - ∂_σΓ^μ_νρ + Γ^μ_αρΓ^α_νσ - Γ^μ_ασΓ^α_νρ
                        # Here we'll implement a simplified version assuming flat space
                        term1 = 0  # ∂_ρΓ^μ_νσ
                        term2 = 0  # -∂_σΓ^μ_νρ
                        
                        term3 = 0
                        term4 = 0
                        for alpha in range(dim):
                            term3 += christoffel.components[mu][alpha][rho] * \
                                   christoffel.components[alpha][nu][sigma]
                            term4 += christoffel.components[mu][alpha][sigma] * \
                                   christoffel.components[alpha][nu][rho]
                                   
                        riemann.components[mu][nu][rho][sigma] = term1 - term2 + term3 - term4
                        
        return riemann
    
    def compute_ricci_tensor(self, riemann: 'TensorRepresentation') -> 'TensorRepresentation':
        """Compute Ricci tensor by contracting Riemann tensor"""
        if not isinstance(riemann, TensorRepresentation) or riemann.rank != 4:
            raise ValueError("Input must be Riemann tensor (rank-4 tensor)")
            
        dim = riemann.dimensions[0]
        ricci = TensorRepresentation((dim, dim))
        
        # Ricci tensor is the contraction R^μ_ν = R^ρ_μρν
        for mu in range(dim):
            for nu in range(dim):
                sum_term = 0
                for rho in range(dim):
                    sum_term += riemann.components[rho][mu][rho][nu]
                ricci.components[mu][nu] = sum_term
                
        return ricci
    
    def compute_ricci_scalar(self, ricci: 'TensorRepresentation', metric: 'TensorRepresentation') -> float:
        """Compute Ricci scalar by contracting Ricci tensor with metric"""
        if not isinstance(ricci, TensorRepresentation) or ricci.rank != 2:
            raise ValueError("Input must be Ricci tensor (rank-2 tensor)")
            
        if ricci.dimensions != metric.dimensions:
            raise ValueError("Ricci tensor dimensions must match metric dimensions")
            
        # R = g^μν R_μν
        metric_inverse = np.linalg.inv(metric.components)
        ricci_scalar = 0
        
        for mu in range(metric.dimensions[0]):
            for nu in range(metric.dimensions[1]):
                ricci_scalar += metric_inverse[mu][nu] * ricci.components[mu][nu]
                
        return float(ricci_scalar)
    
    def _enforce_symmetry(self):
        """Enforce tensor symmetry if specified"""
        if self.symmetry == "symmetric":
            # Make tensor symmetric by averaging with its transpose
            if len(self.dimensions) == 2:
                self.components = 0.5 * (self.components + self.components.T)
            else:
                raise ValueError("Symmetry only supported for rank-2 tensors")
        elif self.symmetry == "antisymmetric":
            # Make tensor antisymmetric under index interchange
            self.components = 0.5 * (self.components - np.transpose(self.components))
    
    def symbolic_transform(self, symbolic_expression: str):
        """Placeholder for symbolic tensor transformations"""
        print(f"Symbolic transformation with expression: {symbolic_expression}")
        # This would be implemented with a computer algebra system

class SpinorRepresentation:
    """Handles spinor operations and transformations"""
    
    def __init__(self, spinor_type: str, components: Optional[np.ndarray] = None):
        self.spinor_type = spinor_type
        self.components = components if components is not None else np.zeros(2, dtype=complex)
        self.gamma_matrices = self._initialize_gamma_matrices()
        
    def transform(self, transformation_matrix):
        """Apply Lorentz transformation to spinor"""
        # Convert input to numpy array if needed
        if not isinstance(transformation_matrix, np.ndarray):
            transformation_matrix = np.array(transformation_matrix)
            
        if transformation_matrix.shape != (2, 2):
            raise ValueError("Transformation matrix must be 2x2")
            
        # Apply transformation
        self.components = transformation_matrix @ self.components
        
    def spinor_symbolic_transform(self, spinor_expression: str):
        """Placeholder for symbolic spinor transformations"""
        print(f"Applying symbolic transformation to spinor: {spinor_expression}")
        # This would be implemented with a computer algebra system
        
    def _initialize_gamma_matrices(self) -> Dict[str, np.ndarray]:
        """Initialize gamma matrices for spinor calculations"""
        # Pauli matrices
        sigma_x = np.array([[0, 1], [1, 0]])
        sigma_y = np.array([[0, -1j], [1j, 0]])
        sigma_z = np.array([[1, 0], [0, -1]])
        
        return {
            "sigma_x": sigma_x,
            "sigma_y": sigma_y,
            "sigma_z": sigma_z
        }
