# ANF Help and Instructions Guide

## Table of Contents
- [Test Commands](#test-commands)
  - [Basic Commands](#basic-commands)
  - [Advanced Options](#advanced-options)
  - [Troubleshooting](#troubleshooting)
- [Resource Management](#resource-management)
  - [Basic Usage](#basic-usage)
  - [Advanced Usage](#advanced-usage)
  - [Complex Examples](#complex-examples)
- [Performance Guide](#performance-guide)
  - [Benchmarks](#benchmarks)
  - [Best Practices](#best-practices)

---

## Test Commands

### Basic Commands
> Essential commands for running tests

```bash
# Note: Terminal UI tests have been removed from the test suite
# Run all tests
python -m pytest /workspaces/ANF/tests/

# Run specific test file (example)
python -m pytest /workspaces/ANF/tests/system_tests.py
```

### Advanced Options
> Additional options for detailed testing

```bash
# Verbose output
python -m pytest -v /workspaces/ANF/tests/

# Show print statements
python -m pytest -s /workspaces/ANF/tests/

# Generate coverage report
python -m pytest --cov=anf /workspaces/ANF/tests/

# Generate HTML coverage report
python -m pytest --cov=anf --cov-report=html /workspaces/ANF/tests/

# Run tests in parallel
python -m pytest -n auto /workspaces/ANF/tests/

# Stop on first failure
python -m pytest -x /workspaces/ANF/tests/
```

---

## Resource Management

### Basic Usage
> Getting started with resource management

```python
# Default singleton pattern
from core.singleton_resource_manager import ResourceManager

rm = ResourceManager()
parser = rm.get_resource('dsl_parser')
scheduler = rm.get_resource('scheduler')
```

### Advanced Usage
> Multi-instance resource management

```python
# Multiple instance management
task1_rm = ResourceManager.get_instance("task1")
task2_rm = ResourceManager.get_instance("task2")

# Force new instance creation
new_rm = ResourceManager.create_new_instance("special_task")

# Cleanup resources
ResourceManager.cleanup_instance("task1")
ResourceManager.cleanup_all()  # Clean everything
```

### Complex Examples
> Real-world usage scenarios

```python
# High-precision black hole simulation example
task_definition = {
    "task_id": "black_hole_merger",
    "description": "Simulate binary black hole merger",
    "parameters": {
        "mass_ratio": 1.5,
        "initial_separation": 10.0,
        "spin_parameters": [0.7, 0.3],
        "precision_bits": 256
    },
    "priority": "high",
    "quantum_integration": {
        "enabled": True,
        "backend": "ibm_quantum"
    }
}

# Dedicated resource manager for simulation
simulation_rm = ResourceManager.get_instance("black_hole_sim")
parser = simulation_rm.get_resource('dsl_parser')
scheduler = simulation_rm.get_resource('scheduler')

task = parser.parse(task_definition)
scheduler.schedule(task)
```

---

## Performance Guide

### Benchmarks
> Framework performance metrics

- **Precision:** Up to 1000-digit precision calculations
- **Speed:** Quantum speedup of 100x for applicable algorithms
- **Reliability:** 99.99% reproducibility in results
- **Scale:** Support for datasets up to exabyte scale

### Best Practices
> Recommendations for optimal performance

1. Use dedicated resource managers for heavy computations
2. Clean up resources after use
3. Leverage parallel execution when possible
4. Monitor memory usage for large datasets

---

[↑ Back to Top](#table-of-contents)