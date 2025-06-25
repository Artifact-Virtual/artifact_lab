#!/usr/bin/env python3
"""
AVA Evolver - Constitutional Intelligence Self-Improvement & Adaptive Learning
Implements evolutionary algorithms, continuous learning, and system optimization
"""

import asyncio
import json
import logging
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import numpy as np
from collections import deque

import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import networkx as nx

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EvolutionType(Enum):
    GOVERNANCE_OPTIMIZATION = "governance_optimization"
    AGENT_COORDINATION = "agent_coordination"
    RESOURCE_ALLOCATION = "resource_allocation"
    SECURITY_ENHANCEMENT = "security_enhancement"
    PERFORMANCE_TUNING = "performance_tuning"
    CONSTITUTIONAL_REFINEMENT = "constitutional_refinement"

class LearningStrategy(Enum):
    REINFORCEMENT = "reinforcement"
    EVOLUTIONARY = "evolutionary"
    SWARM_INTELLIGENCE = "swarm_intelligence"
    GENETIC_ALGORITHM = "genetic_algorithm"
    NEURAL_EVOLUTION = "neural_evolution"
    CONSTITUTIONAL_CONSENSUS = "constitutional_consensus"

@dataclass
class EvolutionCandidate:
    id: str
    evolution_type: EvolutionType
    strategy: LearningStrategy
    parameters: Dict[str, Any]
    fitness_score: float
    generation: int
    parent_ids: List[str]
    constitutional_compliance: float
    created_at: float
    tested_at: Optional[float] = None
    deployed_at: Optional[float] = None
    performance_metrics: Dict[str, float] = None

@dataclass
class ConstitutionalEvolutionGoal:
    id: str
    title: str
    description: str
    target_metrics: Dict[str, float]
    constitutional_constraints: Dict[str, Any]
    priority: int
    deadline: Optional[float] = None
    current_best_fitness: float = 0.0
    generations_completed: int = 0

class ConstitutionalEvolutionEngine:
    """Enhanced evolution engine for constitutional intelligence"""
    
    def __init__(self):
        self.redis_client = None
        self.population_size = 50
        self.current_generation = 0
        self.evolution_goals = {}
        self.active_populations = {}
        self.performance_history = deque(maxlen=1000)
        self.constitutional_constraints = {}
        self.running = False
        
        # Neural network for fitness evaluation
        self.fitness_network = None
        
        # Swarm intelligence parameters
        self.swarm_parameters = {
            "cognitive_weight": 2.0,
            "social_weight": 2.0,
            "inertia_weight": 0.7,
            "max_velocity": 1.0
        }
        
    async def initialize(self):
        """Initialize evolution systems"""
        try:
            # Connect to Redis
            self.redis_client = redis.from_url("redis://redis:6379")
            
            # Load constitutional constraints
            await self.load_constitutional_constraints()
            
            # Initialize neural networks
            await self.initialize_neural_networks()
            
            # Load evolution goals
            await self.load_evolution_goals()
            
            # Start evolution processes
            await self.start_evolution_processes()
            
            logger.info("Constitutional Evolution Engine initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize evolution engine: {e}")
            raise

    async def load_constitutional_constraints(self):
        """Load constitutional constraints for evolution"""
        self.constitutional_constraints = {
            "governance_constraints": {
                "min_consensus_threshold": 0.51,
                "max_power_concentration": 0.33,
                "transparency_requirement": 0.8,
                "democratic_participation": 0.6
            },
            "security_constraints": {
                "min_security_level": 0.9,
                "max_vulnerability_window": 3600,  # 1 hour
                "encryption_strength": 256,
                "access_control_strictness": 0.95
            },
            "performance_constraints": {
                "min_availability": 0.99,
                "max_response_time": 2.0,  # seconds
                "min_throughput": 100,  # requests/second
                "max_resource_usage": 0.8
            },
            "ethical_constraints": {
                "fairness_index": 0.85,
                "bias_tolerance": 0.1,
                "autonomy_respect": 0.9,
                "transparency_score": 0.8
            }
        }

    async def initialize_neural_networks(self):
        """Initialize neural networks for evolution"""
        try:
            # Fitness evaluation network
            class FitnessNetwork(nn.Module):
                def __init__(self, input_size=20, hidden_size=64):
                    super().__init__()
                    self.layers = nn.Sequential(
                        nn.Linear(input_size, hidden_size),
                        nn.ReLU(),
                        nn.Linear(hidden_size, hidden_size),
                        nn.ReLU(),
                        nn.Linear(hidden_size, 1),
                        nn.Sigmoid()
                    )
                
                def forward(self, x):
                    return self.layers(x)
            
            self.fitness_network = FitnessNetwork()
            self.fitness_optimizer = optim.Adam(self.fitness_network.parameters(), lr=0.001)
            
            logger.info("Neural networks initialized")
            
        except Exception as e:
            logger.error(f"Neural network initialization failed: {e}")

    async def load_evolution_goals(self):
        """Load active evolution goals"""
        default_goals = [
            ConstitutionalEvolutionGoal(
                id="governance_efficiency",
                title="Governance Process Efficiency",
                description="Optimize governance decision-making speed while maintaining democracy",
                target_metrics={
                    "decision_speed": 0.8,
                    "consensus_quality": 0.9,
                    "participation_rate": 0.7
                },
                constitutional_constraints={
                    "min_consensus": 0.51,
                    "transparency": 0.8
                },
                priority=8
            ),
            ConstitutionalEvolutionGoal(
                id="agent_coordination",
                title="Multi-Agent Coordination",
                description="Improve coordination between autonomous agents",
                target_metrics={
                    "coordination_efficiency": 0.85,
                    "task_completion_rate": 0.9,
                    "resource_utilization": 0.8
                },
                constitutional_constraints={
                    "agent_autonomy": 0.7,
                    "fair_resource_access": 0.8
                },
                priority=7
            ),
            ConstitutionalEvolutionGoal(
                id="security_adaptation",
                title="Adaptive Security Enhancement",
                description="Continuously improve security measures against emerging threats",
                target_metrics={
                    "threat_detection_rate": 0.95,
                    "false_positive_rate": 0.05,
                    "response_time": 0.9
                },
                constitutional_constraints={
                    "privacy_protection": 0.9,
                    "access_rights": 0.8
                },
                priority=9
            )
        ]
        
        for goal in default_goals:
            self.evolution_goals[goal.id] = goal
            await self.initialize_population(goal)

    async def initialize_population(self, goal: ConstitutionalEvolutionGoal):
        """Initialize population for evolution goal"""
        try:
            population = []
            
            for i in range(self.population_size):
                candidate = EvolutionCandidate(
                    id=f"{goal.id}_gen0_ind{i}",
                    evolution_type=self.determine_evolution_type(goal),
                    strategy=random.choice(list(LearningStrategy)),
                    parameters=await self.generate_random_parameters(goal),
                    fitness_score=0.0,
                    generation=0,
                    parent_ids=[],
                    constitutional_compliance=0.0,
                    created_at=time.time()
                )
                
                population.append(candidate)
            
            self.active_populations[goal.id] = population
            logger.info(f"Initialized population of {len(population)} for goal {goal.id}")
            
        except Exception as e:
            logger.error(f"Population initialization failed: {e}")

    def determine_evolution_type(self, goal: ConstitutionalEvolutionGoal) -> EvolutionType:
        """Determine evolution type based on goal"""
        if "governance" in goal.id:
            return EvolutionType.GOVERNANCE_OPTIMIZATION
        elif "agent" in goal.id:
            return EvolutionType.AGENT_COORDINATION
        elif "security" in goal.id:
            return EvolutionType.SECURITY_ENHANCEMENT
        else:
            return EvolutionType.PERFORMANCE_TUNING

    async def generate_random_parameters(self, goal: ConstitutionalEvolutionGoal) -> Dict[str, Any]:
        """Generate random parameters for candidate"""
        if goal.id == "governance_efficiency":
            return {
                "voting_threshold": random.uniform(0.5, 0.8),
                "deliberation_time": random.uniform(1.0, 24.0),  # hours
                "consensus_algorithm": random.choice(["simple_majority", "supermajority", "weighted_voting"]),
                "participation_incentive": random.uniform(0.1, 1.0),
                "transparency_level": random.uniform(0.7, 1.0)
            }
        elif goal.id == "agent_coordination":
            return {
                "coordination_protocol": random.choice(["centralized", "distributed", "hierarchical"]),
                "communication_frequency": random.uniform(0.1, 10.0),  # Hz
                "task_allocation_strategy": random.choice(["round_robin", "capability_based", "auction"]),
                "conflict_resolution": random.choice(["voting", "mediator", "hierarchy"]),
                "resource_sharing_ratio": random.uniform(0.1, 0.9)
            }
        elif goal.id == "security_adaptation":
            return {
                "threat_detection_sensitivity": random.uniform(0.1, 1.0),
                "response_escalation_threshold": random.uniform(0.3, 0.9),
                "monitoring_granularity": random.choice(["low", "medium", "high"]),
                "intrusion_response_type": random.choice(["isolate", "monitor", "block"]),
                "learning_rate": random.uniform(0.001, 0.1)
            }
        else:
            return {"parameter_" + str(i): random.uniform(0, 1) for i in range(5)}

    async def start_evolution_processes(self):
        """Start evolution processes for all goals"""
        self.running = True
        
        # Start evolution loops for each goal
        for goal_id in self.evolution_goals:
            asyncio.create_task(self.evolution_loop(goal_id))
        
        # Start fitness evaluation service
        asyncio.create_task(self.fitness_evaluation_service())
        
        # Start performance monitoring
        asyncio.create_task(self.performance_monitoring())

    async def evolution_loop(self, goal_id: str):
        """Main evolution loop for a specific goal"""
        while self.running:
            try:
                goal = self.evolution_goals[goal_id]
                population = self.active_populations[goal_id]
                
                # Evaluate fitness for all candidates
                await self.evaluate_population_fitness(goal, population)
                
                # Check if goal is achieved
                best_candidate = max(population, key=lambda c: c.fitness_score)
                if await self.check_goal_achievement(goal, best_candidate):
                    await self.deploy_solution(goal, best_candidate)
                    # Continue evolution for further improvements
                
                # Evolve population
                new_population = await self.evolve_population(goal, population)
                self.active_populations[goal_id] = new_population
                
                # Update goal status
                goal.generations_completed += 1
                goal.current_best_fitness = best_candidate.fitness_score
                
                # Log evolution progress
                await self.log_evolution_progress(goal, best_candidate)
                
                # Wait before next generation
                await asyncio.sleep(30)  # 30 seconds between generations
                
            except Exception as e:
                logger.error(f"Error in evolution loop for {goal_id}: {e}")
                await asyncio.sleep(60)

    async def evaluate_population_fitness(self, goal: ConstitutionalEvolutionGoal, population: List[EvolutionCandidate]):
        """Evaluate fitness for all candidates in population"""
        for candidate in population:
            try:
                # Constitutional compliance check
                constitutional_score = await self.evaluate_constitutional_compliance(candidate)
                candidate.constitutional_compliance = constitutional_score
                
                # Performance evaluation
                performance_score = await self.evaluate_performance(goal, candidate)
                
                # Combined fitness score
                candidate.fitness_score = (constitutional_score * 0.4) + (performance_score * 0.6)
                
                # Use neural network for refined evaluation
                if self.fitness_network:
                    nn_score = await self.neural_fitness_evaluation(candidate)
                    candidate.fitness_score = (candidate.fitness_score * 0.7) + (nn_score * 0.3)
                
                candidate.tested_at = time.time()
                
            except Exception as e:
                logger.error(f"Fitness evaluation failed for {candidate.id}: {e}")
                candidate.fitness_score = 0.0

    async def evaluate_constitutional_compliance(self, candidate: EvolutionCandidate) -> float:
        """Evaluate how well candidate complies with constitutional constraints"""
        try:
            compliance_score = 1.0
            
            # Check against relevant constraints
            if candidate.evolution_type == EvolutionType.GOVERNANCE_OPTIMIZATION:
                constraints = self.constitutional_constraints["governance_constraints"]
                
                # Check voting threshold
                if "voting_threshold" in candidate.parameters:
                    threshold = candidate.parameters["voting_threshold"]
                    if threshold < constraints["min_consensus_threshold"]:
                        compliance_score *= 0.5
                
                # Check transparency
                if "transparency_level" in candidate.parameters:
                    transparency = candidate.parameters["transparency_level"]
                    if transparency < constraints["transparency_requirement"]:
                        compliance_score *= 0.7
            
            elif candidate.evolution_type == EvolutionType.SECURITY_ENHANCEMENT:
                constraints = self.constitutional_constraints["security_constraints"]
                
                # Check security level
                if "threat_detection_sensitivity" in candidate.parameters:
                    sensitivity = candidate.parameters["threat_detection_sensitivity"]
                    if sensitivity < constraints["min_security_level"]:
                        compliance_score *= 0.3
            
            return compliance_score
            
        except Exception as e:
            logger.error(f"Constitutional compliance evaluation failed: {e}")
            return 0.0

    async def evaluate_performance(self, goal: ConstitutionalEvolutionGoal, candidate: EvolutionCandidate) -> float:
        """Evaluate candidate performance against goal metrics"""
        try:
            # Simulate performance based on parameters
            performance_score = 0.0
            
            if goal.id == "governance_efficiency":
                # Simulate governance metrics
                decision_speed = 1.0 - (candidate.parameters.get("deliberation_time", 12) / 24.0)
                consensus_quality = candidate.parameters.get("voting_threshold", 0.5)
                participation = candidate.parameters.get("participation_incentive", 0.5)
                
                performance_score = (decision_speed + consensus_quality + participation) / 3.0
                
            elif goal.id == "agent_coordination":
                # Simulate coordination metrics
                efficiency = 1.0 if candidate.parameters.get("coordination_protocol") == "distributed" else 0.7
                completion_rate = candidate.parameters.get("resource_sharing_ratio", 0.5)
                utilization = 1.0 - abs(0.8 - candidate.parameters.get("communication_frequency", 5.0) / 10.0)
                
                performance_score = (efficiency + completion_rate + utilization) / 3.0
                
            elif goal.id == "security_adaptation":
                # Simulate security metrics
                detection_rate = candidate.parameters.get("threat_detection_sensitivity", 0.5)
                false_positive_rate = 1.0 - candidate.parameters.get("response_escalation_threshold", 0.5)
                response_time = 1.0 - candidate.parameters.get("learning_rate", 0.05) * 10
                
                performance_score = (detection_rate + false_positive_rate + response_time) / 3.0
            
            return max(0.0, min(1.0, performance_score))
            
        except Exception as e:
            logger.error(f"Performance evaluation failed: {e}")
            return 0.0

    async def neural_fitness_evaluation(self, candidate: EvolutionCandidate) -> float:
        """Use neural network for fitness evaluation"""
        try:
            # Convert candidate parameters to feature vector
            features = []
            for key, value in candidate.parameters.items():
                if isinstance(value, (int, float)):
                    features.append(value)
                elif isinstance(value, str):
                    features.append(hash(value) % 100 / 100.0)  # Simple string encoding
                else:
                    features.append(0.5)  # Default value
            
            # Pad or truncate to fixed size
            features = features[:20] + [0.0] * (20 - len(features))
            
            # Evaluate with neural network
            with torch.no_grad():
                input_tensor = torch.FloatTensor(features).unsqueeze(0)
                score = self.fitness_network(input_tensor).item()
            
            return score
            
        except Exception as e:
            logger.error(f"Neural fitness evaluation failed: {e}")
            return 0.5

    async def evolve_population(self, goal: ConstitutionalEvolutionGoal, population: List[EvolutionCandidate]) -> List[EvolutionCandidate]:
        """Evolve population to next generation"""
        try:
            # Sort by fitness
            population.sort(key=lambda c: c.fitness_score, reverse=True)
            
            # Select parents (top 50%)
            parents = population[:len(population) // 2]
            
            new_population = []
            
            # Elitism: keep top 10%
            elite_count = max(1, len(population) // 10)
            new_population.extend(parents[:elite_count])
            
            # Generate offspring
            while len(new_population) < len(population):
                if random.random() < 0.8:  # Crossover
                    parent1, parent2 = random.sample(parents, 2)
                    child = await self.crossover(parent1, parent2, goal)
                else:  # Mutation
                    parent = random.choice(parents)
                    child = await self.mutate(parent, goal)
                
                new_population.append(child)
            
            return new_population
            
        except Exception as e:
            logger.error(f"Population evolution failed: {e}")
            return population

    async def crossover(self, parent1: EvolutionCandidate, parent2: EvolutionCandidate, goal: ConstitutionalEvolutionGoal) -> EvolutionCandidate:
        """Create offspring through crossover"""
        try:
            child_parameters = {}
            
            for key in parent1.parameters:
                if key in parent2.parameters:
                    # Random selection from parents
                    if random.random() < 0.5:
                        child_parameters[key] = parent1.parameters[key]
                    else:
                        child_parameters[key] = parent2.parameters[key]
                else:
                    child_parameters[key] = parent1.parameters[key]
            
            child = EvolutionCandidate(
                id=f"{goal.id}_gen{self.current_generation + 1}_cross_{uuid.uuid4().hex[:8]}",
                evolution_type=parent1.evolution_type,
                strategy=random.choice([parent1.strategy, parent2.strategy]),
                parameters=child_parameters,
                fitness_score=0.0,
                generation=self.current_generation + 1,
                parent_ids=[parent1.id, parent2.id],
                constitutional_compliance=0.0,
                created_at=time.time()
            )
            
            return child
            
        except Exception as e:
            logger.error(f"Crossover failed: {e}")
            return parent1

    async def mutate(self, parent: EvolutionCandidate, goal: ConstitutionalEvolutionGoal) -> EvolutionCandidate:
        """Create offspring through mutation"""
        try:
            mutated_parameters = parent.parameters.copy()
            
            # Mutate random parameters
            mutation_rate = 0.1
            for key, value in mutated_parameters.items():
                if random.random() < mutation_rate:
                    if isinstance(value, float):
                        # Gaussian mutation
                        mutated_parameters[key] = max(0.0, min(1.0, value + random.gauss(0, 0.1)))
                    elif isinstance(value, int):
                        mutated_parameters[key] = max(1, value + random.randint(-2, 2))
                    elif isinstance(value, str):
                        # Random choice from possible values
                        if key == "consensus_algorithm":
                            mutated_parameters[key] = random.choice(["simple_majority", "supermajority", "weighted_voting"])
                        elif key == "coordination_protocol":
                            mutated_parameters[key] = random.choice(["centralized", "distributed", "hierarchical"])
            
            child = EvolutionCandidate(
                id=f"{goal.id}_gen{self.current_generation + 1}_mut_{uuid.uuid4().hex[:8]}",
                evolution_type=parent.evolution_type,
                strategy=parent.strategy,
                parameters=mutated_parameters,
                fitness_score=0.0,
                generation=self.current_generation + 1,
                parent_ids=[parent.id],
                constitutional_compliance=0.0,
                created_at=time.time()
            )
            
            return child
            
        except Exception as e:
            logger.error(f"Mutation failed: {e}")
            return parent

    async def check_goal_achievement(self, goal: ConstitutionalEvolutionGoal, candidate: EvolutionCandidate) -> bool:
        """Check if evolution goal has been achieved"""
        try:
            # Check if fitness score meets all target metrics
            target_threshold = 0.8  # 80% of maximum possible fitness
            
            if candidate.fitness_score >= target_threshold and candidate.constitutional_compliance >= 0.8:
                logger.info(f"Goal {goal.id} achieved with fitness {candidate.fitness_score}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Goal achievement check failed: {e}")
            return False

    async def deploy_solution(self, goal: ConstitutionalEvolutionGoal, candidate: EvolutionCandidate):
        """Deploy evolved solution"""
        try:
            deployment_data = {
                "goal_id": goal.id,
                "candidate_id": candidate.id,
                "parameters": candidate.parameters,
                "fitness_score": candidate.fitness_score,
                "constitutional_compliance": candidate.constitutional_compliance,
                "deployment_timestamp": time.time()
            }
            
            # Publish deployment
            await self.redis_client.publish("evolution_deployments", json.dumps(deployment_data))
            
            # Store in deployment history
            await self.redis_client.lpush("deployed_solutions", json.dumps(deployment_data))
            await self.redis_client.ltrim("deployed_solutions", 0, 999)  # Keep last 1000
            
            candidate.deployed_at = time.time()
            
            logger.info(f"Deployed solution for goal {goal.id}: {candidate.id}")
            
        except Exception as e:
            logger.error(f"Solution deployment failed: {e}")

    async def fitness_evaluation_service(self):
        """Background service for continuous fitness evaluation"""
        while self.running:
            try:
                # Train fitness network with performance data
                await self.train_fitness_network()
                
                # Update swarm parameters
                await self.update_swarm_parameters()
                
                await asyncio.sleep(300)  # Every 5 minutes
                
            except Exception as e:
                logger.error(f"Fitness evaluation service error: {e}")
                await asyncio.sleep(60)

    async def train_fitness_network(self):
        """Train neural network with collected performance data"""
        try:
            if len(self.performance_history) < 50:
                return
            
            # Prepare training data
            training_data = list(self.performance_history)[-100:]  # Last 100 samples
            
            features = []
            targets = []
            
            for data in training_data:
                if "candidate_features" in data and "actual_performance" in data:
                    features.append(data["candidate_features"])
                    targets.append([data["actual_performance"]])
            
            if len(features) < 10:
                return
            
            # Train network
            self.fitness_network.train()
            
            feature_tensor = torch.FloatTensor(features)
            target_tensor = torch.FloatTensor(targets)
            
            for epoch in range(10):
                self.fitness_optimizer.zero_grad()
                outputs = self.fitness_network(feature_tensor)
                loss = nn.MSELoss()(outputs, target_tensor)
                loss.backward()
                self.fitness_optimizer.step()
            
            logger.info(f"Trained fitness network with {len(features)} samples")
            
        except Exception as e:
            logger.error(f"Fitness network training failed: {e}")

    async def update_swarm_parameters(self):
        """Update swarm intelligence parameters based on performance"""
        try:
            # Analyze recent performance
            recent_performance = list(self.performance_history)[-50:]
            
            if len(recent_performance) < 10:
                return
            
            avg_performance = sum(p.get("fitness_improvement", 0) for p in recent_performance) / len(recent_performance)
            
            # Adjust parameters based on performance
            if avg_performance < 0.1:  # Low improvement
                self.swarm_parameters["cognitive_weight"] *= 1.1
                self.swarm_parameters["inertia_weight"] *= 0.9
            elif avg_performance > 0.3:  # High improvement
                self.swarm_parameters["social_weight"] *= 1.1
                self.swarm_parameters["inertia_weight"] *= 1.1
            
            # Keep parameters in reasonable bounds
            for key, value in self.swarm_parameters.items():
                self.swarm_parameters[key] = max(0.1, min(3.0, value))
            
        except Exception as e:
            logger.error(f"Swarm parameter update failed: {e}")

    async def performance_monitoring(self):
        """Monitor system performance and collect data"""
        while self.running:
            try:
                # Collect performance metrics from all systems
                system_metrics = await self.collect_system_metrics()
                
                # Store in performance history
                self.performance_history.append({
                    "timestamp": time.time(),
                    "system_metrics": system_metrics,
                    "evolution_status": {
                        "active_goals": len(self.evolution_goals),
                        "total_generations": sum(g.generations_completed for g in self.evolution_goals.values()),
                        "best_fitness": max((g.current_best_fitness for g in self.evolution_goals.values()), default=0.0)
                    }
                })
                
                await asyncio.sleep(60)  # Every minute
                
            except Exception as e:
                logger.error(f"Performance monitoring error: {e}")
                await asyncio.sleep(60)

    async def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect metrics from all AVA systems"""
        try:
            metrics = {}
            
            # Get metrics from other services
            services = {
                "ava-core": "http://ava-core:8001/metrics",
                "memory-core": "http://memory-core:8002/metrics", 
                "perception-layer": "http://perception-layer:8003/metrics",
                "action-layer": "http://action-layer:8004/metrics",
                "vault": "http://vault:8005/metrics"
            }
            
            async with aiohttp.ClientSession() as session:
                for service, url in services.items():
                    try:
                        async with session.get(url, timeout=5) as response:
                            if response.status == 200:
                                data = await response.json()
                                metrics[service] = data
                    except Exception:
                        metrics[service] = {"status": "unavailable"}
            
            return metrics
            
        except Exception as e:
            logger.error(f"System metrics collection failed: {e}")
            return {}

    async def log_evolution_progress(self, goal: ConstitutionalEvolutionGoal, best_candidate: EvolutionCandidate):
        """Log evolution progress"""
        try:
            progress_data = {
                "timestamp": time.time(),
                "goal_id": goal.id,
                "generation": goal.generations_completed,
                "best_fitness": best_candidate.fitness_score,
                "constitutional_compliance": best_candidate.constitutional_compliance,
                "candidate_id": best_candidate.id,
                "strategy": best_candidate.strategy.value
            }
            
            await self.redis_client.lpush("evolution_progress", json.dumps(progress_data))
            await self.redis_client.ltrim("evolution_progress", 0, 9999)  # Keep last 10k
            
        except Exception as e:
            logger.error(f"Evolution logging failed: {e}")

# FastAPI application
app = FastAPI(title="AVA Evolver", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global evolver
evolver = ConstitutionalEvolutionEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize evolver on startup"""
    await evolver.initialize()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    evolver.running = False

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "evolution_engine": "operational",
        "active_goals": len(evolver.evolution_goals),
        "current_generation": evolver.current_generation
    }

@app.get("/evolution/goals")
async def get_evolution_goals():
    """Get all evolution goals"""
    return [asdict(goal) for goal in evolver.evolution_goals.values()]

@app.get("/evolution/goal/{goal_id}")
async def get_evolution_goal(goal_id: str):
    """Get specific evolution goal"""
    if goal_id in evolver.evolution_goals:
        goal = evolver.evolution_goals[goal_id]
        population = evolver.active_populations.get(goal_id, [])
        
        return {
            "goal": asdict(goal),
            "population_size": len(population),
            "best_fitness": max((c.fitness_score for c in population), default=0.0),
            "average_fitness": sum(c.fitness_score for c in population) / len(population) if population else 0.0
        }
    else:
        raise HTTPException(status_code=404, detail="Goal not found")

@app.get("/evolution/population/{goal_id}")
async def get_population(goal_id: str, limit: int = 20):
    """Get population for evolution goal"""
    if goal_id in evolver.active_populations:
        population = evolver.active_populations[goal_id]
        sorted_population = sorted(population, key=lambda c: c.fitness_score, reverse=True)
        return [asdict(candidate) for candidate in sorted_population[:limit]]
    else:
        raise HTTPException(status_code=404, detail="Population not found")

@app.get("/evolution/progress")
async def get_evolution_progress(limit: int = 100):
    """Get evolution progress history"""
    try:
        progress = await evolver.redis_client.lrange("evolution_progress", 0, limit - 1)
        return [json.loads(p) for p in progress]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/evolution/deployments")
async def get_deployed_solutions(limit: int = 50):
    """Get deployed solutions"""
    try:
        deployments = await evolver.redis_client.lrange("deployed_solutions", 0, limit - 1)
        return [json.loads(d) for d in deployments]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evolution/goal")
async def create_evolution_goal(goal_data: Dict[str, Any]):
    """Create new evolution goal"""
    try:
        goal = ConstitutionalEvolutionGoal(
            id=goal_data.get("id", f"goal_{uuid.uuid4().hex[:8]}"),
            title=goal_data["title"],
            description=goal_data["description"],
            target_metrics=goal_data["target_metrics"],
            constitutional_constraints=goal_data.get("constitutional_constraints", {}),
            priority=goal_data.get("priority", 5),
            deadline=goal_data.get("deadline")
        )
        
        evolver.evolution_goals[goal.id] = goal
        await evolver.initialize_population(goal)
        
        # Start evolution loop for new goal
        asyncio.create_task(evolver.evolution_loop(goal.id))
        
        return {"status": "created", "goal_id": goal.id}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/evolution/goal/{goal_id}")
async def delete_evolution_goal(goal_id: str):
    """Delete evolution goal"""
    try:
        if goal_id in evolver.evolution_goals:
            del evolver.evolution_goals[goal_id]
            if goal_id in evolver.active_populations:
                del evolver.active_populations[goal_id]
            return {"status": "deleted", "goal_id": goal_id}
        else:
            raise HTTPException(status_code=404, detail="Goal not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_metrics():
    """Get evolver metrics"""
    return {
        "timestamp": time.time(),
        "active_goals": len(evolver.evolution_goals),
        "total_generations": sum(g.generations_completed for g in evolver.evolution_goals.values()),
        "performance_history_size": len(evolver.performance_history),
        "swarm_parameters": evolver.swarm_parameters,
        "neural_network_size": sum(p.numel() for p in evolver.fitness_network.parameters()) if evolver.fitness_network else 0
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8006)
