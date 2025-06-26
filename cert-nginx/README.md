# 🚀 Reverse Ingress-Nginx Web Infrastructure

**Production-ready, enterprise-grade reverse proxy and ingress controller with SSL termination, security monitoring, AI automation, and zero external dependencies.**

> 🎯 **Template Ready**: This infrastructure template can be customized for any domain or application. All sensitive configurations have been parameterized for easy deployment.

---

## ⚡ Quick Start (30 seconds)

### Windows
```cmd
# One-click launcher with menu
start_ai_automation.bat

# Or PowerShell with parameters
.\start_ai_automation.ps1 dashboard
```

### Linux/macOS
```bash
# Quick deploy all services
python3 deploy_suite.py

# Or start individual services
python3 portable_server.py    # Web server
python3 security_monitor.py   # Security dashboard
node automation_scripts/orchestrator_fixed.js dashboard  # AI automation
```

**Your infrastructure will be running at:**
- 🌐 Website: <http://localhost:8080> (HTTP) / <https://localhost:8443> (HTTPS)
- 🛡️ Security Dashboard: CLI-based real-time monitoring
- 🤖 AI Dashboard: automation_logs/dashboard.html + WebSocket on port 8444
- 📊 Health Check: <http://localhost:8080/health>

---

## 🎯 What You Get

### 🌐 Self-Contained Web Server

- **Portable Nginx** - No system installation required
- **Auto-Generated SSL** - Production-ready TLS certificates
- **Production Config** - Security headers, compression, caching
- **Zero Dependencies** - Runs on any system with Python 3.8+

### 🛡️ Advanced Security Suite

- **Real-time Monitoring** - Rich CLI dashboard with system metrics
- **Threat Detection** - Network analysis with attack pattern recognition
- **Security Scoring** - Vulnerability assessment and prioritization
- **SSL Monitoring** - Certificate expiration and health checks

### 🤖 AI-Powered Automation

- **Visual Regression** - Screenshot comparison with AI analysis
- **Performance Testing** - Core Web Vitals and optimization recommendations
- **Security Scanning** - Advanced vulnerability detection with intelligent scoring
- **Content Analysis** - SEO scoring and accessibility assessment
- **Predictive Monitoring** - Pattern learning and anomaly detection

### 📊 Intelligent Orchestration

- **Task Scheduler** - Priority-based automation with retry logic
- **Real-time Dashboard** - WebSocket-powered monitoring interface
- **Comprehensive Reporting** - JSON reports with trend analysis
- **Multi-platform Support** - Windows, Linux, macOS compatibility

---

## 🏗️ Architecture

```text
┌─ Internet ─┐    ┌─ Portable Nginx ─┐    ┌─ Backend Services ─┐
│            │    │                  │    │                   │
│ Port 80    │───▶│ HTTP Redirect    │    │ Landing Page      │
│ Port 443   │───▶│ SSL Termination  │───▶│ API Endpoints     │
│            │    │ Security Headers │    │ Health Checks     │
└────────────┘    └──────────────────┘    └───────────────────┘
                           │
                           ▼
        ┌─ Monitoring & Automation Suite ─┐
        │                                 │
        │ 🛡️ Security Dashboard (Rich CLI) │
        │ 🤖 AI Automation (Puppeteer)    │
        │ 📊 Real-time WebSocket Monitor  │
        │ 📈 Performance Analytics        │
        └─────────────────────────────────┘
```

**Stack**: Python 3.8+ + Portable Nginx + Node.js 18+ + Rich CLI + Puppeteer

---

## 📦 Installation & Setup

### Prerequisites

- **Python 3.8+** (required for all components)
- **Node.js 18+** (required for AI automation)
- **Chrome/Chromium** (required for Puppeteer)
- **10MB disk space** (for binaries and logs)
- **Ports 8080, 8443, 8444** (configurable)

### Option 1: Automated Setup

```bash
# Clone repository
git clone <your-repo> && cd core/cert-nginx

# Windows - Interactive launcher
start_ai_automation.bat

# PowerShell - With parameters
.\start_ai_automation.ps1 dashboard -Verbose

# Python - All-in-one deployment
python3 deploy_suite.py
```

### Option 2: Manual Setup

```bash
# 1. Install Python dependencies
pip install -r monitor_requirements.txt

# 2. Install Node.js dependencies (for AI automation)
npm install

# 3. Setup and start web server
python3 setup.py
python3 portable_server.py

# 4. Start security monitoring (new terminal)
python3 security_monitor.py

# 5. Start AI automation dashboard (new terminal)
node automation_scripts/orchestrator_fixed.js dashboard
```

### Option 3: Individual Services

```bash
# Web server only
python3 portable_server.py

# Security dashboard only  
python3 dashboard_launcher.py

# AI automation only
node automation_scripts/orchestrator_fixed.js dashboard

# Performance testing only
node automation_scripts/advanced_ai_automation.js performance
```

---

## 🎛️ Usage Guide

### Web Server Management

```bash
# Start server
python3 portable_server.py

# Start with custom configuration
python3 portable_server.py --port 8080 --ssl-port 8443 --host 0.0.0.0

# Check status
curl http://localhost:8080/health
```

### Security Monitoring

```bash
# Start interactive dashboard
python3 dashboard_launcher.py

# Start individual monitors
python3 security_monitor.py    # System metrics
python3 network_analyzer.py    # Network analysis

# Configure thresholds (edit script or config)
THRESHOLDS = {'cpu': 80, 'memory': 85, 'disk': 90}
```

### AI Automation

```bash
# Start complete dashboard
node automation_scripts/orchestrator_fixed.js dashboard

# Run specific tests
node automation_scripts/advanced_ai_automation.js health
node automation_scripts/advanced_ai_automation.js security
node automation_scripts/advanced_ai_automation.js performance
node automation_scripts/advanced_ai_automation.js visual

# Generate reports
node automation_scripts/orchestrator_fixed.js report
```

### Interactive Launchers

```bash
# Windows batch menu
start_ai_automation.bat

# PowerShell with options
.\start_ai_automation.ps1 dashboard
.\start_ai_automation.ps1 security -Headless
.\start_ai_automation.ps1 all -Verbose

# Python interactive mode
python3 ai_automation.py
```

---

## ⚙️ Configuration

### Web Server Config

Edit `nginx.conf` or use `portable_server.py` parameters:

```python
# Key settings
PORT = 8080
SSL_PORT = 8443
SSL_CERT_PATH = "certs/"
STATIC_ROOT = "static/"
```

### Security Monitoring Config

Edit thresholds in monitoring scripts:

```python
THRESHOLDS = {
    'cpu': 80.0,           # CPU usage percentage
    'memory': 85.0,        # Memory usage percentage  
    'disk': 90.0,          # Disk usage percentage
    'failed_logins': 10,   # Max failed login attempts
    'response_time': 2.0,  # Max response time (seconds)
    'ssl_days': 7          # SSL expiration warning (days)
}
```

### AI Automation Config

Edit `automation_config/config.json`:

```json
{
  "targets": {
    "local": "https://localhost:8443",
    "health": "https://localhost:8443/health"
  },
  "ai": {
    "enableVisualRegression": true,
    "enableContentAnalysis": true,
    "enablePredictiveAnalytics": true
  },
  "scheduling": {
    "healthCheck": {"interval": 300, "enabled": true},
    "securityScan": {"interval": 3600, "enabled": true}
  },
  "thresholds": {
    "performance": {"score": 70},
    "security": {"score": 80},
    "content": {"score": 60}
  }
}
```

---

## 📊 Monitoring & Analytics

### Real-time Dashboards

- **Security Dashboard**: Rich CLI with system/network/security metrics
- **AI Dashboard**: Web-based real-time monitoring (automation_logs/dashboard.html)
- **WebSocket Interface**: Live updates on port 8444

### Generated Reports

- **Performance Reports**: automation_logs/reports/performance_*.json
- **Security Reports**: automation_logs/reports/security_*.json  
- **Visual Reports**: automation_logs/screenshots/
- **Comprehensive Reports**: Combined analysis across all metrics

### Key Metrics Tracked

- **System**: CPU, memory, disk usage, process monitoring
- **Network**: Connections, traffic analysis, threat detection
- **Security**: SSL status, vulnerability scanning, attack patterns
- **Performance**: Load times, Core Web Vitals, resource analysis
- **Content**: SEO scores, accessibility, content quality

---

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use**

```bash
# Check what's using the port
netstat -tulpn | grep :8080

# Kill process if needed
kill -9 $(lsof -t -i:8080)
```

**SSL Certificate Issues**

```bash
# Regenerate certificates
python3 setup.py --regenerate-ssl

# Check certificate validity
openssl x509 -in certs/server.crt -text -noout
```

**Node.js Dependencies**

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Puppeteer Browser Issues**

```bash
# Install Chromium dependencies
npx puppeteer install

# Run in debug mode
node automation_scripts/advanced_ai_automation.js security --debug
```

**Permission Issues (Linux/macOS)**

```bash
# Make scripts executable
chmod +x *.sh
chmod +x scripts/*.sh

# Fix Python permissions
chmod +x *.py
```

### Debug Mode

Enable verbose logging:

```bash
# Web server debug
python3 portable_server.py --debug

# Security monitoring debug  
python3 security_monitor.py --verbose

# AI automation debug
node automation_scripts/orchestrator_fixed.js dashboard --debug
```

### Log Locations

- **Web Server**: `logs/nginx/`
- **Security Monitoring**: `logs/security_*.log`
- **AI Automation**: `automation_logs/`
- **System Logs**: Check console output or system logs

---

## 🤝 Support & Documentation

### File Structure

```text
cert-nginx/
├── portable_server.py          # Main web server
├── security_monitor.py         # Security dashboard  
├── ai_automation.py            # AI automation controller
├── deploy_suite.py             # Unified deployment
├── automation_scripts/         # Node.js automation scripts
├── automation_config/          # Configuration files
├── automation_logs/            # Logs and reports
├── certs/                      # SSL certificates
├── static/                     # Static web files
└── start_ai_automation.*       # Platform launchers
```

### Quick Commands Reference

```bash
# Start everything
python3 deploy_suite.py

# Web server only
python3 portable_server.py

# Security monitoring
python3 dashboard_launcher.py

# AI automation
node automation_scripts/orchestrator_fixed.js dashboard

# Generate reports
node automation_scripts/orchestrator_fixed.js report

# Health check
curl http://localhost:8080/health
```

### Getting Help

- Check the troubleshooting section above
- Enable debug/verbose logging
- Review log files in respective directories  
- Check browser console for dashboard issues
- Verify all prerequisites are installed

---

**🎉 Ready to deploy? Choose your preferred method above and get started in 30 seconds!**

---

*Last updated: June 2025 | Version: 2.0 | Platform: Cross-platform*
- Security headers (HSTS, CSP, XSS protection)
- Rate limiting and DDoS protection
- Request sanitization and validation

### 📊 **Real-Time Monitoring**
- System resource tracking (CPU, memory, disk)
- Network traffic analysis
- Security event detection
- Rich CLI dashboard with live metrics

### 🤖 **AI/ML Optimized**
- Large file upload support (100MB+)
- Async processing capabilities
- Resource-aware configuration
- API gateway ready for ML models

### 🔧 **Zero Dependencies**
- No Docker required
- No system packages needed
- Runs from any directory
- Works in air-gapped environments

2. **Quick Deploy**
   ```bash
   cd L:/devops/artifactvirtual/core/cert-nginx
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Manual Setup**
   ```bash
   chmod +x init-letsencrypt.sh
   ./init-letsencrypt.sh
   docker-compose up -d
   ```

## Configuration

### Route Configuration
- `/`: Landing page (React/Vite)
- `/api/*`: Backend API services
- `/health`: System health monitoring
- Static assets: Optimized caching and delivery

### Load Balancing
- Round-robin distribution
- Health check integration
- Automatic failover

### SSL/TLS Management
- Automatic certificate provisioning and renewal
- Modern TLS protocols (1.2, 1.3)
- Perfect Forward Secrecy

### Security Features
- DDoS protection via rate limiting
- Security headers (HSTS, CSP, XSS protection)
- IP whitelisting/blacklisting
- Request filtering and validation

## Monitoring & Management

```bash
# View logs
docker-compose logs -f

# Check ingress status
docker-compose ps

# SSL certificate status
docker-compose exec certbot certbot certificates

# Reload Nginx configuration
docker-compose exec nginx nginx -s reload

# Test configuration
docker-compose exec nginx nginx -t
```

### Adding New Services
Edit `docker-compose.yml` and update `data/nginx/artifactvirtual.com.conf`:

```nginx
location /newservice/ {
        proxy_pass http://new-service:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Scaling Services
```bash
docker-compose up -d --scale landing-page=3
docker-compose up -d --scale backend-api=2
```

## Security Hardening

- Non-root containers
- Isolated Docker networks
- CPU and memory constraints
- Automated security patching
- Comprehensive request logging

## Troubleshooting

### Certificate Issues
1. Verify DNS: `nslookup artifactvirtual.com`
2. Check firewall: `netstat -tlnp | grep ':80\|:443'`
3. Review logs: `docker-compose logs certbot`

### Service Issues
1. Check status: `docker-compose ps`
2. Restart services: `docker-compose restart [service-name]`
3. Rebuild containers: `docker-compose build --no-cache`

### Performance Issues
1. Monitor resources: `docker stats`
2. Check Nginx metrics: `curl https://artifactvirtual.com/nginx_status`
3. Analyze logs: `docker-compose logs nginx | grep -E "error|warn"`

## Performance Optimization

- HTTP/2 for multiplexed connections
- Gzip compression for text content
- Static file caching with long-term headers
- Keep-alive connections
- Minified assets and optimized delivery

**ArtifactVirtual Team**  
*Production Infrastructure - June 2025*
