import os
from datetime import datetime
from typing import Dict, Any, Optional, List
import numpy as np
from rich.console import Console
from rich.markdown import Markdown

class CalculationReportingService:
    """Dedicated service for generating detailed calculation reports"""
    
    def __init__(self):
        self.console = Console()
        self.report_dir = os.path.dirname(os.path.dirname(__file__))
    
    def generate_report(self, 
                       calculation_type: str,
                       inputs: Dict[str, Any],
                       results: Dict[str, Any],
                       additional_info: Optional[Dict[str, Any]] = None) -> str:
        """Generate a detailed calculation report"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"Your_Calculation_Report_{timestamp}.md"
        report_path = os.path.join(self.report_dir, report_filename)
        
        report_content = [
            f"# ANF Apex Calculation Report",
            f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}",
            f"\n## Calculation Type",
            f"{calculation_type}",
            f"\n## Input Parameters"
        ]
        
        # Format input parameters
        for key, value in inputs.items():
            report_content.append(f"- **{key}**: {self._format_value(value)}")
        
        # Add results section with enhanced visualization
        report_content.extend(self._generate_results_section(results))
        
        # Add any additional information
        if additional_info:
            report_content.append("\n## Additional Information")
            for key, value in additional_info.items():
                if isinstance(value, dict):
                    report_content.append(f"\n### {key}")
                    for subkey, subvalue in value.items():
                        report_content.append(f"- **{subkey}**: {self._format_value(subvalue)}")
                else:
                    report_content.append(f"- **{key}**: {self._format_value(value)}")
        
        # Add explanatory notes and visualizations
        report_content.extend(self._generate_explanatory_section(calculation_type, results))
        
        # Write report to file
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_content))
        
        return report_path
    
    def _format_value(self, value: Any) -> str:
        """Format values for report display"""
        if isinstance(value, (float, np.floating)):
            if abs(value) > 1e4 or abs(value) < 1e-4:
                return f"{value:.6e}"
            return f"{value:.6f}"
        if isinstance(value, np.ndarray):
            return f"Array of shape {value.shape}"
        return str(value)
    
    def _generate_results_section(self, results: Dict[str, Any]) -> List[str]:
        """Generate the results section with enhanced visualization"""
        content = ["\n## Results"]
        
        # Add main results
        for key, value in results.items():
            if isinstance(value, dict) and key != 'uncertainties':
                content.append(f"\n### {key}")
                for subkey, subvalue in value.items():
                    content.append(f"- **{subkey}**: {self._format_value(subvalue)}")
            elif key != 'uncertainties':
                content.append(f"- **{key}**: {self._format_value(value)}")
        
        # Add uncertainty analysis if present
        if 'uncertainties' in results:
            content.extend(self._generate_uncertainty_section(results))
        
        return content
    
    def _generate_uncertainty_section(self, results: Dict[str, Any]) -> List[str]:
        """Generate uncertainty analysis section"""
        content = ["\n### Uncertainty Analysis"]
        
        uncertainties = results['uncertainties']
        for key, value in uncertainties.items():
            content.append(f"- **{key}**: {self._format_value(value)}")
        
        # Add visualization if applicable
        if 'energy_uncertainty_joules' in uncertainties and 'energy_joules' in results:
            nominal = float(results['energy_joules'])
            uncertainty = float(uncertainties['energy_uncertainty_joules'])
            rel_error = (uncertainty/nominal) * 100
            
            content.extend([
                "\n### Uncertainty Visualization",
                "```mermaid",
                "graph LR",
                "    N[Nominal Value] --> R[Result]",
                "    U[Uncertainty] --> R",
                f"    R[±{rel_error:.2f}% Relative Error]",
                "```"
            ])
        
        return content
    
    def _generate_explanatory_section(self, calc_type: str, results: Dict[str, Any]) -> List[str]:
        """Generate explanatory notes and visualizations based on calculation type"""
        content = ["\n## Explanatory Notes"]
        
        if calc_type == "relativistic":
            content.extend(self._generate_relativistic_notes(results))
        elif calc_type == "quantum":
            content.extend(self._generate_quantum_notes(results))
        elif calc_type == "gravitational":
            content.extend(self._generate_gravitational_notes(results))
        
        # Add physical comparisons if present
        if 'comparisons' in results:
            content.extend(self._generate_comparison_section(results['comparisons']))
        
        return content
    
    def _generate_relativistic_notes(self, results: Dict[str, Any]) -> List[str]:
        """Generate relativistic physics explanatory notes"""
        notes = [
            "### Understanding Relativistic Effects",
            "- Special relativity effects become significant at velocities approaching the speed of light",
            "- Time dilation and length contraction are reciprocal effects",
            "- Rest energy (E = mc²) represents the total energy content of mass",
            "\n### Energy Scale Comparisons",
            "For context, this amount of energy is:"
        ]
        
        if 'energy_joules' in results:
            energy_joules = float(results['energy_joules'])
            comparisons = [
                f"- Equivalent to {energy_joules/4.18e9:.1f} tons of TNT",
                f"- Could power an average household for {energy_joules/(10000*365*24):.1f} years",
                f"- Comparable to {energy_joules/3.6e6:.1f} kWh of electrical energy"
            ]
            notes.extend(comparisons)
            
            # Add energy scale visualization
            notes.extend([
                "\n### Energy Scale Visualization",
                "```mermaid",
                "graph LR",
                "    E[Your Result] --> TNT[TNT Equivalent]",
                "    E --> H[Household Power]",
                "    E --> EL[Electrical Energy]",
                f"    TNT[{energy_joules/4.18e9:.1f} tons TNT]",
                f"    H[{energy_joules/(10000*365*24):.1f} years of power]",
                f"    EL[{energy_joules/3.6e6:.1f} kWh]",
                "```"
            ])
        
        return notes
    
    def _generate_quantum_notes(self, results: Dict[str, Any]) -> List[str]:
        """Generate quantum physics explanatory notes"""
        notes = [
            "### Quantum Mechanical Interpretation",
            "- Wave functions represent probability amplitudes",
            "- Quantum states can exhibit superposition and entanglement",
            "- Measurements affect the quantum state (wave function collapse)",
            "\n### Quantum State Analysis",
            "- Normalized probability distribution shown below",
            "- Uncertainty relations are preserved",
            "- Coherence effects considered"
        ]
        
        if 'wave_function' in results:
            notes.extend([
                "\n### Quantum State Visualization",
                "```mermaid",
                "graph TD",
                "    WF[Wave Function] --> P[Probability]",
                "    WF --> PH[Phase]",
                "    P --> |Measurement| M[Observable]",
                "    PH --> |Interference| I[Quantum Effects]",
                "```"
            ])
        
        return notes
    
    def _generate_gravitational_notes(self, results: Dict[str, Any]) -> List[str]:
        """Generate gravitational physics explanatory notes"""
        notes = [
            "### Gravitational Physics Concepts",
            "- Spacetime curvature determines gravitational effects",
            "- Event horizons mark points of no return for light",
            "- Gravitational waves carry energy and information",
            "\n### Spacetime Analysis",
            "- Metric tensor describes local geometry",
            "- Geodesic paths show natural motion",
            "- Curvature indicates gravitational strength"
        ]
        
        if 'metric' in results:
            notes.extend([
                "\n### Spacetime Geometry Visualization",
                "```mermaid",
                "graph TD",
                "    M[Metric] --> C[Curvature]",
                "    M --> G[Geodesics]",
                "    C --> EH[Event Horizons]",
                "    G --> PM[Particle Motion]",
                "```"
            ])
        
        return notes
    
    def _generate_comparison_section(self, comparisons: Dict[str, Any]) -> List[str]:
        """Generate physical comparisons section"""
        content = [
            "\n### Physical Comparisons",
            "The results are compared with familiar physical phenomena:"
        ]
        
        for key, value in comparisons.items():
            content.append(f"- {value}")
        
        return content