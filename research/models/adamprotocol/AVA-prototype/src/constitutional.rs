// Constitutional Engine for AVA Governance
// Handles constitutional rules, governance, and democratic processes

use crate::blockchain::Transaction;
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

/// Constitutional governance engine
#[derive(Debug)]
pub struct ConstitutionalEngine {
    pub rules: Vec<GovernanceRule>,
    pub active_proposals: HashMap<String, Proposal>,
    pub voting_records: HashMap<String, VotingRecord>,
    pub constitutional_history: Vec<ConstitutionalEvent>,
}

/// Enhanced governance rule structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceRule {
    pub id: String,
    pub rule_type: RuleType,
    pub description: String,
    pub enforcement_level: EnforcementLevel,
    pub created_at: DateTime<Utc>,
    pub created_by: String,
    pub parameters: HashMap<String, serde_json::Value>,
    pub active: bool,
}

/// Types of governance rules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RuleType {
    VotingRule,
    AuthorizationRule,
    ResourceRule,
    ConstitutionalRule,
    EmergencyRule,
    OperationalRule,
}

/// Enforcement levels for rules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EnforcementLevel {
    Advisory,       // Suggestions, not enforced
    Warning,        // Warnings when violated
    Blocking,       // Prevents action if violated
    Constitutional, // Requires constitutional process to change
}

/// Governance proposal structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proposal {
    pub id: String,
    pub proposal_type: ProposalType,
    pub title: String,
    pub description: String,
    pub proposer: String,
    pub created_at: DateTime<Utc>,
    pub voting_deadline: DateTime<Utc>,
    pub required_quorum: f32,
    pub required_majority: f32,
    pub votes: HashMap<String, Vote>,
    pub status: ProposalStatus,
    pub implementation_details: serde_json::Value,
}

/// Types of proposals
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProposalType {
    RuleAddition,
    RuleModification,
    RuleRemoval,
    ConstitutionalAmendment,
    ResourceAllocation,
    ModuleUpgrade,
    EmergencyAction,
    PolicyChange,
}

/// Proposal status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProposalStatus {
    Draft,
    VotingActive,
    QuorumNotMet,
    Rejected,
    Approved,
    Implemented,
    Cancelled,
}

/// Individual vote
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vote {
    pub voter: String,
    pub vote_type: VoteType,
    pub timestamp: DateTime<Utc>,
    pub rationale: Option<String>,
    pub weight: f32,
}

/// Vote types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VoteType {
    For,
    Against,
    Abstain,
}

/// Voting record for auditing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VotingRecord {
    pub proposal_id: String,
    pub total_eligible_voters: u32,
    pub total_votes_cast: u32,
    pub votes_for: u32,
    pub votes_against: u32,
    pub votes_abstain: u32,
    pub final_result: VoteResult,
    pub participation_rate: f32,
}

/// Final vote result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VoteResult {
    Passed,
    Failed,
    QuorumNotMet,
    Cancelled,
}

/// Constitutional events for history tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConstitutionalEvent {
    pub id: String,
    pub event_type: EventType,
    pub description: String,
    pub timestamp: DateTime<Utc>,
    pub actor: String,
    pub affected_entities: Vec<String>,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Types of constitutional events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    RuleCreation,
    RuleModification,
    RuleEnforcement,
    ViolationDetected,
    ProposalSubmitted,
    VoteCast,
    ProposalResolved,
    EmergencyAction,
    ConstitutionalAmendment,
}

impl ConstitutionalEngine {
    /// Create a new constitutional engine with default rules
    pub fn new() -> Self {
        let mut engine = ConstitutionalEngine {
            rules: Vec::new(),
            active_proposals: HashMap::new(),
            voting_records: HashMap::new(),
            constitutional_history: Vec::new(),
        };

        // Initialize with foundational rules
        engine.initialize_foundational_rules();
        engine
    }

    /// Initialize foundational constitutional rules
    fn initialize_foundational_rules(&mut self) {
        let foundational_rules = vec![
            GovernanceRule {
                id: "artifact_virtual_supremacy".to_string(),
                rule_type: RuleType::ConstitutionalRule,
                description: "Artifact Virtual maintains ultimate constitutional authority".to_string(),
                enforcement_level: EnforcementLevel::Constitutional,
                created_at: Utc::now(),
                created_by: "GENESIS".to_string(),
                parameters: HashMap::new(),
                active: true,
            },
            GovernanceRule {
                id: "ava_governance_authority".to_string(),
                rule_type: RuleType::AuthorizationRule,
                description: "AVA has authority to govern container operations".to_string(),
                enforcement_level: EnforcementLevel::Blocking,
                created_at: Utc::now(),
                created_by: "GENESIS".to_string(),
                parameters: HashMap::new(),
                active: true,
            },
            GovernanceRule {
                id: "democratic_voting".to_string(),
                rule_type: RuleType::VotingRule,
                description: "Major decisions require democratic voting process".to_string(),
                enforcement_level: EnforcementLevel::Blocking,
                created_at: Utc::now(),
                created_by: "GENESIS".to_string(),
                parameters: [
                    ("quorum_threshold".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(0.51).unwrap())),
                    ("majority_threshold".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(0.67).unwrap())),
                ].iter().cloned().collect(),
                active: true,
            },
            GovernanceRule {
                id: "transparency_requirement".to_string(),
                rule_type: RuleType::OperationalRule,
                description: "All governance actions must be transparent and auditable".to_string(),
                enforcement_level: EnforcementLevel::Blocking,
                created_at: Utc::now(),
                created_by: "GENESIS".to_string(),
                parameters: HashMap::new(),
                active: true,
            },
        ];

        self.rules.extend(foundational_rules);
    }

    /// Validate a transaction against constitutional rules
    pub fn validate_transaction(&self, transaction: &Transaction) -> Result<ValidationResult, String> {
        let mut violations = Vec::new();
        let mut warnings = Vec::new();

        for rule in &self.rules {
            if !rule.active {
                continue;
            }

            let validation = self.apply_rule(rule, transaction)?;
            
            match validation {
                RuleViolation::None => continue,
                RuleViolation::Warning(msg) => warnings.push(msg),
                RuleViolation::Blocking(msg) => violations.push(msg),
            }
        }

        if !violations.is_empty() {
            return Ok(ValidationResult::Rejected(violations));
        }

        if !warnings.is_empty() {
            return Ok(ValidationResult::ApprovedWithWarnings(warnings));
        }

        Ok(ValidationResult::Approved)
    }

    /// Apply a specific rule to a transaction
    fn apply_rule(&self, rule: &GovernanceRule, transaction: &Transaction) -> Result<RuleViolation, String> {
        match rule.rule_type {
            RuleType::AuthorizationRule => {
                if rule.id == "artifact_virtual_supremacy" {
                    // Check if action requires Artifact Virtual approval
                    if self.requires_artifact_virtual_approval(transaction) && 
                       transaction.sender != "Artifact Virtual" {
                        return Ok(RuleViolation::Blocking(
                            "Action requires Artifact Virtual approval".to_string()
                        ));
                    }
                }
            },
            RuleType::VotingRule => {
                if rule.id == "democratic_voting" {
                    // Check if action requires voting
                    if self.requires_democratic_vote(transaction) && !transaction.constitutional_validation {
                        return Ok(RuleViolation::Blocking(
                            "Action requires democratic voting process".to_string()
                        ));
                    }
                }
            },
            RuleType::OperationalRule => {
                if rule.id == "transparency_requirement" {
                    // Check if transaction has proper documentation
                    if transaction.data == serde_json::Value::Null {
                        return Ok(RuleViolation::Warning(
                            "Transaction lacks detailed documentation".to_string()
                        ));
                    }
                }
            },
            _ => {} // Other rule types
        }

        Ok(RuleViolation::None)
    }

    /// Check if transaction requires Artifact Virtual approval
    fn requires_artifact_virtual_approval(&self, transaction: &Transaction) -> bool {
        matches!(
            transaction.transaction_type,
            crate::blockchain::TransactionType::ConstitutionalAmendment |
            crate::blockchain::TransactionType::EmergencyAction
        )
    }

    /// Check if transaction requires democratic vote
    fn requires_democratic_vote(&self, transaction: &Transaction) -> bool {
        matches!(
            transaction.transaction_type,
            crate::blockchain::TransactionType::GovernanceProposal |
            crate::blockchain::TransactionType::ResourceAllocation |
            crate::blockchain::TransactionType::AIModelUpdate
        )
    }

    /// Submit a new governance proposal
    pub fn submit_proposal(&mut self, mut proposal: Proposal) -> Result<String, String> {
        // Validate proposal
        if proposal.title.is_empty() {
            return Err("Proposal title cannot be empty".to_string());
        }

        if proposal.voting_deadline <= Utc::now() {
            return Err("Voting deadline must be in the future".to_string());
        }

        // Generate unique ID if not provided
        if proposal.id.is_empty() {
            proposal.id = format!("prop_{}", Utc::now().timestamp());
        }

        // Set initial status
        proposal.status = ProposalStatus::VotingActive;

        // Record constitutional event
        let event = ConstitutionalEvent {
            id: format!("event_{}", Utc::now().timestamp()),
            event_type: EventType::ProposalSubmitted,
            description: format!("Proposal '{}' submitted by {}", proposal.title, proposal.proposer),
            timestamp: Utc::now(),
            actor: proposal.proposer.clone(),
            affected_entities: vec!["governance".to_string()],
            metadata: [("proposal_id".to_string(), serde_json::Value::String(proposal.id.clone()))]
                .iter().cloned().collect(),
        };

        self.constitutional_history.push(event);

        let proposal_id = proposal.id.clone();
        self.active_proposals.insert(proposal.id.clone(), proposal);

        Ok(proposal_id)
    }

    /// Cast a vote on a proposal
    pub fn cast_vote(&mut self, proposal_id: &str, vote: Vote) -> Result<(), String> {
        let proposal = self.active_proposals.get_mut(proposal_id)
            .ok_or("Proposal not found")?;

        // Check if proposal is still accepting votes
        if proposal.status != ProposalStatus::VotingActive {
            return Err("Proposal is not accepting votes".to_string());
        }

        // Check if voting deadline has passed
        if Utc::now() > proposal.voting_deadline {
            proposal.status = ProposalStatus::QuorumNotMet;
            return Err("Voting deadline has passed".to_string());
        }

        // Record the vote
        proposal.votes.insert(vote.voter.clone(), vote.clone());

        // Record constitutional event
        let event = ConstitutionalEvent {
            id: format!("event_{}", Utc::now().timestamp()),
            event_type: EventType::VoteCast,
            description: format!("Vote cast by {} on proposal {}", vote.voter, proposal_id),
            timestamp: Utc::now(),
            actor: vote.voter.clone(),
            affected_entities: vec![proposal_id.to_string()],
            metadata: [
                ("proposal_id".to_string(), serde_json::Value::String(proposal_id.to_string())),
                ("vote_type".to_string(), serde_json::Value::String(format!("{:?}", vote.vote_type))),
            ].iter().cloned().collect(),
        };

        self.constitutional_history.push(event);

        // Check if proposal should be resolved
        self.check_proposal_resolution(proposal_id)?;

        Ok(())
    }

    /// Check if a proposal should be resolved
    fn check_proposal_resolution(&mut self, proposal_id: &str) -> Result<(), String> {
        let proposal = self.active_proposals.get(proposal_id)
            .ok_or("Proposal not found")?;

        let total_votes = proposal.votes.len() as f32;
        let votes_for = proposal.votes.values()
            .filter(|v| matches!(v.vote_type, VoteType::For))
            .count() as f32;
        let votes_against = proposal.votes.values()
            .filter(|v| matches!(v.vote_type, VoteType::Against))
            .count() as f32;

        // Simplified: assume 10 eligible voters for now
        let eligible_voters = 10.0;
        let participation_rate = total_votes / eligible_voters;

        let mut new_status = None;

        // Check quorum
        if participation_rate >= proposal.required_quorum {
            // Check majority
            let approval_rate = votes_for / total_votes;
            if approval_rate >= proposal.required_majority {
                new_status = Some(ProposalStatus::Approved);
            } else {
                new_status = Some(ProposalStatus::Rejected);
            }
        } else if Utc::now() > proposal.voting_deadline {
            new_status = Some(ProposalStatus::QuorumNotMet);
        }

        if let Some(status) = new_status {
            let proposal = self.active_proposals.get_mut(proposal_id).unwrap();
            proposal.status = status.clone();

            // Record voting record
            let voting_record = VotingRecord {
                proposal_id: proposal_id.to_string(),
                total_eligible_voters: eligible_voters as u32,
                total_votes_cast: total_votes as u32,
                votes_for: votes_for as u32,
                votes_against: votes_against as u32,
                votes_abstain: (total_votes - votes_for - votes_against) as u32,
                final_result: match status {
                    ProposalStatus::Approved => VoteResult::Passed,
                    ProposalStatus::Rejected => VoteResult::Failed,
                    ProposalStatus::QuorumNotMet => VoteResult::QuorumNotMet,
                    _ => VoteResult::Failed,
                },
                participation_rate,
            };

            self.voting_records.insert(proposal_id.to_string(), voting_record);

            // Record constitutional event
            let event = ConstitutionalEvent {
                id: format!("event_{}", Utc::now().timestamp()),
                event_type: EventType::ProposalResolved,
                description: format!("Proposal {} resolved with status: {:?}", proposal_id, status),
                timestamp: Utc::now(),
                actor: "SYSTEM".to_string(),
                affected_entities: vec![proposal_id.to_string()],
                metadata: HashMap::new(),
            };

            self.constitutional_history.push(event);
        }

        Ok(())
    }

    /// Get engine statistics
    pub fn get_stats(&self) -> EngineStats {
        EngineStats {
            total_rules: self.rules.len(),
            active_rules: self.rules.iter().filter(|r| r.active).count(),
            active_proposals: self.active_proposals.len(),
            total_voting_records: self.voting_records.len(),
            constitutional_events: self.constitutional_history.len(),
        }
    }
}

/// Validation result for transactions
#[derive(Debug)]
pub enum ValidationResult {
    Approved,
    ApprovedWithWarnings(Vec<String>),
    Rejected(Vec<String>),
}

/// Rule violation types
#[derive(Debug)]
pub enum RuleViolation {
    None,
    Warning(String),
    Blocking(String),
}

/// Engine statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct EngineStats {
    pub total_rules: usize,
    pub active_rules: usize,
    pub active_proposals: usize,
    pub total_voting_records: usize,
    pub constitutional_events: usize,
}

impl Default for ConstitutionalEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::blockchain::{Transaction, TransactionType};

    #[test]
    fn test_constitutional_engine_creation() {
        let engine = ConstitutionalEngine::new();
        assert!(engine.rules.len() >= 4); // Should have foundational rules
    }

    #[test]
    fn test_proposal_submission() {
        let mut engine = ConstitutionalEngine::new();
        
        let proposal = Proposal {
            id: String::new(),
            proposal_type: ProposalType::PolicyChange,
            title: "Test Proposal".to_string(),
            description: "A test proposal".to_string(),
            proposer: "test_user".to_string(),
            created_at: Utc::now(),
            voting_deadline: Utc::now() + chrono::Duration::days(7),
            required_quorum: 0.5,
            required_majority: 0.67,
            votes: HashMap::new(),
            status: ProposalStatus::Draft,
            implementation_details: serde_json::json!({}),
        };

        let result = engine.submit_proposal(proposal);
        assert!(result.is_ok());
    }

    #[test]
    fn test_vote_casting() {
        let mut engine = ConstitutionalEngine::new();
        
        let proposal = Proposal {
            id: "test_proposal".to_string(),
            proposal_type: ProposalType::PolicyChange,
            title: "Test Proposal".to_string(),
            description: "A test proposal".to_string(),
            proposer: "test_user".to_string(),
            created_at: Utc::now(),
            voting_deadline: Utc::now() + chrono::Duration::days(7),
            required_quorum: 0.5,
            required_majority: 0.67,
            votes: HashMap::new(),
            status: ProposalStatus::VotingActive,
            implementation_details: serde_json::json!({}),
        };

        engine.active_proposals.insert("test_proposal".to_string(), proposal);

        let vote = Vote {
            voter: "voter1".to_string(),
            vote_type: VoteType::For,
            timestamp: Utc::now(),
            rationale: Some("I support this".to_string()),
            weight: 1.0,
        };

        let result = engine.cast_vote("test_proposal", vote);
        assert!(result.is_ok());
    }
}
