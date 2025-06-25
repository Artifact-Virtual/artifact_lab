from ui_task_definition.task_object import TaskObject
from ui_task_definition.dsl_parser import DSLParser
from control_orchestration.task_management import TaskScheduler
from computational_core.quantum_computing import QuantumIntegration

# Example 1: Solving a simple equation
task_definition_1 = {
    "task_id": "solve_equation",
    "description": "Solve the equation x + 2 = 5",
    "parameters": {"equation": "x + 2 = 5"},
    "priority": "high",
}

parser = DSLParser()
task1 = parser.parse(task_definition_1)

scheduler = TaskScheduler()
scheduler.schedule(task1)

# Example 2: Quantum computation
task_definition_2 = {
    "task_id": "quantum_entanglement",
    "description": "Create and measure an entangled pair of qubits",
    "parameters": {"num_qubits": 2},
    "priority": "medium",
    "quantum_integration": {"quantum_backend": "ibm_qiskit"}
}

task2 = parser.parse(task_definition_2)
scheduler.schedule(task2)

quantum_integration = QuantumIntegration(quantum_backend="ibm_qiskit")
quantum_integration.execute_quantum_task(task2)

# Example 3: Tensor contraction
task_definition_3 = {
    "task_id": "tensor_contraction",
    "description": "Contract two tensors",
    "parameters": {"tensor1_dims": [2, 2], "tensor2_dims": [2, 2]},
    "priority": "low",
    "tensor_representation": {"tensor_library": "numpy"}
}

task3 = parser.parse(task_definition_3)
scheduler.schedule(task3)

print("Examples executed.")
