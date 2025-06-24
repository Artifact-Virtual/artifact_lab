import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { WorkflowNode } from '../../types';
import { CanvasIcon, CloseIcon } from '../icons/ASCIIIcons';
import { CodeConverter } from './CodeConverter';
import Workflow3DView from '../visualization/Workflow3DView';
import { convert2DTo3D, generateSample3DWorkflow, layoutAlgorithms } from '../visualization/Workflow3DUtils';

interface WorkflowCanvasProps {
  isOpen: boolean;
}

const TEMPLATES = [
  // AI Agents
  { id: 'conversational-agent', name: 'Conversational Agent', icon: '◇', category: 'AI Agents', description: 'Multi-turn dialogue system with context memory' },
  { id: 'task-agent', name: 'Task Automation Agent', icon: '◈', category: 'AI Agents', description: 'Goal-oriented task execution with planning' },
  { id: 'research-agent', name: 'Research Agent', icon: '◉', category: 'AI Agents', description: 'Information gathering and synthesis agent' },
  { id: 'code-agent', name: 'Code Generation Agent', icon: '◊', category: 'AI Agents', description: 'Automated code writing and debugging' },
  
  // GPT Model Training
  { id: 'gpt-fine-tuning', name: 'GPT Fine-tuning Pipeline', icon: '⟐', category: 'GPT Training', description: 'Custom GPT model training workflow' },
  { id: 'prompt-engineering', name: 'Prompt Engineering Lab', icon: '◎', category: 'GPT Training', description: 'Advanced prompt optimization system' },
  { id: 'model-evaluation', name: 'Model Evaluation Suite', icon: '◆', category: 'GPT Training', description: 'Comprehensive model testing framework' },
  { id: 'dataset-preparation', name: 'Training Data Prep', icon: '▣', category: 'GPT Training', description: 'Data cleaning and formatting for training' },
  { id: 'hyperparameter-tuning', name: 'Hyperparameter Optimizer', icon: '▢', category: 'GPT Training', description: 'Automated hyperparameter search' },
  
  // Data Ingestion
  { id: 'streaming-ingestion', name: 'Real-time Stream Processor', icon: '⟡', category: 'Data Ingestion', description: 'High-throughput data streaming pipeline' },
  { id: 'batch-ingestion', name: 'Batch Data Processor', icon: '⟢', category: 'Data Ingestion', description: 'Large-scale batch processing system' },
  { id: 'api-scraper', name: 'API Data Harvester', icon: '⟣', category: 'Data Ingestion', description: 'Multi-source API data collection' },
  { id: 'web-scraper', name: 'Web Scraping Engine', icon: '⟤', category: 'Data Ingestion', description: 'Intelligent web content extraction' },
  { id: 'file-watcher', name: 'File System Monitor', icon: '⟥', category: 'Data Ingestion', description: 'Automated file processing pipeline' },
  
  // Data Storage
  { id: 'vector-database', name: 'Vector Database', icon: '◢', category: 'Data Storage', description: 'High-dimensional vector storage and search' },
  { id: 'time-series-db', name: 'Time Series Database', icon: '◣', category: 'Data Storage', description: 'Optimized temporal data storage' },
  { id: 'graph-database', name: 'Graph Database', icon: '◤', category: 'Data Storage', description: 'Relationship-focused data modeling' },
  { id: 'document-store', name: 'Document Store', icon: '◥', category: 'Data Storage', description: 'Flexible document-based storage' },
  { id: 'data-lake', name: 'Data Lake Architecture', icon: '◦', category: 'Data Storage', description: 'Scalable raw data repository' },
  
  // Data Integration
  { id: 'etl-pipeline', name: 'ETL Pipeline', icon: '⬢', category: 'Data Integration', description: 'Extract, Transform, Load workflow' },
  { id: 'data-mesh', name: 'Data Mesh Hub', icon: '⬡', category: 'Data Integration', description: 'Decentralized data architecture' },
  { id: 'api-gateway', name: 'Data API Gateway', icon: '⬠', category: 'Data Integration', description: 'Unified data access layer' },
  { id: 'schema-registry', name: 'Schema Registry', icon: '⬟', category: 'Data Integration', description: 'Data format management system' },
  { id: 'data-catalog', name: 'Data Catalog', icon: '⬞', category: 'Data Integration', description: 'Metadata management and discovery' },
  
  // Cognitive AI
  { id: 'memory-network', name: 'Memory Network', icon: '◐', category: 'Cognitive AI', description: 'Long-term memory and recall system' },
  { id: 'attention-mechanism', name: 'Attention Engine', icon: '◑', category: 'Cognitive AI', description: 'Dynamic focus and attention modeling' },
  { id: 'cognitive-architecture', name: 'Cognitive Architecture', icon: '◒', category: 'Cognitive AI', description: 'Human-like reasoning framework' },
  { id: 'metacognition', name: 'Metacognitive System', icon: '◓', category: 'Cognitive AI', description: 'Self-aware learning and adaptation' },
  { id: 'working-memory', name: 'Working Memory Model', icon: '◔', category: 'Cognitive AI', description: 'Short-term information processing' },
  
  // Neuro-Symbolic
  { id: 'neural-symbolic', name: 'Neural-Symbolic Fusion', icon: '⬢', category: 'Neuro-Symbolic', description: 'Logic and neural network integration' },
  { id: 'knowledge-graph', name: 'Knowledge Graph Engine', icon: '⬡', category: 'Neuro-Symbolic', description: 'Structured knowledge representation' },
  { id: 'symbolic-reasoning', name: 'Symbolic Reasoner', icon: '⬠', category: 'Neuro-Symbolic', description: 'Logic-based inference engine' },
  { id: 'concept-learning', name: 'Concept Learning System', icon: '⬟', category: 'Neuro-Symbolic', description: 'Abstract concept acquisition' },
  { id: 'causal-inference', name: 'Causal Inference Engine', icon: '⬞', category: 'Neuro-Symbolic', description: 'Cause-effect relationship modeling' },
  
  // Advanced Reasoning
  { id: 'chain-of-thought', name: 'Chain-of-Thought Processor', icon: '⟐', category: 'Advanced Reasoning', description: 'Step-by-step reasoning pipeline' },
  { id: 'tree-of-thoughts', name: 'Tree-of-Thoughts Explorer', icon: '⟑', category: 'Advanced Reasoning', description: 'Multi-path reasoning exploration' },
  { id: 'analogical-reasoning', name: 'Analogical Reasoner', icon: '⟒', category: 'Advanced Reasoning', description: 'Pattern-based inference system' },
  { id: 'abductive-reasoning', name: 'Abductive Reasoner', icon: '⟓', category: 'Advanced Reasoning', description: 'Best explanation inference' },
  { id: 'counterfactual', name: 'Counterfactual Engine', icon: '⟔', category: 'Advanced Reasoning', description: 'What-if scenario analysis' },
  
  // Quantum Computing
  { id: 'quantum-circuit', name: 'Quantum Circuit Designer', icon: '◈', category: 'Quantum', description: 'Visual quantum circuit construction' },
  { id: 'quantum-ml', name: 'Quantum ML Pipeline', icon: '◉', category: 'Quantum', description: 'Quantum-enhanced machine learning' },
  { id: 'quantum-optimizer', name: 'Quantum Optimizer', icon: '◊', category: 'Quantum', description: 'Quantum annealing optimization' },
  
  // Web3 & Blockchain
  { id: 'smart-contract', name: 'Smart Contract Factory', icon: '⟐', category: 'Web3', description: 'Automated contract deployment' },
  { id: 'dao-governance', name: 'DAO Governance System', icon: '◉', category: 'Web3', description: 'Decentralized decision making' },
  { id: 'daro-framework', name: 'DARO Framework', icon: '◎', category: 'Web3', description: 'Decentralized Autonomous Research Org' },
  { id: 'defi-protocol', name: 'DeFi Protocol Builder', icon: '◊', category: 'Web3', description: 'Decentralized finance infrastructure' },
];

const FUNCTIONS = [
  // Core Functions
  { id: 'data-processor', name: 'Data Processor', icon: '▣', category: 'Core', description: 'Multi-format data transformation' },
  { id: 'api-connector', name: 'API Connector', icon: '▢', category: 'Core', description: 'RESTful API integration hub' },
  { id: 'validator', name: 'Data Validator', icon: '◆', category: 'Core', description: 'Schema and quality validation' },
  { id: 'transformer', name: 'Data Transformer', icon: '◇', category: 'Core', description: 'Format and structure conversion' },
  
  // ML Functions
  { id: 'feature-extractor', name: 'Feature Extractor', icon: '◈', category: 'ML', description: 'Automated feature engineering' },
  { id: 'model-trainer', name: 'Model Trainer', icon: '◉', category: 'ML', description: 'Distributed model training' },
  { id: 'inference-engine', name: 'Inference Engine', icon: '◊', category: 'ML', description: 'Real-time model prediction' },
  { id: 'ensemble-combiner', name: 'Ensemble Combiner', icon: '◎', category: 'ML', description: 'Multi-model aggregation' },
  
  // Data Functions
  { id: 'data-cleaner', name: 'Data Cleaner', icon: '⟐', category: 'Data', description: 'Automated data quality improvement' },
  { id: 'anomaly-detector', name: 'Anomaly Detector', icon: '⟑', category: 'Data', description: 'Outlier identification system' },
  { id: 'data-profiler', name: 'Data Profiler', icon: '⟒', category: 'Data', description: 'Statistical data analysis' },
  { id: 'data-sampler', name: 'Data Sampler', icon: '⟓', category: 'Data', description: 'Intelligent data sampling' },
  
  // AI Functions
  { id: 'prompt-optimizer', name: 'Prompt Optimizer', icon: '◐', category: 'AI', description: 'Automated prompt improvement' },
  { id: 'context-manager', name: 'Context Manager', icon: '◑', category: 'AI', description: 'Conversation context handling' },
  { id: 'response-filter', name: 'Response Filter', icon: '◒', category: 'AI', description: 'Output quality and safety filtering' },
  { id: 'embedding-generator', name: 'Embedding Generator', icon: '◓', category: 'AI', description: 'Vector representation creation' },
];

const CanvasNode: React.FC<{ node: WorkflowNode; onUpdate: (id: string, updates: any) => void }> = ({ 
  node, 
  onUpdate 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        onUpdate(node.id, {
          position: {
            x: node.position.x + info.offset.x,
            y: node.position.y + info.offset.y,
          },
        });
      }}
      className={`absolute bg-black border border-white/20 p-3 rounded cursor-move min-w-48 max-w-64 ${
        isDragging ? 'z-50 border-white/40' : 'z-10'
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
    >
      <div className="text-white font-mono text-xs mb-1 flex items-center">
        <span className="mr-2 text-white/80">
          {node.type === 'template' ? '◈' : node.type === 'tool' ? '▣' : '◇'}
        </span>
        <span className="font-medium">{node.name}</span>
      </div>
      <div className="text-white/60 font-mono text-xs leading-relaxed">{node.description}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-white/40 font-mono text-xs">{node.type.toUpperCase()}</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 border border-white/20 rounded-full"></div>
          <div className="w-2 h-2 border border-white/20 rounded-full"></div>
        </div>
      </div>
    </motion.div>
  );
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ isOpen }) => {
  const { workflowNodes, addWorkflowNode, updateWorkflowNode, setWorkflowNodes, togglePanel } = useStore();
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('AI Agents');
  const [selectedFunctionCategory, setSelectedFunctionCategory] = useState<string>('Core');
  const [showCodeConverter, setShowCodeConverter] = useState(false);
  const [view3D, setView3D] = useState(false);
  const [layout3D, setLayout3D] = useState<'spiral' | 'hierarchical' | 'circular' | 'force'>('spiral');

  const addNodeToCanvas = (template: any, type: 'template' | 'tool' | 'function') => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type,
      name: template.name,
      description: template.description || `${template.name} node`,
      position: { 
        x: Math.random() * 600 + 200, 
        y: Math.random() * 400 + 100 
      },
      connections: [],
    };
    
    addWorkflowNode(newNode);
  };

  const templateCategories = [...new Set(TEMPLATES.map(t => t.category))];
  const functionCategories = [...new Set(FUNCTIONS.map(f => f.category))];
  
  const filteredTemplates = TEMPLATES.filter(t => t.category === selectedTemplateCategory);
  const filteredFunctions = FUNCTIONS.filter(f => f.category === selectedFunctionCategory);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: isOpen ? 0 : '100%' }}
      transition={{ type: "tween", duration: 0.4 }}
      className="fixed inset-0 bg-black z-30 flex flex-col"
    >
      {/* Top Bar with Code Converter Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="text-white font-mono text-sm tracking-wider flex items-center">
          <CanvasIcon className="mr-2" />
          ARTIFACT VIRTUAL LAB WORKFLOW CANVAS
          <span className="ml-4 text-white/60 text-xs">
            {workflowNodes.length} nodes active
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setView3D(!view3D)}
            className={`px-3 py-2 border font-mono text-xs transition-colors ${
              view3D 
                ? 'border-white/40 bg-white/10 text-white' 
                : 'border-white/20 text-white/60 hover:border-white/30'
            }`}
          >
            <span className="mr-2">◆</span>
            {view3D ? '2D Canvas' : '3D Research'}
          </button>
          {view3D && (
            <select
              value={layout3D}
              onChange={(e) => setLayout3D(e.target.value as any)}
              className="bg-black border border-white/20 text-white font-mono text-xs p-2 focus:border-white/40 focus:outline-none"
              title="3D Layout Algorithm"
            >
              <option value="spiral">Spiral</option>
              <option value="hierarchical">Hierarchical</option>
              <option value="circular">Circular</option>
              <option value="force">Force-Directed</option>
            </select>
          )}
          <button
            onClick={() => setShowCodeConverter(!showCodeConverter)}
            className={`px-3 py-2 border font-mono text-xs transition-colors ${
              showCodeConverter 
                ? 'border-white/40 bg-white/10 text-white' 
                : 'border-white/20 text-white/60 hover:border-white/30'
            }`}
          >
            <span className="mr-2">⟐</span>
            {showCodeConverter ? 'Hide Converter' : 'Code Converter'}
          </button>
          <button
            onClick={() => togglePanel('overlayCanvas')}
            className="p-2 border border-white/20 hover:bg-white/5 hover:border-white/30 transition-all duration-200 rounded"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Code Converter Panel */}
      {showCodeConverter && (
        <div className="border-b border-white/10 p-4">
          <CodeConverter 
            nodes={workflowNodes} 
            onNodesUpdate={setWorkflowNodes}
          />
        </div>
      )}

      {/* Main Canvas Layout */}
      <div className="flex-1 flex">
        {/* Left Toolbar - Templates */}
        <div className="w-80 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white font-mono text-sm tracking-wider mb-2">◈ AI/ML TEMPLATES</h2>
            <div className="text-white/60 font-mono text-xs">
              {TEMPLATES.length} advanced systems available
            </div>
          </div>
          
          {/* Template Category Filter */}
          <div className="p-3 border-b border-white/10">
            <select
              value={selectedTemplateCategory}
              onChange={(e) => setSelectedTemplateCategory(e.target.value)}
              className="w-full bg-black border border-white/20 text-white font-mono text-xs p-2 focus:border-white/40 focus:outline-none"
            >
              {templateCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                draggable
                onDragEnd={() => addNodeToCanvas(template, 'template')}
                className="p-3 border border-white/20 hover:bg-white/5 hover:border-white/30 cursor-grab active:cursor-grabbing transition-all duration-200 rounded"
              >
                <div className="text-white font-mono text-xs flex items-center mb-1">
                  <span className="mr-2 text-white/80">{template.icon}</span>
                  <span className="font-medium">{template.name}</span>
                </div>
                <div className="text-white/50 font-mono text-xs leading-relaxed">
                  {template.description}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-white/10">
            <button className="w-full p-3 border border-white/20 text-white font-mono text-xs hover:bg-white/5 hover:border-white/30 transition-all duration-200 rounded">
              <span className="mr-2">◇</span>
              AI TEMPLATE GENERATOR
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          {view3D ? (
            /* 3D Research Visualization */
            <div className="h-full w-full relative">
              {/* 3D View Header */}
              <div className="absolute top-4 left-4 z-10 bg-black/80 border border-white/20 rounded p-3">
                <div className="text-white font-mono text-xs tracking-wider mb-2">
                  ◆ 3D RESEARCH VISUALIZATION
                </div>
                <div className="text-white/60 font-mono text-xs space-y-1">
                  <div>Layout: {layout3D.toUpperCase()}</div>
                  <div>Nodes: {workflowNodes.length}</div>
                  <div>Controls: Click + Drag to rotate, Scroll to zoom</div>
                </div>
              </div>
              
              {/* 3D Workflow Visualization */}
              <Workflow3DView
                nodes={workflowNodes.length > 0 
                  ? layoutAlgorithms[layout3D](convert2DTo3D(workflowNodes))
                  : layoutAlgorithms[layout3D](generateSample3DWorkflow())
                }
                onNodeClick={(nodeId) => {
                  console.log('3D Node clicked:', nodeId);
                  // Add interaction logic here
                }}
                onNodeHover={(nodeId) => {
                  console.log('3D Node hovered:', nodeId);
                  // Add hover logic here
                }}
              />
            </div>
          ) : (
            /* Traditional 2D Canvas */
            <>
              {/* Grid Background */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                  `,
                  backgroundSize: '24px 24px',
                }}
              />
              
              {/* Workflow Nodes */}
              {workflowNodes.map((node) => (
                <CanvasNode
                  key={node.id}
                  node={node}
                  onUpdate={updateWorkflowNode}
                />
              ))}
              
              {/* Canvas Instructions */}
              {workflowNodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white/40 font-mono text-lg mb-2">◈</div>
                    <div className="text-white/60 font-mono text-sm mb-1">ARTIFACT VIRTUAL LAB WORKFLOW CANVAS</div>
                    <div className="text-white/40 font-mono text-xs">
                      Drag templates and functions to begin building
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Toolbar - Functions */}
        <div className="w-80 border-l border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white font-mono text-sm tracking-wider mb-2">◇ PROCESSING FUNCTIONS</h2>
            <div className="text-white/60 font-mono text-xs">
              {FUNCTIONS.length} specialized functions
            </div>
          </div>
          
          {/* Function Category Filter */}
          <div className="p-3 border-b border-white/10">
            <select
              value={selectedFunctionCategory}
              onChange={(e) => setSelectedFunctionCategory(e.target.value)}
              className="w-full bg-black border border-white/20 text-white font-mono text-xs p-2 focus:border-white/40 focus:outline-none"
            >
              {functionCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredFunctions.map((func) => (
              <div
                key={func.id}
                draggable
                onDragEnd={() => addNodeToCanvas(func, 'function')}
                className="p-3 border border-white/20 hover:bg-white/5 hover:border-white/30 cursor-grab active:cursor-grabbing transition-all duration-200 rounded"
              >
                <div className="text-white font-mono text-xs flex items-center mb-1">
                  <span className="mr-2 text-white/80">{func.icon}</span>
                  <span className="font-medium">{func.name}</span>
                </div>
                <div className="text-white/50 font-mono text-xs leading-relaxed">
                  {func.description}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-white/10 space-y-2">
            <button className="w-full p-3 border border-white/20 text-white font-mono text-xs hover:bg-white/5 hover:border-white/30 transition-all duration-200 rounded">
              <span className="mr-2">◇</span>
              AI WORKFLOW ASSISTANT
            </button>
            
            <div className="text-white/60 font-mono text-xs">
              <div className="flex justify-between mb-1">
                <span>Templates:</span>
                <span>{TEMPLATES.length}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Functions:</span>
                <span>{FUNCTIONS.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Nodes:</span>
                <span>{workflowNodes.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};