def initialize_backend():
    """Initialize the Qiskit backend."""
    from qiskit import Aer, transpile, assemble, execute
    backend = Aer.get_backend('qasm_simulator')
    return backend

def compile_circuit(circuit):
    """Compile the quantum circuit for execution."""
    from qiskit import transpile
    compiled_circuit = transpile(circuit, backend=initialize_backend())
    return compiled_circuit

def execute_job(compiled_circuit):
    """Execute the compiled quantum job and return the results."""
    from qiskit import execute
    job = execute(compiled_circuit, backend=initialize_backend())
    result = job.result()
    return result

def get_job_results(result):
    """Extract results from the executed job."""
    counts = result.get_counts()
    return counts

# Example usage:
# circuit = ...  # Define your quantum circuit here
# compiled = compile_circuit(circuit)
# result = execute_job(compiled)
# counts = get_job_results(result)
# print(counts)