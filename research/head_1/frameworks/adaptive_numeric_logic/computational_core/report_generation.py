import os
from datetime import datetime
from typing import Dict, Any, Optional
from rich.console import Console
from rich.markdown import Markdown
from .test_reporting_service import TestReportingService
from .calculation_reporting_service import CalculationReportingService

class ReportGenerator:
    """Facade for managing both calculation and test reporting services"""
    
    def __init__(self):
        self.console = Console()
        self.calc_reporter = CalculationReportingService()
        self.test_reporter = TestReportingService()
    
    def generate_calculation_report(self, 
                                 calculation_type: str,
                                 inputs: Dict[str, Any],
                                 results: Dict[str, Any],
                                 additional_info: Optional[Dict[str, Any]] = None) -> str:
        """Generate a detailed calculation report using the calculation reporting service"""
        return self.calc_reporter.generate_report(
            calculation_type=calculation_type,
            inputs=inputs,
            results=results,
            additional_info=additional_info
        )
    
    def update_test_report(self, test_results: Dict[str, Any]) -> None:
        """Update test reports using the test reporting service"""
        self.test_reporter.update_test_report(test_results)