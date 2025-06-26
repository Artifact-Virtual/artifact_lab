# 🚀 ArtifactVirtual.com - Complete Deployment Guide

**Single guide for all deployment scenarios: Development, Production, Docker-free, and CI/CD.**

---

## 🎯 Choose Your Deployment

### 🚀 Quick Start (Recommended)
**Best for**: First-time users, development, testing
```bash
# Windows
start_ai_automation.bat

# Linux/macOS/PowerShell
python3 deploy_suite.py
```

### 🏭 Production Deployment
**Best for**: Live websites, production environments
- [Production Setup](#production-deployment-guide)
- Domain configuration, SSL certificates, performance tuning

### 🐳 Docker Deployment (Legacy)
**Best for**: Container environments, Kubernetes
- [Docker Setup](#docker-deployment-legacy)
- Container orchestration, Docker Compose

### 💻 Development Environment
**Best for**: Local development, testing, customization
- [Development Setup](#development-environment)
- Hot reloading, debugging, custom configurations

---

## ⚡ Quick Start Deployment

### Prerequisites
- **Python 3.8+** (required)
- **Node.js 18+** (for AI automation)
- **10MB free disk space**
- **Ports 8080, 8443, 8444** available

### Option 1: Automated (Windows)
```cmd
# Clone repository
git clone <your-repo>
cd core/cert-nginx

# Run interactive launcher
start_ai_automation.bat
# Select option 1 for full deployment

# Your infrastructure is now running at:
# Web: http://localhost:8080
# SSL: https://localhost:8443  
# AI Dashboard: automation_logs/dashboard.html
```

### Option 2: Automated (Linux/macOS)
```bash
# Clone and deploy
git clone <your-repo> && cd core/cert-nginx
python3 deploy_suite.py

# Or step-by-step
python3 setup.py                 # Install dependencies
python3 portable_server.py       # Start web server
python3 dashboard_launcher.py    # Start monitoring (new terminal)
node automation_scripts/orchestrator_fixed.js dashboard  # Start AI (new terminal)
```

### Option 3: PowerShell (Advanced)
```powershell
# With parameters
.\start_ai_automation.ps1 dashboard -Verbose

# Individual services
.\start_ai_automation.ps1 performance
.\start_ai_automation.ps1 security -Headless
```

### Verification
```bash
# Check all services
curl http://localhost:8080/health    # Web server
ps aux | grep python                 # Security monitoring
ps aux | grep node                   # AI automation

# Open dashboards
# Security: Check terminal output
# AI: Open automation_logs/dashboard.html in browser
```

---

## 🏭 Production Deployment Guide

### Phase 1: Server Preparation

**1. Server Requirements**
- **OS**: Ubuntu 20.04+, CentOS 8+, or Windows Server 2019+
- **RAM**: 2GB minimum, 4GB recommended
- **CPU**: 2 cores minimum, 4 cores recommended  
- **Storage**: 10GB minimum, 50GB recommended
- **Network**: Public IP, domains pointing to server

**2. Domain Setup**
```bash
# Update DNS records
# A record: artifactvirtual.com -> YOUR_SERVER_IP
# A record: www.artifactvirtual.com -> YOUR_SERVER_IP

# Verify DNS propagation
nslookup artifactvirtual.com
```

**3. Firewall Configuration**
```bash
# Ubuntu/Debian
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# CentOS/RHEL
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

### Phase 2: Application Deployment

**1. Install Dependencies**
```bash
# Install Python 3.8+
sudo apt update && sudo apt install python3 python3-pip -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Verify versions
python3 --version  # Should be 3.8+
node --version     # Should be 18+
```

**2. Deploy Application**
```bash
# Clone repository
git clone <your-repo>
cd core/cert-nginx

# Install Python dependencies
pip3 install -r monitor_requirements.txt

# Install Node.js dependencies
npm install

# Generate production SSL certificates
python3 setup.py --production --domain artifactvirtual.com

# Start production services
python3 deploy_suite.py --production
```

**3. Production Configuration**
```bash
# Edit production config
nano automation_config/config.json

# Update domains and SSL paths
{
  "targets": {
    "production": "https://artifactvirtual.com",
    "health": "https://artifactvirtual.com/health"
  },
  "ssl": {
    "cert_path": "/etc/ssl/certs/artifactvirtual.com.crt",
    "key_path": "/etc/ssl/private/artifactvirtual.com.key"
  }
}
```

### Phase 3: Process Management

**1. Systemd Services (Linux)**
```bash
# Create web server service
sudo tee /etc/systemd/system/artifactvirtual-web.service << EOF
[Unit]
Description=ArtifactVirtual Web Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/cert-nginx
ExecStart=/usr/bin/python3 portable_server.py --production
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create monitoring service
sudo tee /etc/systemd/system/artifactvirtual-monitor.service << EOF
[Unit]
Description=ArtifactVirtual Security Monitor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/cert-nginx
ExecStart=/usr/bin/python3 security_monitor.py --daemon
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
sudo systemctl enable artifactvirtual-web artifactvirtual-monitor
sudo systemctl start artifactvirtual-web artifactvirtual-monitor
```

**2. Windows Services**
```cmd
# Install as Windows service using NSSM
# Download NSSM from https://nssm.cc/

# Install web server service
nssm install ArtifactVirtualWeb "C:\Python39\python.exe" "C:\path\to\portable_server.py --production"
nssm set ArtifactVirtualWeb AppDirectory "C:\path\to\cert-nginx"
nssm start ArtifactVirtualWeb

# Install monitoring service
nssm install ArtifactVirtualMonitor "C:\Python39\python.exe" "C:\path\to\security_monitor.py --daemon"
nssm start ArtifactVirtualMonitor
```

### Phase 4: SSL Certificate Setup

**1. Let's Encrypt (Recommended)**
```bash
# Install certbot
sudo apt install certbot -y

# Generate certificates
sudo certbot certonly --standalone \
  -d artifactvirtual.com \
  -d www.artifactvirtual.com \
  --email admin@artifactvirtual.com \
  --agree-tos \
  --non-interactive

# Setup auto-renewal
sudo crontab -e
# Add line: 0 12 * * * /usr/bin/certbot renew --quiet
```

**2. Custom SSL Certificates**
```bash
# Copy your certificates
sudo cp your-domain.crt /etc/ssl/certs/artifactvirtual.com.crt
sudo cp your-domain.key /etc/ssl/private/artifactvirtual.com.key
sudo chmod 644 /etc/ssl/certs/artifactvirtual.com.crt
sudo chmod 600 /etc/ssl/private/artifactvirtual.com.key
```

### Phase 5: Performance Optimization

**1. Nginx Configuration**
```nginx
# Edit data/nginx/artifactvirtual.com.conf
server {
    listen 443 ssl http2;
    server_name artifactvirtual.com www.artifactvirtual.com;
    
    # Performance optimizations
    worker_processes auto;
    worker_connections 1024;
    keepalive_timeout 65;
    
    # Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Compression
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript;
}
```

**2. System Performance**
```bash
# Optimize kernel parameters
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 65535' >> /etc/sysctl.conf
sysctl -p

# Increase file descriptor limits
echo '* soft nofile 65535' >> /etc/security/limits.conf
echo '* hard nofile 65535' >> /etc/security/limits.conf
```

---

## 🐳 Docker Deployment (Legacy)

### Quick Docker Deploy
```bash
# Clone repository
git clone <your-repo> && cd core/cert-nginx

# Build and deploy with Docker Compose
docker-compose up -d

# Initialize SSL certificates
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh

# Verify deployment
docker-compose ps
curl https://artifactvirtual.com/health
```

### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data/nginx:/etc/nginx/conf.d
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    depends_on:
      - landing-page
      - backend-api

  landing-page:
    build: ../../frontend/landing_page/v2
    ports:
      - "5173:5173"
    environment:
      - NODE_ENV=production

  backend-api:
    build: ../../backend
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production

  certbot:
    image: certbot/certbot
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
```

### SSL Certificate Generation
```bash
# Initialize Let's Encrypt certificates
#!/bin/bash
domains=(artifactvirtual.com www.artifactvirtual.com)
data_path="./data/certbot"
email="admin@artifactvirtual.com"
staging=0

# Generate certificates
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $email \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d ${domains[0]} \
    -d ${domains[1]}" certbot
```

---

## 💻 Development Environment

### Local Development Setup
```bash
# Clone and setup
git clone <your-repo> && cd core/cert-nginx

# Install development dependencies
pip3 install -r monitor_requirements.txt
npm install

# Start development mode
python3 portable_server.py --debug --reload
```

### Development Configuration
```json
{
  "development": {
    "debug": true,
    "auto_reload": true,
    "log_level": "DEBUG",
    "ssl_verify": false
  },
  "targets": {
    "local": "http://localhost:8080",
    "health": "http://localhost:8080/health"
  }
}
```

### Hot Reloading
```bash
# Web server with auto-reload
python3 portable_server.py --reload

# Security monitoring with debug
python3 security_monitor.py --debug

# AI automation with development config
node automation_scripts/orchestrator_fixed.js dashboard --dev
```

### Custom Development
```python
# Add custom endpoints to portable_server.py
@app.route('/api/dev/test')
def dev_test():
    return {"status": "development", "timestamp": time.time()}

# Add custom monitoring to security_monitor.py
def custom_dev_metrics():
    return {"custom_metric": "development_value"}
```

---

## 🔧 Advanced Configuration

### Multi-Environment Setup
```bash
# Production environment
cp automation_config/config.json automation_config/config.prod.json

# Staging environment  
cp automation_config/config.json automation_config/config.staging.json

# Development environment
cp automation_config/config.json automation_config/config.dev.json

# Use specific config
python3 portable_server.py --config config.prod.json
```

### Load Balancing
```nginx
# nginx.conf for load balancing
upstream backend {
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

### Database Integration
```python
# Add database support to portable_server.py
import sqlite3

def init_db():
    conn = sqlite3.connect('app.db')
    conn.execute('''CREATE TABLE IF NOT EXISTS logs 
                   (id INTEGER PRIMARY KEY, timestamp TEXT, message TEXT)''')
    conn.close()
```

### Custom SSL Configuration
```python
# Use custom SSL certificates
SSL_CONFIG = {
    'cert_file': '/path/to/custom.crt',
    'key_file': '/path/to/custom.key',
    'ca_file': '/path/to/ca.crt',
    'protocols': ['TLSv1.2', 'TLSv1.3']
}
```

---

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy ArtifactVirtual
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd core/cert-nginx
        pip install -r monitor_requirements.txt
        npm install
        
    - name: Run tests
      run: |
        cd core/cert-nginx
        python3 -m pytest tests/
        npm test
        
    - name: Deploy to production
      run: |
        cd core/cert-nginx
        python3 deploy_suite.py --production
```

### GitLab CI
```yaml
# .gitlab-ci.yml
stages:
  - test
  - deploy

test:
  stage: test
  script:
    - cd core/cert-nginx
    - pip install -r monitor_requirements.txt
    - npm install
    - python3 -m pytest tests/
    - npm test

deploy:
  stage: deploy
  script:
    - cd core/cert-nginx
    - python3 deploy_suite.py --production
  only:
    - main
```

### Jenkins Pipeline
```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'cd core/cert-nginx && pip install -r monitor_requirements.txt'
                sh 'cd core/cert-nginx && npm install'
            }
        }
        
        stage('Test') {
            steps {
                sh 'cd core/cert-nginx && python3 -m pytest tests/'
                sh 'cd core/cert-nginx && npm test'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'cd core/cert-nginx && python3 deploy_suite.py --production'
            }
        }
    }
}
```

---

## 🔍 Monitoring & Maintenance

### Health Checks
```bash
# Automated health monitoring
#!/bin/bash
check_service() {
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Web server healthy"
    else
        echo "❌ Web server down"
        systemctl restart artifactvirtual-web
    fi
}

# Run every 5 minutes
*/5 * * * * /path/to/health_check.sh
```

### Log Management
```bash
# Setup log rotation
sudo tee /etc/logrotate.d/artifactvirtual << EOF
/path/to/cert-nginx/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    copytruncate
}
EOF
```

### Backup Strategy
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/artifactvirtual/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup configuration
cp -r /path/to/cert-nginx/automation_config $BACKUP_DIR/
cp -r /path/to/cert-nginx/certs $BACKUP_DIR/

# Backup logs and reports
cp -r /path/to/cert-nginx/automation_logs $BACKUP_DIR/

# Create archive
tar -czf "$BACKUP_DIR.tar.gz" $BACKUP_DIR
rm -rf $BACKUP_DIR
```

### Performance Monitoring
```bash
# System monitoring script
#!/bin/bash
echo "=== System Resources ==="
free -h
df -h
top -bn1 | head -20

echo "=== Application Status ==="
systemctl status artifactvirtual-web
systemctl status artifactvirtual-monitor

echo "=== Network Connections ==="
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

---

## 🆘 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find and kill process
sudo lsof -i :8080
sudo kill -9 PID

# Or change port
python3 portable_server.py --port 8081
```

**SSL Certificate Errors**
```bash
# Check certificate validity
openssl x509 -in certs/server.crt -text -noout

# Regenerate self-signed certificates
python3 setup.py --regenerate-ssl

# Check Let's Encrypt certificates
sudo certbot certificates
```

**Permission Denied**
```bash
# Fix file permissions
chmod +x *.py *.sh
sudo chown -R $USER:$USER .

# Fix SSL certificate permissions
sudo chmod 644 /etc/ssl/certs/artifactvirtual.com.crt
sudo chmod 600 /etc/ssl/private/artifactvirtual.com.key
```

**Service Won't Start**
```bash
# Check service logs
sudo journalctl -u artifactvirtual-web -f

# Check Python dependencies
pip3 install -r monitor_requirements.txt

# Check Node.js dependencies
npm install
```

**High Resource Usage**
```bash
# Monitor resource usage
htop
iotop
nethogs

# Optimize configuration
# Reduce monitoring frequency
# Adjust worker processes
# Enable caching
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=1
python3 portable_server.py --debug

# Verbose monitoring
python3 security_monitor.py --verbose

# AI automation debug
node automation_scripts/orchestrator_fixed.js dashboard --debug
```

---

## 📊 Success Verification

### Deployment Checklist
- [ ] Web server responds on HTTP (port 8080)
- [ ] Web server responds on HTTPS (port 8443)
- [ ] Health endpoint returns "healthy"
- [ ] Security monitoring dashboard running
- [ ] AI automation dashboard accessible
- [ ] SSL certificates valid and not expired
- [ ] All services configured as systemd/Windows services
- [ ] Firewall configured correctly
- [ ] DNS records pointing to server
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured

### Performance Benchmarks
```bash
# Load testing
ab -n 1000 -c 10 http://localhost:8080/

# SSL testing
nmap --script ssl-enum-ciphers -p 443 localhost

# Security testing
nmap -sS -O localhost
```

### Final Verification
```bash
# Test all endpoints
curl -I http://localhost:8080/health
curl -I https://localhost:8443/health
curl -I https://artifactvirtual.com/health

# Check service status
systemctl status artifactvirtual-web
systemctl status artifactvirtual-monitor

# Verify SSL
echo | openssl s_client -connect localhost:8443 -servername localhost
```

---

**🎉 Deployment Complete!** Your ArtifactVirtual.com infrastructure is now running and ready for production use.

---

*Last updated: June 2025 | Version: 2.0 | Deployment Guide*
