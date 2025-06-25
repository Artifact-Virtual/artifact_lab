from setuptools import setup, find_packages

setup(
    name="anf",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        'numpy>=1.21.0',
        'sympy>=1.10.0',
        'rich>=12.0.0',
        'mpmath>=1.2.1',
        'qiskit>=0.36.0',
        'torch>=1.10.0',
        'itensor>=3.1.8',
        'pandas>=1.4.0',
        'matplotlib>=3.5.0',
    ],
    extras_require={
        'dev': [
            'pytest>=6.0.0',
            'pytest-repeat>=0.9.3',
            'pytest-xdist>=3.6.1',
            'jupyter>=1.0.0',
        ],
        'mpi': ['mpi4py>=3.1.3'],
    }
)
