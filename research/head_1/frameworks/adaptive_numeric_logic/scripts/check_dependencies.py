import subprocess
import sys
import pkg_resources
from typing import List, Tuple

def check_dependencies() -> List[Tuple[str, bool]]:
    """Check if all required dependencies are installed."""
    with open('../requirements.txt') as f:
        requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    
    results = []
    for req in requirements:
        try:
            pkg_resources.require(req)
            results.append((req, True))
        except (pkg_resources.DistributionNotFound, pkg_resources.VersionConflict):
            results.append((req, False))
    return results

def install_missing(missing: List[str]) -> bool:
    """Install missing dependencies."""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing)
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    print("Checking ANF dependencies...")
    results = check_dependencies()
    
    missing = [req for req, installed in results if not installed]
    
    if not missing:
        print("✅ All dependencies are satisfied!")
        return 0
    
    print(f"❌ Missing {len(missing)} dependencies:")
    for pkg in missing:
        print(f"  - {pkg}")
    
    response = input("Would you like to install missing dependencies? [y/N] ")
    if response.lower() == 'y':
        if install_missing(missing):
            print("✅ Successfully installed missing dependencies!")
            return 0
        else:
            print("❌ Failed to install some dependencies")
            return 1
    return 1

if __name__ == '__main__':
    sys.exit(main())
