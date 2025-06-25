// Artifact Virtual Intelligence - Constitutional AI Blockchain Library
// Rust implementation of the immutable blockchain for Artifact Virtual Intelligence and AVA

pub mod blockchain;
pub mod genesis;
pub mod constitutional;

pub use blockchain::{AvaBlockchain, Block, Transaction, EntityMetadata, BlockchainStatus};
pub use genesis::GenesisBuilder;
pub use constitutional::{ConstitutionalEngine, GovernanceRule};

use chrono::Utc;
use serde_json;

/// Initialize the Artifact Virtual Intelligence blockchain with dual genesis
pub fn initialize_ava_blockchain() -> Result<AvaBlockchain, String> {
    let mut blockchain = AvaBlockchain::new();
    
    // Create the dual genesis blocks
    blockchain.create_dual_genesis()?;
    
    println!("🌟 Artifact Virtual Intelligence Blockchain Initialized Successfully!");
    println!("📊 Genesis Status: {}", blockchain.get_status());
    
    Ok(blockchain)
}

/// Deploy the immutable chain for Artifact Virtual Intelligence and AVA
pub fn deploy_immutable_chain() -> Result<AvaBlockchain, String> {
    println!("🚀 Deploying Artifact Virtual Intelligence Blockchain...");
    println!("🧠 Initializing Constitutional AI Governance...");
    println!("🏛️  Establishing Democratic AI Framework...");
    
    // Initialize blockchain
    let mut blockchain = initialize_ava_blockchain()?;
    
    // Verify chain integrity
    if !blockchain.is_chain_valid() {
        return Err("Blockchain validation failed".to_string());
    }
    
    // Create initial container registration transactions
    let containers = vec![
        ("ava-core", "Constitutional Identity & Governance Management"),
        ("memory-core", "Immutable Logs & Merkle Tree Structure"),
        ("perception-layer", "Multi-modal Perception Engine"),
        ("action-layer", "Constitutional Intelligence Execution"),
        ("vault", "Secure Storage & Cryptographic Operations"),
        ("evolver", "Self-improvement & Adaptive Learning"),
    ];
    
    for (container_name, description) in containers {
        let transaction = Transaction {
            id: format!("register_{}", container_name),
            transaction_type: blockchain::TransactionType::ModuleDeployment,
            sender: "AVA".to_string(),
            recipient: Some(container_name.to_string()),
            data: serde_json::json!({
                "container_name": container_name,
                "description": description,
                "port": get_container_port(container_name),
                "status": "DEPLOYED"
            }),
            timestamp: Utc::now(),
            signature: format!("sig_{}", container_name),
            constitutional_validation: true,
        };
        
        blockchain.add_transaction(transaction)?;
    }
    
    // Create block with container registrations
    let container_block = blockchain.create_block()?;
    println!("📦 Container Registration Block Created: {}", container_block.hash);
    
    // Final validation
    if blockchain.is_chain_valid() {
        println!("✅ Immutable Chain Deployment Successful!");
        println!("📊 Final Status: {}", blockchain.get_status());
          // Save blockchain state to file
        save_blockchain_state(&blockchain)?;
        
        Ok(blockchain)
    } else {
        Err("Final blockchain validation failed".to_string())
    }
}

/// Get container port mapping
fn get_container_port(container_name: &str) -> u16 {
    match container_name {
        "ava-core" => 5001,
        "memory-core" => 5002,
        "perception-layer" => 5003,
        "action-layer" => 5004,
        "vault" => 5005,
        "evolver" => 5006,
        _ => 5000,
    }
}

/// Save blockchain state to JSON file
fn save_blockchain_state(blockchain: &AvaBlockchain) -> Result<(), String> {
    let state = serde_json::json!({
        "timestamp": Utc::now(),
        "blockchain_status": blockchain.get_status(),
        "total_blocks": blockchain.chain.len(),
        "entities": blockchain.entities,
        "latest_blocks": blockchain.chain.iter().take(5).collect::<Vec<_>>()
    });
    
    std::fs::write("ava_blockchain_state.json", serde_json::to_string_pretty(&state).unwrap())
        .map_err(|e| format!("Failed to save blockchain state: {}", e))?;
    
    println!("💾 Blockchain state saved to ava_blockchain_state.json");
    Ok(())
}

/// Main entry point for blockchain deployment
pub fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🌟 AVA Constitutional Intelligence - Blockchain Deployment");
    println!("═══════════════════════════════════════════════════════════");
      match deploy_immutable_chain() {
        Ok(blockchain) => {
            println!("🎉 Deployment completed successfully!");
            println!("🔗 Artifact Virtual Intelligence and AVA are now on the immutable chain!");
            println!("📊 Blockchain Status: {}", blockchain.get_status());
        },
        Err(e) => {
            eprintln!("❌ Deployment failed: {}", e);
            return Err(e.into());
        }
    }
    
    Ok(())
}
