# DevCore Workspace Manager - Standard Operating Procedures (SOP)
**Version:** 2.0  
**Last Updated:** June 26, 2025  
**System:** Workspace Management & File Processing Engine  

---

## EXECUTIVE DIRECTIVE FOR LLM AGENTS
**CRITICAL INSTRUCTION:** When any LLM encounters this line → **[CREATE_JSON_SUMMARY_ALWAYS]** ← it must IMMEDIATELY execute the following command:
```bash
node generate-sop-summary.js --update-json --reflect-changes
```
This ensures all SOPs are continuously updated and reflected in machine-readable format.

---

## TABLE OF CONTENTS
1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [File Processing Engine](#file-processing-engine)
4. [Startup Procedures](#startup-procedures)
5. [Monitoring & Health Checks](#monitoring--health-checks)
6. [Universal File Processing](#universal-file-processing)
7. [Troubleshooting Procedures](#troubleshooting-procedures)
8. [Maintenance Schedules](#maintenance-schedules)
9. [Security Protocols](#security-protocols)
10. [Performance Optimization](#performance-optimization)
11. [Emergency Procedures](#emergency-procedures)
12. [Change Management](#change-management)

---

## SYSTEM OVERVIEW

### Purpose
The DevCore Workspace Manager is a comprehensive file management, monitoring, and processing system designed to:
- **Monitor** workspace files in real-time
- **Process** and standardize file formats
- **Analyze** dependencies and relationships
- **Visualize** project topology
- **Replace** emojis with professional Unicode symbols
- **Maintain** consistent file headers and footers

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   File Watcher  │    │   File Indexer  │    │  System Monitor │
│   (Advanced)    │◄──►│  (Dependency)   │◄──►│   (Resource)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Universal File  │    │  Main Manager   │    │   Visualizer    │
│   Processor     │◄──►│   (Orchestr.)   │◄──►│  (Topology)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │   Web Dashboard │
                    │ (localhost:8081)│
                    └─────────────────┘
```

---

## CORE COMPONENTS

### 1. Advanced File Watcher (`src/watcher.js`)
**Purpose:** Real-time file system monitoring  
**Key Features:**
- Chokidar-based file watching
- Ignored patterns for performance
- Event-driven architecture
- Recursive directory monitoring

**Health Check Criteria:**
- Response time < 100ms
- Memory usage < 50MB
- Event queue length < 1000

### 2. Dependency Indexer (`src/indexer.js`)
**Purpose:** Code analysis and dependency mapping  
**Key Features:**
- AST parsing for JavaScript/TypeScript
- Package.json analysis
- Reverse dependency mapping
- AI-powered file summaries

**Performance Targets:**
- Analysis time < 5s for 100 files
- Memory usage < 100MB
- Accuracy > 95%

### 3. System Monitor (`src/monitor.js`)
**Purpose:** Resource monitoring and health checks  
**Key Features:**
- CPU, memory, disk monitoring
- Component health verification
- Auto-restart capabilities
- Performance metrics collection

**Alert Thresholds:**
- CPU > 80% for 5 minutes
- Memory > 85% for 3 minutes
- Disk > 90%

### 4. Topology Visualizer (`src/visualizer.js`)
**Purpose:** Project structure visualization  
**Key Features:**
- D3.js-based topology generation
- Interactive dependency graphs
- Real-time updates
- Export capabilities

### 5. Code Formatter (`code-formatter.js`)
**Purpose:** Exhaustive file standardization  
**Key Features:**
- Emoji replacement with Unicode symbols
- Header/footer standardization
- Skip marker detection
- 40+ file type support
- Symbiotic file indexer integration

---

## FILE PROCESSING ENGINE

### Skip Marker System
**Marker:** `[PROCESSED-BY-DEVCORE-EMOJI-REPLACER-v2.0]`

**Purpose:** Prevents reprocessing of already standardized files  
**Implementation:** Added to file headers in appropriate comment format

### Supported File Types
```javascript
// Programming Languages
.js, .ts, .jsx, .tsx, .py, .rb, .php, .java, .c, .cpp, .cs, .go, .rs

// Web Technologies  
.html, .css, .scss, .less, .vue, .xml

// Configuration Files
.json, .yaml, .yml, .toml, .ini, .cfg, .conf

// Documentation
.md, .txt

// Scripts
.sh, .bash, .ps1, .bat, .cmd, .sql
```

### Emoji Mapping Standards
```javascript
🚀 → ▶  (Launch/Start)
✅ → ▣  (Success/Check)  
❌ → ×  (Error/Fail)
⚡ → ◊  (Fast/Power)
🔄 → ○  (Process/Cycle)
📊 → ■  (Data/Stats)
📝 → ▢  (Document/Note)
// ... (120+ total mappings)
```

---

## STARTUP PROCEDURES

### 1. System Prerequisites Check
```bash
# Node.js version verification
node --version  # Must be >= 16.0.0

# Memory availability check  
# System memory > 1GB available
# Disk space > 500MB available

# Port availability verification
# Default: 8081 (configurable)
```

### 2. Configuration Validation
```bash
# Configuration file check
ls language_model_abstraction/config.json

# LLM provider connectivity
# Ollama endpoint verification
# Model availability confirmation
```

### 3. Dependency Installation
```bash
npm install --production
# Verify critical dependencies:
# - chokidar, express, ws, fs-extra, glob
```

### 4. Service Startup Sequence
```bash
# 1. Start main application
node start.js

# 2. Verify component initialization
# - File Watcher: ○ Starting component: watcher
# - Indexer: ○ Starting component: indexer  
# - Monitor: ○ Starting component: monitor
# - Visualizer: ○ Starting component: visualizer

# 3. Confirm server startup
# ▶ Workspace Manager server running on port 8081

# 4. Banner display (indicates full operation)
# ASCII banner + "FULLY OPERATIONAL" message
```

### 5. Universal File Processing
```bash
# Manual execution
node code-formatter.js

# Watch mode (continuous processing)
node code-formatter.js --watch

# Integration with file indexer (automatic)
# Runs symbiotically with main system
```

---

## MONITORING & HEALTH CHECKS

### Component Health Verification
```javascript
// Health check frequency: Every 30 seconds
// Auto-restart threshold: 3 consecutive failures
// Max restart attempts: 5 per hour

Health Check Criteria:
- Response time < 200ms
- Memory usage within limits  
- No unhandled exceptions
- Event queue not overflowing
```

### Performance Metrics
```javascript
// System Metrics Tracked:
- CPU Usage (%)
- Memory Usage (MB/%)  
- Disk Usage (%)
- Network I/O (bytes/sec)
- File Processing Rate (files/min)
- Emoji Replacement Count
- Error Rate (%)
```

### Dashboard Monitoring
```bash
# Access points:
http://localhost:8081          # Main dashboard
http://localhost:8081/topology # Topology view
http://localhost:8081/api/status # API status

# Key indicators:
▣ Green: Component operational
○ Yellow: Component starting/restarting  
× Red: Component failed
▲ Orange: Warning/high resource usage
```

---

## UNIVERSAL FILE PROCESSING

### Processing Workflow
```
1. File Discovery
   ├── Glob pattern matching (40+ file types)  
   ├── Exclusion pattern filtering
   └── File prioritization

2. Skip Marker Detection
   ├── Read file content
   ├── Search for processing marker
   └── Skip if already processed

3. Emoji Replacement
   ├── Pattern matching (120+ emojis)
   ├── Unicode symbol substitution
   └── Replacement counting

4. Header/Footer Addition  
   ├── File type detection
   ├── Comment style selection
   └── Standardized formatting

5. File Writing & Tracking
   ├── Atomic file operations
   ├── Processing log updates
   └── Timestamp recording
```

### Watch Mode Integration
```bash
# Symbiotic operation with file indexer
# File change detection → Processing queue → Batch processing
# Debounce interval: 2 seconds
# Processing delay: Prevents race conditions
```

### Processing Statistics Tracking
```json
{
  "files": {
    "path/to/file.js": {
      "lastModified": 1719394800000,
      "processed": true,
      "lastProcessed": 1719394800000,
      "emojiReplacements": 5
    }
  },
  "lastRun": 1719394800000,
  "version": "2.0"
}
```

---

## TROUBLESHOOTING PROCEDURES

### Common Issues & Solutions

#### 1. High Memory Usage (>85%)
```bash
# Immediate Actions:
1. Check component memory usage
2. Reduce analysis_batch_size in config
3. Restart memory-intensive components
4. Close unnecessary applications

# Long-term Solutions:
- Optimize file processing batch sizes
- Implement memory garbage collection
- Monitor for memory leaks
```

#### 2. Port Already in Use (8081)
```bash
# Solutions:
1. netstat -ano | findstr :8081  # Find process using port
2. taskkill /PID <PID> /F        # Kill conflicting process
3. Modify config.json workspace_port
4. Use alternative port
```

#### 3. LLM Connection Failed
```bash
# Diagnostic Steps:
1. Verify Ollama service running
2. Check model availability: ollama list
3. Test connectivity: curl http://localhost:11434/api/version
4. Verify config.json LLM settings
```

#### 4. File Processing Errors
```bash
# Common Causes:
- File permission issues
- Corrupted file content
- Unsupported file encoding
- Disk space limitations

# Solutions:
- Run with appropriate permissions
- Check file integrity
- Convert to UTF-8 encoding
- Free disk space
```

#### 5. Component Auto-Restart Loops
```bash
# Diagnostic:
1. Check workspace-manager.log
2. Identify failing component
3. Review error messages
4. Check resource constraints

# Resolution:
- Increase component timeout values
- Fix underlying resource issues
- Reset component restart counters
```

---

## MAINTENANCE SCHEDULES

### Daily Maintenance
```bash
# Automated (via system):
- Component health checks
- Performance metric collection
- Log rotation (if enabled)
- File processing queue management

# Manual (as needed):
- Review error logs
- Monitor disk space
- Check system performance
```

### Weekly Maintenance  
```bash
# System Review:
1. Analyze performance trends
2. Review processed file statistics
3. Update file processing rules
4. Clean temporary files

# File Processing:
- Review emoji replacement patterns
- Update skip marker versions
- Validate file type support
- Check processing accuracy
```

### Monthly Maintenance
```bash
# System Updates:
1. Update Node.js dependencies
2. Review configuration settings
3. Optimize performance parameters
4. Update LLM models if needed

# Documentation:
- Update SOP procedures
- Review troubleshooting guides
- Update system architecture diagrams
```

### **[CREATE_JSON_SUMMARY_ALWAYS]**

---

## SECURITY PROTOCOLS

### File System Security
```bash
# Access Controls:
- Restrict write permissions to authorized users
- Monitor file modification attempts
- Log all file processing activities
- Validate file paths to prevent traversal attacks
```

### Network Security
```bash
# Web Dashboard:
- Bind to localhost only (default)
- Implement rate limiting
- Validate all API inputs
- Use HTTPS in production environments
```

### Data Protection
```bash
# Processing Safety:
- Backup files before processing
- Atomic file operations
- Rollback capabilities
- Processing audit trails
```

---

## PERFORMANCE OPTIMIZATION

### System Tuning
```javascript
// Configuration Optimizations:
{
  "analysis_batch_size": 10,        // Reduce for lower memory
  "monitoring_frequency": 30000,    // Increase for lower CPU
  "file_watch_throttle": 1000,     // Debounce file events
  "max_concurrent_processes": 4     // Limit parallel processing
}
```

### Resource Management
```bash
# Memory Optimization:
- Implement streaming for large files
- Use worker threads for CPU-intensive tasks
- Cache frequently accessed data
- Implement garbage collection triggers

# CPU Optimization:  
- Batch file processing operations
- Use asynchronous I/O operations
- Implement processing queues
- Optimize regex patterns
```

---

## EMERGENCY PROCEDURES

### System Failure Response
```bash
# Immediate Actions:
1. Stop all running processes: taskkill /F /IM node.exe
2. Check system resources: Task Manager analysis
3. Review error logs: workspace-manager.log
4. Identify root cause: component failure analysis

# Recovery Steps:
1. Clear processing queues
2. Reset component restart counters  
3. Restart with minimal configuration
4. Gradually restore full functionality
```

### Data Recovery
```bash
# File Processing Recovery:
1. Restore from backup if available
2. Re-run file processing with --force flag
3. Manually fix corrupted files
4. Rebuild processing tracking data
```

### Service Restoration
```bash
# Priority Order:
1. System Monitor (critical resource tracking)
2. File Watcher (change detection)
3. Dependency Indexer (analysis capabilities)
4. Topology Visualizer (reporting)
5. Universal File Processor (standardization)
```

---

## CHANGE MANAGEMENT

### Configuration Changes
```bash
# Process:
1. Backup current configuration
2. Test changes in isolated environment
3. Document change rationale
4. Implement with rollback plan
5. Monitor post-change performance
```

### File Processing Updates
```bash
# Emoji Mapping Changes:  
1. Update EMOJI_MAPPINGS object
2. Increment skip marker version
3. Test with sample files
4. Deploy with batch processing
5. Monitor replacement accuracy
```

### Component Updates
```bash
# Procedure:
1. Review component dependencies
2. Test in development environment
3. Create deployment package
4. Schedule maintenance window
5. Deploy with health monitoring
6. Validate full system operation
```

---

## APPENDICES

### A. Configuration Reference
```json
{
  "workspace_port": 8081,
  "model_provider": "ollama",
  "ollama_model": "codellama:7b",
  "analysis_batch_size": 10,
  "monitoring_frequency": 30000,
  "auto_restart_enabled": true,
  "max_restart_attempts": 5,
  "component_timeout": 30000,
  "file_processing_enabled": true,
  "emoji_replacement_enabled": true,
  "header_footer_enabled": true
}
```

### B. File Type Support Matrix
| Extension | Header Support | Footer Support | Skip Marker | Comment Style |
|-----------|----------------|----------------|-------------|---------------|
| .js/.ts   | ✓             | ✓              | ✓           | /* */ // |
| .py       | ✓             | ✓              | ✓           | """ # |  
| .html     | ✓             | ✓              | ✓           | <!-- --> |
| .json     | ×             | ×              | ×           | None |
| .md       | ✓             | ✓              | ✓           | <!-- --> |

### C. Performance Benchmarks
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| CPU Usage | <50% | 50-80% | >80% |
| Memory Usage | <70% | 70-85% | >85% |
| Disk Usage | <80% | 80-90% | >90% |
| File Processing Rate | >100/min | 50-100/min | <50/min |
| Component Response Time | <100ms | 100-500ms | >500ms |

---

## DOCUMENT CONTROL
- **Document ID:** WM-SOP-001
- **Version:** 2.0
- **Classification:** Internal Use
- **Review Cycle:** Monthly
- **Next Review:** July 26, 2025
- **Approved By:** DevCore Team
- **Distribution:** All LLM Agents, System Administrators

---

**END OF DOCUMENT**

*This SOP is a living document and must be updated to reflect system changes, performance optimizations, and operational improvements. All LLM agents must execute the CREATE_JSON_SUMMARY_ALWAYS directive when encountered.*
