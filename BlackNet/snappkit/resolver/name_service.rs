// This file implements the name resolution service for the SDK. 

use std::collections::HashMap;

pub struct NameService {
    names: HashMap<String, String>,
}

impl NameService {
    pub fn new() -> Self {
        NameService {
            names: HashMap::new(),
        }
    }

    pub fn register(&mut self, name: String, address: String) {
        self.names.insert(name, address);
    }

    pub fn resolve(&self, name: &str) -> Option<&String> {
        self.names.get(name)
    }
}