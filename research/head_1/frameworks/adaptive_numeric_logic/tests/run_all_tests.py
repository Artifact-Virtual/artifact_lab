import unittest
import sys
import os
import platform
import json
import psutil
from datetime import datetime

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_system_diagnostics():
    """Collect system diagnostics"""
    diagnostics = {
        "timestamp": datetime.now().isoformat(),
        "system": platform.system(),
        "architecture": platform.machine(),
        "python_version": sys.version,
        "cpu_count": os.cpu_count(),
        "total_memory": psutil.virtual_memory().total / (1024**3),  # in GB
        "disk_usage": psutil.disk_usage('/').percent,
        "cpu_usage": psutil.cpu_percent(interval=1),
        "memory_usage": psutil.virtual_memory().percent,
    }
    return diagnostics

def run_test_suite():
    """Run all tests and return results"""
    # Discover and run tests
    loader = unittest.TestLoader()
    start_dir = os.path.dirname(os.path.abspath(__file__))
    suite = loader.discover(start_dir, pattern="test_*.py")
    
    # Run tests with verbosity
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result

def generate_test_report(result, diagnostics):
    """Generate a test report in Markdown format"""
    report = f"""
# System Test Report

## System Diagnostics
```json
{json.dumps(diagnostics, indent=4)}
```

## Test Summary
- Tests Run: {result.testsRun}
- Failures: {len(result.failures)}
- Errors: {len(result.errors)}
- Skipped: {len(result.skipped)}
- Success: {result.wasSuccessful()}
"""
    return report

def append_to_test_report(report, filename="test_report.md"):
    """Append the report to the specified file"""
    try:
        with open(filename, "a") as f:
            f.write(report)
        print(f"Appended test report to {filename}")
    except Exception as e:
        print(f"Error appending to test report: {e}")

if __name__ == '__main__':
    result = run_test_suite()
    
    # Print summary
    print("\nTest Summary:")
    print(f"Tests Run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    
    # Generate and append test report
    diagnostics = get_system_diagnostics()
    report = generate_test_report(result, diagnostics)
    append_to_test_report(report)
    
    # Exit with appropriate code
    if result.wasSuccessful():
        sys.exit(0)
    else:
        sys.exit(1)
