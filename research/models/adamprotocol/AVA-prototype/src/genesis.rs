// Genesis Block Builder for AVA Constitutional Intelligence
// Handles the creation of foundational blocks for Artifact Virtual and AVA

use crate::blockchain::{Block, BlockData, Transaction, TransactionType, EntityMetadata, EntityType, Rule};
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};

/// Genesis configuration for dual entity creation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenesisConfig {
    pub artifact_virtual_config: EntityConfig,
    pub ava_config: EntityConfig,
    pub initial_difficulty: u32,
    pub genesis_timestamp: DateTime<Utc>,
}

/// Configuration for individual entities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityConfig {
    pub name: String,
    pub description: String,
    pub maintainers: Vec<String>,
    pub capabilities: Vec<String>,
    pub vision_statement: String,
    pub constitutional_constraints: Vec<Rule>,
}

/// Genesis block builder
pub struct GenesisBuilder {
    config: GenesisConfig,
}

impl GenesisBuilder {
    /// Create a new genesis builder with default configuration
    pub fn new() -> Self {
        let config = GenesisConfig {
            artifact_virtual_config: EntityConfig {
                name: "Artifact Virtual".to_string(),
                description: "The foundational parent organization that gives birth to all subsequent intelligence modules".to_string(),
                maintainers: vec![
                    "genesis@artifactvirtual.com".to_string(),
                    "foundation@artifactvirtual.com".to_string(),
                ],
                capabilities: vec![
                    "Organization Creation".to_string(),
                    "Entity Governance".to_string(),
                    "Resource Management".to_string(),
                    "Constitutional Authority".to_string(),
                    "Cross-Chain Coordination".to_string(),
                    "Ecosystem Oversight".to_string(),
                ],
                vision_statement: "To create a constitutional framework for artificial intelligence governance that ensures transparency, accountability, and beneficial AI development".to_string(),
                constitutional_constraints: vec![
                    Rule::GenesisReferenceRequired,
                    Rule::ConstitutionalAmendment,
                ],
            },
            ava_config: EntityConfig {
                name: "AVA".to_string(),
                description: "Constitutional intelligence module that emerges from Artifact Virtual to govern all operations through democratic and transparent frameworks".to_string(),
                maintainers: vec![
                    "ava@artifactvirtual.com".to_string(),
                    "constitutional@artifactvirtual.com".to_string(),
                ],
                capabilities: vec![
                    "Constitutional Governance".to_string(),
                    "Multi-Container Orchestration".to_string(),
                    "AI Coordination".to_string(),
                    "Regulatory Compliance".to_string(),
                    "Adaptive Learning".to_string(),
                    "Secure Operations".to_string(),
                    "Democratic Decision Making".to_string(),
                    "Cross-System Integration".to_string(),
                ],
                vision_statement: "To provide constitutional intelligence that governs all AI operations with transparency, accountability, and democratic participation".to_string(),                constitutional_constraints: vec![
                    Rule::ArtifactVirtualIntelligenceApproval,
                    Rule::VotingQuorum(0.67),
                    Rule::ConsensusRequired(vec!["ava-core".to_string(), "memory-core".to_string()]),
                ],
            },
            initial_difficulty: 1,
            genesis_timestamp: Utc::now(),
        };

        GenesisBuilder { config }
    }

    /// Create genesis builder with custom configuration
    pub fn with_config(config: GenesisConfig) -> Self {
        GenesisBuilder { config }
    }

    /// Build the Artifact Virtual genesis block (Block 0)
    pub fn build_artifact_virtual_genesis(&self) -> Block {
        let entity_metadata = EntityMetadata {
            name: self.config.artifact_virtual_config.name.clone(),
            entity_type: EntityType::ParentOrganization,
            genesis_timestamp: self.config.genesis_timestamp,
            description: self.config.artifact_virtual_config.description.clone(),
            maintainers: self.config.artifact_virtual_config.maintainers.clone(),
            capabilities: self.config.artifact_virtual_config.capabilities.clone(),
            vision_statement: self.config.artifact_virtual_config.vision_statement.clone(),
            parent_entity: None,
            child_entities: vec!["AVA".to_string()],
            constitutional_constraints: self.config.artifact_virtual_config.constitutional_constraints.clone(),
        };

        let genesis_transaction = Transaction {
            id: "genesis_artifact_virtual_0".to_string(),
            transaction_type: TransactionType::GenesisCreation,
            sender: "SYSTEM_GENESIS".to_string(),
            recipient: Some("Artifact Virtual".to_string()),
            data: serde_json::to_value(&entity_metadata).unwrap(),
            timestamp: self.config.genesis_timestamp,
            signature: self.create_genesis_signature("artifact_virtual", 0),
            constitutional_validation: true,
        };

        Block {
            index: 0,
            timestamp: self.config.genesis_timestamp,
            previous_hash: "0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            hash: String::new(), // Will be calculated during mining
            data: BlockData {
                transactions: vec![genesis_transaction],
                entity_metadata: Some(entity_metadata),                constitutional_rules: vec![
                    Rule::GenesisReferenceRequired,
                    Rule::ArtifactVirtualIntelligenceApproval,
                    Rule::ConstitutionalAmendment,
                ],
                governance_actions: Vec::new(),
            },
            nonce: 0,
            difficulty: self.config.initial_difficulty,
        }
    }

    /// Build the AVA intelligence genesis block (Block 1)
    pub fn build_ava_genesis(&self, artifact_virtual_hash: &str) -> Block {
        let entity_metadata = EntityMetadata {
            name: self.config.ava_config.name.clone(),
            entity_type: EntityType::IntelligenceModule,
            genesis_timestamp: self.config.genesis_timestamp,
            description: self.config.ava_config.description.clone(),
            maintainers: self.config.ava_config.maintainers.clone(),
            capabilities: self.config.ava_config.capabilities.clone(),
            vision_statement: self.config.ava_config.vision_statement.clone(),
            parent_entity: Some("Artifact Virtual".to_string()),
            child_entities: vec![
                "ava-core".to_string(),
                "memory-core".to_string(),
                "perception-layer".to_string(),
                "action-layer".to_string(),
                "vault".to_string(),
                "evolver".to_string(),
            ],
            constitutional_constraints: self.config.ava_config.constitutional_constraints.clone(),
        };

        let genesis_transaction = Transaction {
            id: "genesis_ava_1".to_string(),
            transaction_type: TransactionType::GenesisCreation,
            sender: "Artifact Virtual".to_string(),
            recipient: Some("AVA".to_string()),
            data: serde_json::to_value(&entity_metadata).unwrap(),
            timestamp: self.config.genesis_timestamp,
            signature: self.create_genesis_signature("ava", 1),
            constitutional_validation: true,
        };

        Block {
            index: 1,
            timestamp: self.config.genesis_timestamp,
            previous_hash: artifact_virtual_hash.to_string(),
            hash: String::new(), // Will be calculated during mining
            data: BlockData {
                transactions: vec![genesis_transaction],
                entity_metadata: Some(entity_metadata),                constitutional_rules: vec![
                    Rule::ArtifactVirtualIntelligenceApproval,
                    Rule::VotingQuorum(0.67),
                    Rule::ConsensusRequired(vec![
                        "ava-core".to_string(), 
                        "memory-core".to_string()
                    ]),
                ],
                governance_actions: Vec::new(),
            },
            nonce: 0,
            difficulty: self.config.initial_difficulty,
        }
    }

    /// Create a cryptographic signature for genesis blocks
    fn create_genesis_signature(&self, entity: &str, block_index: u64) -> String {
        let mut hasher = Sha256::new();
        let signature_data = format!(
            "genesis_{}_{}_{}_{}", 
            entity, 
            block_index, 
            self.config.genesis_timestamp.timestamp(),
            "constitutional_intelligence"
        );
        hasher.update(signature_data.as_bytes());
        format!("genesis_{:x}", hasher.finalize())
    }

    /// Build both genesis blocks in sequence
    pub fn build_dual_genesis(&self) -> (Block, Block) {
        let artifact_virtual_block = self.build_artifact_virtual_genesis();
        
        // Calculate hash for AV block (temporary for linkage)
        let av_hash = self.calculate_temporary_hash(&artifact_virtual_block);
        
        let ava_block = self.build_ava_genesis(&av_hash);
        
        (artifact_virtual_block, ava_block)
    }

    /// Calculate temporary hash for block linkage
    fn calculate_temporary_hash(&self, block: &Block) -> String {
        let mut hasher = Sha256::new();
        let data = format!(
            "{}{}{}{}{}",
            block.index,
            block.timestamp.timestamp(),
            block.previous_hash,
            serde_json::to_string(&block.data).unwrap_or_default(),
            block.difficulty
        );
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Validate genesis configuration
    pub fn validate_config(&self) -> Result<(), String> {
        // Validate Artifact Virtual config
        if self.config.artifact_virtual_config.name.is_empty() {
            return Err("Artifact Virtual name cannot be empty".to_string());
        }

        if self.config.artifact_virtual_config.maintainers.is_empty() {
            return Err("Artifact Virtual must have at least one maintainer".to_string());
        }

        // Validate AVA config
        if self.config.ava_config.name.is_empty() {
            return Err("AVA name cannot be empty".to_string());
        }

        if self.config.ava_config.maintainers.is_empty() {
            return Err("AVA must have at least one maintainer".to_string());
        }

        // Validate difficulty
        if self.config.initial_difficulty == 0 {
            return Err("Initial difficulty must be greater than 0".to_string());
        }

        Ok(())
    }

    /// Get genesis statistics
    pub fn get_genesis_stats(&self) -> GenesisStats {
        GenesisStats {
            artifact_virtual_capabilities: self.config.artifact_virtual_config.capabilities.len(),
            ava_capabilities: self.config.ava_config.capabilities.len(),
            total_maintainers: self.config.artifact_virtual_config.maintainers.len() + 
                             self.config.ava_config.maintainers.len(),
            constitutional_rules: self.config.artifact_virtual_config.constitutional_constraints.len() +
                                 self.config.ava_config.constitutional_constraints.len(),
            genesis_timestamp: self.config.genesis_timestamp,
        }
    }
}

/// Genesis statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct GenesisStats {
    pub artifact_virtual_capabilities: usize,
    pub ava_capabilities: usize,
    pub total_maintainers: usize,
    pub constitutional_rules: usize,
    pub genesis_timestamp: DateTime<Utc>,
}

impl Default for GenesisBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_genesis_builder_creation() {
        let builder = GenesisBuilder::new();
        assert!(builder.validate_config().is_ok());
    }

    #[test]
    fn test_dual_genesis_building() {
        let builder = GenesisBuilder::new();
        let (av_block, ava_block) = builder.build_dual_genesis();
        
        assert_eq!(av_block.index, 0);
        assert_eq!(ava_block.index, 1);
        assert_eq!(ava_block.previous_hash.len(), 64); // SHA256 hex length
        
        // Verify entity metadata
        assert!(av_block.data.entity_metadata.is_some());
        assert!(ava_block.data.entity_metadata.is_some());
        
        let av_metadata = av_block.data.entity_metadata.as_ref().unwrap();
        let ava_metadata = ava_block.data.entity_metadata.as_ref().unwrap();
        
        assert_eq!(av_metadata.name, "Artifact Virtual");
        assert_eq!(ava_metadata.name, "AVA");
        assert_eq!(ava_metadata.parent_entity, Some("Artifact Virtual".to_string()));
    }

    #[test]
    fn test_genesis_stats() {
        let builder = GenesisBuilder::new();
        let stats = builder.get_genesis_stats();
        
        assert!(stats.artifact_virtual_capabilities > 0);
        assert!(stats.ava_capabilities > 0);
        assert!(stats.total_maintainers > 0);
        assert!(stats.constitutional_rules > 0);
    }
}
