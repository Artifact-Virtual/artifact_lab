# cirq.py

from cirq import Circuit, Simulator, GridQubit, H, X, Measure

class CirqBackend:
    def __init__(self):
        self.simulator = Simulator()

    def create_circuit(self, qubits, operations):
        circuit = Circuit()
        for op in operations:
            circuit.append(op)
        return circuit

    def run_circuit(self, circuit):
        result = self.simulator.run(circuit)
        return result

    def measure(self, qubits):
        return [Measure(qubit) for qubit in qubits]

# Example usage
if __name__ == "__main__":
    backend = CirqBackend()
    qubits = [GridQubit(0, 0), GridQubit(0, 1)]
    operations = [H(qubits[0]), X(qubits[1])]
    circuit = backend.create_circuit(qubits, operations)
    circuit += backend.measure(qubits)
    result = backend.run_circuit(circuit)
    print("Measurement results:", result)