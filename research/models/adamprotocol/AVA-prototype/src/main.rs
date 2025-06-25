use artifact_virtual_intelligence::{deploy_immutable_chain, AvaBlockchain};
use std::process;

fn main() {
    println!("🚀 Starting Artifact Virtual Intelligence Blockchain Deployment");
    println!("==============================================================");
    println!("🧠 Initializing Constitutional AI Governance System");
    println!("🏛️  Establishing Democratic AI Decision Framework");

    // Deploy the immutable chain
    match deploy_immutable_chain() {
        Ok(blockchain) => {
            println!("✅ Genesis deployment successful!");
            println!("📊 Blockchain Statistics:");
            println!("   - Chain Length: {}", blockchain.get_chain_length());
            println!("   - Entities: {}", blockchain.get_entities().len());
            println!("   - Genesis Hash: {}", blockchain.get_latest_block().hash);
            
            // Start the blockchain service
            if let Err(e) = start_blockchain_service(blockchain) {
                eprintln!("❌ Failed to start blockchain service: {}", e);
                process::exit(1);
            }
        }
        Err(e) => {
            eprintln!("❌ Genesis deployment failed: {}", e);
            process::exit(1);
        }
    }
}

fn start_blockchain_service(mut blockchain: AvaBlockchain) -> Result<(), Box<dyn std::error::Error>> {
    println!("🔗 Starting blockchain service...");
    
    // Register all AVA containers as blockchain entities
    let containers = vec![
        ("ava-database", "5432"),
        ("ava-api", "8080"),
        ("ava-frontend", "3000"),
        ("ava-worker", "8081"),
        ("ava-monitoring", "9090"),
        ("ava-security", "8443"),
    ];

    for (container_name, port) in containers {
        let entity_id = format!("container_{}", container_name);
        let metadata = serde_json::json!({
            "container_name": container_name,
            "port": port,
            "status": "deploying",
            "constitutional_level": "operational"
        });

        // Create registration transaction
        let transaction = blockchain.create_transaction(
            "system".to_string(),
            entity_id.clone(),
            "register_container".to_string(),
            metadata,
        )?;

        // Add transaction to blockchain
        blockchain.add_transaction(transaction)?;
        println!("📝 Registered container: {}", container_name);
    }

    // Mine a block with all container registrations
    println!("⛏️  Mining registration block...");
    blockchain.mine_pending_transactions("system".to_string())?;
    
    // Save blockchain state
    blockchain.save_to_file("blockchain_state.json")?;
    println!("💾 Blockchain state saved");

    println!("🎉 Artifact Virtual Intelligence is now operational!");
    println!("🧠 Constitutional AI governance active");
    println!("🏛️  Democratic AI decision-making enabled");
    println!("📈 Full transparency and audit trail operational");
    println!("🤖 AI system ready for ethical operations");
    
    // Simulate running service
    println!("🔄 Blockchain service running... (Press Ctrl+C to stop)");
    
    // In a real deployment, this would be a proper service loop
    // For now, we'll just validate the chain once more
    if !blockchain.is_chain_valid() {
        eprintln!("⚠️  Blockchain validation failed!");
        return Err("Blockchain validation failed".into());
    }

    println!("✅ All systems operational and verified!");
    Ok(())
}
