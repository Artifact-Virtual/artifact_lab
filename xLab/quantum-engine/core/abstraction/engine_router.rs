// This file implements the engine router in Rust. It routes requests to the appropriate backend based on user input.

mod backends;

use backends::{QiskitBackend, CirqBackend, QuTiPBackend, RustNativeBackend, BraketClient, SolidityQasmBridge};
use std::collections::HashMap;

pub struct EngineRouter {
    backends: HashMap<String, Box<dyn QuantumBackend>>,
}

impl EngineRouter {
    pub fn new() -> Self {
        let mut backends = HashMap::new();
        backends.insert("qiskit".to_string(), Box::new(QiskitBackend::new()));
        backends.insert("cirq".to_string(), Box::new(CirqBackend::new()));
        backends.insert("qutip".to_string(), Box::new(QuTiPBackend::new()));
        backends.insert("rust_native".to_string(), Box::new(RustNativeBackend::new()));
        backends.insert("braket".to_string(), Box::new(BraketClient::new()));
        backends.insert("solidity".to_string(), Box::new(SolidityQasmBridge::new()));

        EngineRouter { backends }
    }

    pub fn route(&self, backend_name: &str) -> Option<&Box<dyn QuantumBackend>> {
        self.backends.get(backend_name)
    }
}

pub trait QuantumBackend {
    fn initialize(&self);
    fn execute(&self, job: &str);
}