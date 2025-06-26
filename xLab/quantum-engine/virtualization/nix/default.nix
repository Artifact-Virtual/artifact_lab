{ 
  "description": "Nix package configuration for the quantum engine.",
  "inputs": {
    "backend": "python3",
    "dependencies": [
      "numpy",
      "scipy",
      "qiskit",
      "cirq",
      "qutip",
      "braket",
      "rust",
      "go",
      "solidity"
    ]
  },
  "outputs": {
    "build": {
      "python": "pip install -r requirements.txt",
      "rust": "cargo build --release",
      "go": "go build"
    }
  }
}