// AVA Immutable Blockchain Implementation
// Genesis Chain for Artifact Virtual and AVA Constitutional Intelligence

use sha2::{Sha256, Digest};
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fmt;

/// Block structure for the immutable chain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: DateTime<Utc>,
    pub previous_hash: String,
    pub hash: String,
    pub data: BlockData,
    pub nonce: u64,
    pub difficulty: u32,
}

/// Block data containing transactions and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockData {
    pub transactions: Vec<Transaction>,
    pub entity_metadata: Option<EntityMetadata>,
    pub constitutional_rules: Vec<Rule>,
    pub governance_actions: Vec<GovernanceAction>,
}

/// Transaction structure for constitutional operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub transaction_type: TransactionType,
    pub sender: String,
    pub recipient: Option<String>,
    pub data: serde_json::Value,
    pub timestamp: DateTime<Utc>,
    pub signature: String,
    pub constitutional_validation: bool,
}

/// Types of transactions in the system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionType {
    GenesisCreation,
    EntityRegistration,
    GovernanceProposal,
    ConstitutionalAmendment,
    ResourceAllocation,
    ModuleDeployment,
    CrossChainBridge,
    AIModelUpdate,
    PermissionGrant,
    EmergencyAction,
}

/// Entity metadata for organizations and modules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityMetadata {
    pub name: String,
    pub entity_type: EntityType,
    pub genesis_timestamp: DateTime<Utc>,
    pub description: String,
    pub maintainers: Vec<String>,
    pub capabilities: Vec<String>,
    pub vision_statement: String,
    pub parent_entity: Option<String>,
    pub child_entities: Vec<String>,
    pub constitutional_constraints: Vec<Rule>,
}

/// Types of entities in the system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EntityType {
    ParentOrganization,      // Artifact Virtual
    IntelligenceModule,      // AVA
    ContainerService,        // Individual containers
    GovernanceBody,          // Voting entities
    ResourcePool,            // Shared resources
    ExternalPartner,         // External integrations
}

/// Constitutional rules for governance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Rule {
    RequiresSignature(String),
    VotingQuorum(f32),
    TimeDelay(u64),
    ConsensusRequired(Vec<String>),
    ArtifactVirtualIntelligenceApproval,
    ConstitutionalAmendment,
    GenesisReferenceRequired,
    AIValidation(String),
    ResourceCheck(u64),
}

/// Governance actions for constitutional intelligence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceAction {
    pub action_id: String,
    pub action_type: GovernanceActionType,
    pub proposer: String,
    pub description: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub status: ActionStatus,
    pub execution_timestamp: Option<DateTime<Utc>>,
}

/// Types of governance actions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GovernanceActionType {
    PolicyUpdate,
    ResourceAllocation,
    ModuleActivation,
    PermissionChange,
    EmergencyResponse,
    ConstitutionalChange,
}

/// Status of governance actions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionStatus {
    Proposed,
    VotingActive,
    Approved,
    Rejected,
    Executed,
    Cancelled,
}

/// Main blockchain implementation
pub struct AvaBlockchain {
    pub chain: Vec<Block>,
    pub pending_transactions: Vec<Transaction>,
    pub entities: HashMap<String, EntityMetadata>,
    pub genesis_created: bool,
}

impl AvaBlockchain {
    /// Create a new blockchain instance
    pub fn new() -> Self {
        AvaBlockchain {
            chain: Vec::new(),
            pending_transactions: Vec::new(),
            entities: HashMap::new(),
            genesis_created: false,
        }
    }

    /// Create the dual genesis blocks for Artifact Virtual and AVA
    pub fn create_dual_genesis(&mut self) -> Result<(), String> {
        if self.genesis_created {
            return Err("Genesis blocks already created".to_string());
        }        // Genesis Block 0: Artifact Virtual Intelligence
        let artifact_virtual_metadata = EntityMetadata {
            name: "Artifact Virtual Intelligence".to_string(),
            entity_type: EntityType::ParentOrganization,
            genesis_timestamp: Utc::now(),
            description: "The foundational artificial intelligence system that gives birth to all subsequent intelligence modules and constitutional governance".to_string(),
            maintainers: vec!["genesis@artifactvirtualintelligence.com".to_string()],
            capabilities: vec![
                "AI System Architecture".to_string(),
                "Intelligence Module Creation".to_string(),
                "Constitutional AI Governance".to_string(),
                "Multi-Agent Coordination".to_string(),
                "Democratic AI Decision Making".to_string(),
                "Transparent AI Operations".to_string(),
            ],
            vision_statement: "To create the foundational artificial intelligence system with constitutional governance that ensures transparent, accountable, and democratic AI operations".to_string(),
            parent_entity: None,
            child_entities: vec!["AVA".to_string()],
            constitutional_constraints: vec![
                Rule::GenesisReferenceRequired,
                Rule::ConstitutionalAmendment,
            ],
        };        let genesis_transaction_av = Transaction {
            id: "genesis_artifact_virtual_intelligence".to_string(),
            transaction_type: TransactionType::GenesisCreation,
            sender: "system".to_string(),
            recipient: None,
            data: serde_json::to_value(&artifact_virtual_metadata).unwrap(),
            timestamp: Utc::now(),
            signature: "genesis_signature_avi".to_string(),
            constitutional_validation: true,
        };

        let genesis_block_av = Block {
            index: 0,
            timestamp: Utc::now(),
            previous_hash: "0".to_string(),
            hash: String::new(),
            data: BlockData {
                transactions: vec![genesis_transaction_av],
                entity_metadata: Some(artifact_virtual_metadata.clone()),                constitutional_rules: vec![
                    Rule::GenesisReferenceRequired,
                    Rule::ArtifactVirtualIntelligenceApproval,
                ],
                governance_actions: Vec::new(),
            },
            nonce: 0,
            difficulty: 1,
        };        // Genesis Block 1: AVA
        let ava_metadata = EntityMetadata {
            name: "AVA".to_string(),
            entity_type: EntityType::IntelligenceModule,
            genesis_timestamp: Utc::now(),
            description: "Constitutional AI agent that serves as the primary intelligence module within Artifact Virtual Intelligence, governing all AI operations with democratic principles".to_string(),
            maintainers: vec!["ava@artifactvirtualintelligence.com".to_string()],
            capabilities: vec![
                "Constitutional AI Governance".to_string(),
                "Multi-Container AI Orchestration".to_string(),
                "Democratic AI Decision Making".to_string(),
                "AI Ethics and Compliance".to_string(),
                "Adaptive AI Learning".to_string(),
                "Secure AI Operations".to_string(),
                "Transparent AI Auditing".to_string(),
            ],
            vision_statement: "To provide constitutional intelligence that governs all AI operations within Artifact Virtual Intelligence with transparency, accountability, and democratic principles".to_string(),
            parent_entity: Some("Artifact Virtual Intelligence".to_string()),
            child_entities: vec![
                "ava-core".to_string(),
                "memory-core".to_string(),
                "perception-layer".to_string(),
                "action-layer".to_string(),
                "vault".to_string(),
                "evolver".to_string(),
            ],
            constitutional_constraints: vec![
                Rule::ArtifactVirtualIntelligenceApproval,
                Rule::VotingQuorum(0.67),
                Rule::ConsensusRequired(vec!["ava-core".to_string(), "memory-core".to_string()]),
            ],
        };        let genesis_transaction_ava = Transaction {
            id: "genesis_ava".to_string(),
            transaction_type: TransactionType::GenesisCreation,
            sender: "Artifact Virtual Intelligence".to_string(),
            recipient: Some("AVA".to_string()),
            data: serde_json::to_value(&ava_metadata).unwrap(),
            timestamp: Utc::now(),
            signature: "genesis_signature_ava".to_string(),
            constitutional_validation: true,
        };

        let genesis_block_ava = Block {
            index: 1,
            timestamp: Utc::now(),
            previous_hash: String::new(), // Will be set after mining AV block
            hash: String::new(),
            data: BlockData {
                transactions: vec![genesis_transaction_ava],
                entity_metadata: Some(ava_metadata.clone()),                constitutional_rules: vec![
                    Rule::ArtifactVirtualIntelligenceApproval,
                    Rule::VotingQuorum(0.67),
                    Rule::ConsensusRequired(vec!["ava-core".to_string()]),
                ],
                governance_actions: Vec::new(),
            },
            nonce: 0,
            difficulty: 1,
        };

        // Mine and add blocks
        let mut av_block = genesis_block_av;
        av_block.hash = self.mine_block(&mut av_block);
        self.chain.push(av_block.clone());

        let mut ava_block = genesis_block_ava;
        ava_block.previous_hash = av_block.hash.clone();
        ava_block.hash = self.mine_block(&mut ava_block);
        self.chain.push(ava_block);        // Register entities
        self.entities.insert("Artifact Virtual Intelligence".to_string(), artifact_virtual_metadata);
        self.entities.insert("AVA".to_string(), ava_metadata);

        self.genesis_created = true;
        Ok(())
    }

    /// Mine a block with proof of work
    pub fn mine_block(&self, block: &mut Block) -> String {
        let target = "0".repeat(block.difficulty as usize);
        
        loop {
            let hash = self.calculate_hash(block);
            if hash.starts_with(&target) {
                return hash;
            }
            block.nonce += 1;
        }
    }

    /// Calculate block hash
    pub fn calculate_hash(&self, block: &Block) -> String {
        let mut hasher = Sha256::new();
        let data = format!(
            "{}{}{}{}{}{}",
            block.index,
            block.timestamp.timestamp(),
            block.previous_hash,
            serde_json::to_string(&block.data).unwrap_or_default(),
            block.nonce,
            block.difficulty
        );
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Add a new transaction to pending pool
    pub fn add_transaction(&mut self, transaction: Transaction) -> Result<(), String> {
        if !self.genesis_created {
            return Err("Genesis blocks must be created first".to_string());
        }

        // Validate transaction based on constitutional rules
        if self.validate_transaction(&transaction)? {
            self.pending_transactions.push(transaction);
            Ok(())
        } else {
            Err("Transaction validation failed".to_string())
        }
    }

    /// Validate transaction against constitutional rules
    pub fn validate_transaction(&self, transaction: &Transaction) -> Result<bool, String> {
        // Basic validation
        if transaction.id.is_empty() {
            return Err("Transaction ID cannot be empty".to_string());
        }        // Constitutional validation based on entity
        if let Some(entity) = self.entities.get(&transaction.sender) {
            for rule in &entity.constitutional_constraints {
                match rule {
                    Rule::ArtifactVirtualIntelligenceApproval => {
                        if transaction.sender != "Artifact Virtual Intelligence" && 
                           !self.has_approval_from_parent(&transaction.sender, "Artifact Virtual Intelligence") {
                            return Err("Requires Artifact Virtual Intelligence approval".to_string());
                        }
                    },                    Rule::VotingQuorum(_threshold) => {
                        // In a real implementation, this would check actual votes
                        // For now, we assume constitutional validation
                        if !transaction.constitutional_validation {
                            return Err("Voting quorum not met".to_string());
                        }
                    },
                    _ => {} // Other rules would be implemented here
                }
            }
        }

        Ok(true)
    }

    /// Check if entity has approval from parent
    pub fn has_approval_from_parent(&self, entity_name: &str, parent_name: &str) -> bool {
        if let Some(entity) = self.entities.get(entity_name) {
            entity.parent_entity.as_ref() == Some(&parent_name.to_string())
        } else {
            false
        }
    }

    /// Create a new block with pending transactions
    pub fn create_block(&mut self) -> Result<Block, String> {
        if self.pending_transactions.is_empty() {
            return Err("No pending transactions".to_string());
        }

        let previous_block = self.chain.last()
            .ok_or("No previous block found")?;

        let mut new_block = Block {
            index: previous_block.index + 1,
            timestamp: Utc::now(),
            previous_hash: previous_block.hash.clone(),
            hash: String::new(),
            data: BlockData {
                transactions: self.pending_transactions.clone(),
                entity_metadata: None,
                constitutional_rules: Vec::new(),
                governance_actions: Vec::new(),
            },
            nonce: 0,
            difficulty: 2, // Increase difficulty after genesis
        };

        new_block.hash = self.mine_block(&mut new_block);
        self.chain.push(new_block.clone());
        self.pending_transactions.clear();

        Ok(new_block)
    }

    /// Validate the entire blockchain
    pub fn is_chain_valid(&self) -> bool {
        for i in 1..self.chain.len() {
            let current_block = &self.chain[i];
            let previous_block = &self.chain[i - 1];

            // Verify hash
            let calculated_hash = self.calculate_hash(current_block);
            if current_block.hash != calculated_hash {
                return false;
            }

            // Verify chain linkage
            if current_block.previous_hash != previous_block.hash {
                return false;
            }
        }
        true
    }

    /// Get entity information
    pub fn get_entity(&self, name: &str) -> Option<&EntityMetadata> {
        self.entities.get(name)
    }    /// Get blockchain status
    pub fn get_status(&self) -> BlockchainStatus {
        BlockchainStatus {
            total_blocks: self.chain.len(),
            pending_transactions: self.pending_transactions.len(),
            entities_count: self.entities.len(),
            genesis_created: self.genesis_created,
            chain_valid: self.is_chain_valid(),
            latest_block_hash: self.chain.last().map(|b| b.hash.clone()),
        }
    }

    /// Get chain length
    pub fn get_chain_length(&self) -> usize {
        self.chain.len()
    }

    /// Get entities map
    pub fn get_entities(&self) -> &HashMap<String, EntityMetadata> {
        &self.entities
    }

    /// Get latest block
    pub fn get_latest_block(&self) -> &Block {
        self.chain.last().expect("No blocks in chain")
    }

    /// Create a new transaction
    pub fn create_transaction(
        &self,
        sender: String,
        recipient: String,
        transaction_type: String,
        data: serde_json::Value,
    ) -> Result<Transaction, String> {
        let tx_type = match transaction_type.as_str() {
            "register_container" => TransactionType::ModuleDeployment,
            "governance_proposal" => TransactionType::GovernanceProposal,
            "resource_allocation" => TransactionType::ResourceAllocation,
            _ => TransactionType::EntityRegistration,
        };

        Ok(Transaction {
            id: format!("tx_{}_{}", sender, chrono::Utc::now().timestamp()),
            transaction_type: tx_type,
            sender,
            recipient: Some(recipient),
            data,
            timestamp: chrono::Utc::now(),
            signature: "auto_generated".to_string(),
            constitutional_validation: true,
        })
    }

    /// Mine pending transactions into a new block
    pub fn mine_pending_transactions(&mut self, miner: String) -> Result<(), String> {
        if self.pending_transactions.is_empty() {
            return Err("No pending transactions to mine".to_string());
        }

        self.create_block()?;
        println!("⛏️  Block mined by: {}", miner);
        Ok(())
    }

    /// Save blockchain to file
    pub fn save_to_file(&self, filename: &str) -> Result<(), String> {
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Serialization error: {}", e))?;
        
        std::fs::write(filename, json)
            .map_err(|e| format!("File write error: {}", e))?;
        
        Ok(())
    }
}

impl serde::Serialize for AvaBlockchain {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("AvaBlockchain", 4)?;
        state.serialize_field("chain", &self.chain)?;
        state.serialize_field("pending_transactions", &self.pending_transactions)?;
        state.serialize_field("entities", &self.entities)?;
        state.serialize_field("genesis_created", &self.genesis_created)?;        state.end()
    }
}

/// Blockchain status information
#[derive(Debug, Serialize, Deserialize)]
pub struct BlockchainStatus {
    pub total_blocks: usize,
    pub pending_transactions: usize,
    pub entities_count: usize,
    pub genesis_created: bool,
    pub chain_valid: bool,
    pub latest_block_hash: Option<String>,
}

impl fmt::Display for BlockchainStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Blockchain Status:\n\
                   - Blocks: {}\n\
                   - Pending Transactions: {}\n\
                   - Entities: {}\n\
                   - Genesis Created: {}\n\
                   - Chain Valid: {}\n\
                   - Latest Hash: {}",
                   self.total_blocks,
                   self.pending_transactions,
                   self.entities_count,
                   self.genesis_created,
                   self.chain_valid,
                   self.latest_block_hash.as_deref().unwrap_or("None"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dual_genesis_creation() {
        let mut blockchain = AvaBlockchain::new();
        
        // Create genesis blocks
        blockchain.create_dual_genesis().unwrap();
        
        // Verify genesis creation
        assert_eq!(blockchain.chain.len(), 2);
        assert!(blockchain.genesis_created);
        assert!(blockchain.is_chain_valid());
          // Verify entities
        assert!(blockchain.get_entity("Artifact Virtual Intelligence").is_some());
        assert!(blockchain.get_entity("AVA").is_some());
        
        // Verify hierarchy
        let ava = blockchain.get_entity("AVA").unwrap();
        assert_eq!(ava.parent_entity, Some("Artifact Virtual Intelligence".to_string()));
    }

    #[test]
    fn test_transaction_validation() {
        let mut blockchain = AvaBlockchain::new();
        blockchain.create_dual_genesis().unwrap();
        
        let transaction = Transaction {
            id: "test_tx".to_string(),
            transaction_type: TransactionType::EntityRegistration,
            sender: "AVA".to_string(),
            recipient: None,
            data: serde_json::json!({"test": "data"}),
            timestamp: Utc::now(),
            signature: "test_sig".to_string(),
            constitutional_validation: true,
        };
        
        // Should succeed with constitutional validation
        assert!(blockchain.add_transaction(transaction).is_ok());
    }
}
