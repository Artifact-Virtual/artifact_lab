from ui_task_definition.task_object import TaskObject

class DSLParser:
    def parse(self, dsl_input):
        print("Parsing DSL input...")
        priority = dsl_input.get("priority")
        performance_goals = dsl_input.get("performance")
        precision = dsl_input.get("precision")  # New: Parse precision
        tensor_representation = dsl_input.get("tensor_representation")  # New: Parse tensor representation
        quantum_integration = dsl_input.get("quantum_integration")  # New: Parse quantum integration
        symbolic_computation = dsl_input.get("symbolic_computation")  # New: Parse symbolic computation
        spinor_representation = dsl_input.get("spinor_representation")  # New: Parse spinor representation
        arbitrary_precision_level = dsl_input.get("arbitrary_precision_level", 28)

        return TaskObject(
            task_id=dsl_input.get("task_id", "example"),
            description=dsl_input.get("description", "Parsed task"),
            parameters=dsl_input.get("parameters", {}),
            priority=priority,
            performance_goals=performance_goals,
            precision=precision,
            tensor_representation=tensor_representation,
            quantum_integration=quantum_integration,
            symbolic_computation=symbolic_computation,
            spinor_representation=spinor_representation,
            arbitrary_precision_level=arbitrary_precision_level,
        )
