/**
 * Service abstraction layer for external services (Ollama, Webchat, etc.)
 * This provides a unified interface that can be easily swapped or extended
 */

const { SERVICES } = require('./config.js');

class ServiceManager {
  constructor() {
    this.services = new Map();
    this.healthCheckInterval = null;
    this.listeners = new Map();
  }

  /**
   * Register a service with the manager
   */
  registerService(name, serviceInstance) {
    this.services.set(name, serviceInstance);
    console.log(`Service registered: ${name}`);
  }

  /**
   * Get a service instance
   */
  getService(name) {
    return this.services.get(name);
  }

  /**
   * Check health of all services
   */
  async checkAllServices() {
    const results = {};
    
    for (const [name, service] of this.services) {
      try {
        const isHealthy = await service.checkHealth();
        results[name] = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: Date.now()
        };
      } catch (error) {
        results[name] = {
          status: 'error',
          error: error.message,
          timestamp: Date.now()
        };
      }
    }
    
    return results;
  }

  /**
   * Start periodic health checks
   */
  startHealthMonitoring(intervalMs = 30000) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      const results = await this.checkAllServices();
      this.notifyListeners('health-check', results);
    }, intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

/**
 * Base class for all services
 */
class BaseService {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.isHealthy = false;
    this.lastHealthCheck = null;
  }

  /**
   * Check if the service is healthy
   */
  async checkHealth() {
    throw new Error('checkHealth must be implemented by subclasses');
  }

  /**
   * Get service status information
   */
  getStatus() {
    return {
      name: this.name,
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      config: this.config
    };
  }
}

/**
 * Ollama service implementation
 */
class OllamaService extends BaseService {
  constructor() {
    super('ollama', SERVICES.OLLAMA);
  }

  async checkHealth() {
    try {
      const http = require('http');
      
      return new Promise((resolve) => {
        const req = http.get({
          hostname: this.config.HOST,
          port: this.config.PORT,
          path: this.config.HEALTH_ENDPOINT,
          family: 4 // Force IPv4
        }, (res) => {
          const isHealthy = res.statusCode === 200;
          this.isHealthy = isHealthy;
          this.lastHealthCheck = Date.now();
          resolve(isHealthy);
        });
        
        req.on('error', () => {
          this.isHealthy = false;
          this.lastHealthCheck = Date.now();
          resolve(false);
        });
        
        req.setTimeout(this.config.TIMEOUT, () => {
          req.abort();
          this.isHealthy = false;
          this.lastHealthCheck = Date.now();
          resolve(false);
        });
      });
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  /**
   * Make a request to Ollama API
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.isHealthy) {
      throw new Error('Ollama service is not healthy');
    }

    const http = require('http');
    const postData = options.body ? JSON.stringify(options.body) : null;
    
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: this.config.HOST,
        port: this.config.PORT,
        path: endpoint,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        family: 4
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = data ? JSON.parse(data) : {};
            resolve(result);
          } catch (error) {
            resolve(data);
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(this.config.TIMEOUT, () => {
        req.abort();
        reject(new Error('Request timeout'));
      });
      
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }
}

/**
 * Webchat service implementation
 */
class WebchatService extends BaseService {
  constructor() {
    super('webchat', SERVICES.WEBCHAT);
  }

  async checkHealth() {
    try {
      const http = require('http');
      
      return new Promise((resolve) => {
        const req = http.get({
          hostname: this.config.HOST,
          port: this.config.PORT,
          path: this.config.HEALTH_ENDPOINT,
          family: 4 // Force IPv4
        }, (res) => {
          const isHealthy = res.statusCode === 200;
          this.isHealthy = isHealthy;
          this.lastHealthCheck = Date.now();
          resolve(isHealthy);
        });
        
        req.on('error', () => {
          this.isHealthy = false;
          this.lastHealthCheck = Date.now();
          resolve(false);
        });
        
        req.setTimeout(this.config.TIMEOUT, () => {
          req.abort();
          this.isHealthy = false;
          this.lastHealthCheck = Date.now();
          resolve(false);
        });
      });
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  /**
   * Get the webchat URL for iframe embedding
   */
  getEmbedUrl() {
    if (!this.isHealthy) {
      return null;
    }
    return this.config.BASE_URL;
  }
}

// Create and export the global service manager instance
const serviceManager = new ServiceManager();

// Register default services
serviceManager.registerService('ollama', new OllamaService());
serviceManager.registerService('webchat', new WebchatService());

module.exports = {
  ServiceManager,
  BaseService,
  OllamaService,
  WebchatService,
  serviceManager
};
