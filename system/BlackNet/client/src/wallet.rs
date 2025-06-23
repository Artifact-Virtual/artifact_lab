// This file contains the wallet management functionality for the client. 

pub struct Wallet {
    pub balance: f64,
    pub address: String,
}

impl Wallet {
    pub fn new(address: String) -> Self {
        Wallet {
            balance: 0.0,
            address,
        }
    }

    pub fn deposit(&mut self, amount: f64) {
        self.balance += amount;
    }

    pub fn withdraw(&mut self, amount: f64) -> Result<f64, String> {
        if amount > self.balance {
            Err(String::from("Insufficient balance"))
        } else {
            self.balance -= amount;
            Ok(amount)
        }
    }

    pub fn get_balance(&self) -> f64 {
        self.balance
    }

    pub fn get_address(&self) -> &String {
        &self.address
    }
}