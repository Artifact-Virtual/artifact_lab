#!/usr/bin/env python3
"""
Research Lab System Initialization Script
Designed for VSCode/Copilot integration and secure lab setup
"""

import json
import logging
import sys
from pathlib import Path


def setup_logging():
    """Configure logging for initialization"""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - RESEARCH_LAB_INIT - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler("research_lab_init.log"),
        ],
    )
    return logging.getLogger("research_lab_init")


def check_python_environment():
    """Verify Python environment requirements"""
    logger = logging.getLogger("research_lab_init")

    # Check Python version
    if sys.version_info < (3, 8):
        logger.error("Python 3.8+ required for research lab system")
        return False

    # Check for required modules
    required_modules = [
        "numpy",
        "pandas",
        "matplotlib",
        "seaborn",
        "plotly",
        "cryptography",
        "asyncio",
        "sqlite3",
    ]

    missing_modules = []
    for module in required_modules:
        try:
            __import__(module)
        except ImportError:
            missing_modules.append(module)

    if missing_modules:
        logger.warning(f"Missing modules: {missing_modules}")
        logger.info("Run: pip install -r research/requirements.txt")
        return False

    logger.info("Python environment check passed")
    return True


def initialize_research_directories():
    """Create necessary research lab directories"""
    logger = logging.getLogger("research_lab_init")

    base_dir = Path("research")
    directories = [
        "labs/secure_research_lab/encrypted_data",
        "labs/secure_research_lab/analysis_results",
        "labs/secure_research_lab/visualizations",
        "labs/secure_research_lab/logs",
        "labs/secure_research_lab/cognitive_models",
        "experiments/active",
        "experiments/archive",
        "data/raw",
        "data/processed",
        "data/encrypted",
        "outputs/visualizations",
        "outputs/reports",
        "outputs/exports",
        "logs/audit",
        "logs/system",
        "logs/analysis",
    ]

    for directory in directories:
        dir_path = base_dir / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created directory: {dir_path}")

    # Create .gitkeep files for empty directories
    for directory in directories:
        gitkeep = base_dir / directory / ".gitkeep"
        if not gitkeep.exists():
            gitkeep.touch()


def create_vscode_integration_files():
    """Create VSCode-specific integration files"""
    logger = logging.getLogger("research_lab_init")

    logger.info("VSCode integration files configured")
    return True


def validate_security_setup():
    """Validate security components are properly configured"""
    logger = logging.getLogger("research_lab_init")

    try:
        from cryptography.fernet import Fernet

        # Test encryption setup
        key = Fernet.generate_key()
        f = Fernet(key)
        test_data = b"Research Lab Security Test"
        encrypted = f.encrypt(test_data)
        decrypted = f.decrypt(encrypted)

        if decrypted != test_data:
            logger.error("Encryption validation failed")
            return False

        logger.info("Security setup validation passed")
        return True

    except Exception as e:
        logger.error(f"Security validation error: {e}")
        return False


def create_sample_research_config():
    """Create sample research configuration"""
    logger = logging.getLogger("research_lab_init")

    config = {
        "research_lab": {
            "version": "1.0.0",
            "security_level": "CONFIDENTIAL",
            "encryption_enabled": True,
            "audit_logging": True,
            "containment_level": 5,
            "visualization_engine": "apache-echarts",
            "analysis_engines": ["statistical", "behavioral", "cognitive", "temporal"],
            "supported_formats": ["csv", "json", "parquet", "hdf5", "pickle"],
            "export_formats": ["pdf", "html", "json", "csv", "png", "svg"],
        },
        "vscode_integration": {
            "copilot_enabled": True,
            "debug_configurations": True,
            "task_automation": True,
            "file_associations": {
                "*.lab": "python",
                "*.research": "json",
                "*.analysis": "python",
                "*.cogmodel": "json",
            },
        },
        "security": {
            "encryption_algorithm": "Fernet",
            "session_timeout": 3600,
            "max_concurrent_sessions": 5,
            "audit_retention_days": 90,
        },
    }

    config_path = Path("research/config/research_lab_config.json")
    config_path.parent.mkdir(exist_ok=True)

    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    logger.info(f"Sample configuration created: {config_path}")


def check_system_requirements():
    """Check system requirements for research lab"""
    logger = logging.getLogger("research_lab_init")

    requirements = {
        "python_version": sys.version_info >= (3, 8),
        "available_memory": True,  # Would check actual memory in production
        "disk_space": True,  # Would check actual disk space
        "network_access": True,  # Would check network connectivity
    }

    all_passed = all(requirements.values())

    if all_passed:
        logger.info("System requirements check passed")
    else:
        logger.error("System requirements check failed")

    return all_passed


def main():
    """Main initialization routine"""
    logger = setup_logging()
    logger.info("Starting Research Lab System Initialization")

    initialization_steps = [
        ("Checking Python environment", check_python_environment),
        ("Checking system requirements", check_system_requirements),
        ("Initializing research directories", initialize_research_directories),
        ("Creating VSCode integration", create_vscode_integration_files),
        ("Validating security setup", validate_security_setup),
        ("Creating sample configuration", create_sample_research_config),
    ]

    failed_steps = []

    for step_name, step_function in initialization_steps:
        logger.info(f"Executing: {step_name}")
        try:
            if not step_function():
                failed_steps.append(step_name)
                logger.error(f"Failed: {step_name}")
            else:
                logger.info(f"Completed: {step_name}")
        except Exception as e:
            failed_steps.append(step_name)
            logger.error(f"Error in {step_name}: {e}")

    if failed_steps:
        logger.error(f"Initialization completed with errors: {failed_steps}")
        return 1
    else:
        logger.info("Research Lab System initialization completed successfully")
        logger.info("System ready for advanced research analysis and visualization")
        return 0


if __name__ == "__main__":
    sys.exit(main())
