# ANF Test Commands Reference

## Basic Test Commands

Run all tests:
```bash
python -m pytest /workspaces/ANF/tests/
```

Run specific test file:
```bash
python -m pytest /workspaces/ANF/tests/system_tests.py
```

Run specific test case:
```bash
python -m pytest /workspaces/ANF/tests/system_tests.py::TestSystem::test_end_to_end_workflow
```

## Test Options

Common pytest options:
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

## Examples

Run full test suite with coverage:
```bash
python -m pytest --verbose --cov=anf --cov-report=html /workspaces/ANF/tests/
```

Run specific module tests with verbose output:
```bash
python -m pytest -v /workspaces/ANF/tests/test_quantum_integration.py
```

## Troubleshooting

If tests fail to discover:
```bash
# Ensure pytest is installed
pip install pytest pytest-cov

# Check Python path
python -c "import sys; print(sys.path)"
```
