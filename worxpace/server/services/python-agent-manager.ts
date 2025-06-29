import { IStorage } from "../storage";
import { Agent } from "@shared/schema";

interface PythonAgent {
  id: string;
  name: string;
  description: string;
  code: string;
  dependencies: string[];
  environment: 'local' | 'containerized' | 'cloud';
  status: 'idle' | 'running' | 'error' | 'deploying';
  capabilities: string[];
  executionMode: 'sync' | 'async' | 'scheduled' | 'event-driven';
  schedule?: string;
  lastExecution?: Date;
  executionCount: number;
  averageExecutionTime: number;
}

interface PythonExecution {
  id: string;
  agentId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  inputs: any;
  outputs?: any;
  error?: string;
  logs: string[];
}

export class PythonAgentManager {
  private agents = new Map<string, PythonAgent>();
  private executions = new Map<string, PythonExecution>();
  private templates = new Map<string, any>();

  constructor(private storage: IStorage) {
    this.initializeTemplates();
    this.loadDefaultAgents();
  }

  private initializeTemplates(): void {
    this.templates.set('data_analysis', {
      name: 'Data Analysis Agent',
      description: 'Advanced data analysis with statistical modeling and visualization',
      code: `
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
import json

class DataAnalysisAgent:
    def __init__(self):
        self.capabilities = [
            "statistical_analysis",
            "data_visualization", 
            "predictive_modeling",
            "report_generation"
        ]
    
    def analyze_statistics(self, data):
        df = pd.DataFrame(data)
        return {
            'shape': df.shape,
            'describe': df.describe().to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'data_types': df.dtypes.to_dict()
        }
    
    def create_visualizations(self, data, target_column=None):
        df = pd.DataFrame(data)
        charts = []
        
        # Correlation heatmap
        if df.select_dtypes(include=[np.number]).shape[1] > 1:
            plt.figure(figsize=(10, 8))
            sns.heatmap(df.corr(), annot=True, cmap='coolwarm')
            plt.title('Correlation Matrix')
            charts.append('correlation_heatmap.png')
        
        # Distribution plots
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols[:5]:  # Limit to first 5 columns
            plt.figure(figsize=(8, 6))
            sns.histplot(df[col], kde=True)
            plt.title(f'Distribution of {col}')
            charts.append(f'distribution_{col}.png')
        
        return charts
    
    def train_predictive_model(self, data, target_column):
        df = pd.DataFrame(data)
        
        if target_column not in df.columns:
            return {'error': f'Target column {target_column} not found'}
        
        # Prepare features and target
        X = df.select_dtypes(include=[np.number]).drop(columns=[target_column])
        y = df[target_column]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        return {
            'accuracy': r2_score(y_test, y_pred),
            'mse': mean_squared_error(y_test, y_pred),
            'feature_importance': dict(zip(X.columns, model.feature_importances_)),
            'predictions': y_pred.tolist()[:10]  # First 10 predictions
        }
    
    def execute(self, inputs):
        task = inputs.get('task', 'full_analysis')
        data = inputs.get('data', [])
        target_column = inputs.get('target_column')
        
        results = {
            'timestamp': pd.Timestamp.now().isoformat(),
            'task': task
        }
        
        if task == 'statistics' or task == 'full_analysis':
            results['statistics'] = self.analyze_statistics(data)
        
        if task == 'visualizations' or task == 'full_analysis':
            results['visualizations'] = self.create_visualizations(data, target_column)
        
        if task == 'modeling' or task == 'full_analysis':
            if target_column:
                results['model'] = self.train_predictive_model(data, target_column)
        
        return results

# Main execution function
def main(inputs):
    agent = DataAnalysisAgent()
    return agent.execute(inputs)
`,
      dependencies: ['pandas', 'numpy', 'matplotlib', 'seaborn', 'scikit-learn'],
      capabilities: ['statistical_analysis', 'data_visualization', 'predictive_modeling']
    });

    this.templates.set('web_scraper', {
      name: 'Web Scraping Agent',
      description: 'Intelligent web scraping with content extraction and processing',
      code: `
import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin, urlparse
import re

class WebScrapingAgent:
    def __init__(self):
        self.capabilities = [
            "web_scraping",
            "content_extraction",
            "data_cleaning",
            "link_discovery"
        ]
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def scrape_page(self, url, selectors=None):
        try:
            response = self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            result = {
                'url': url,
                'title': soup.title.string.strip() if soup.title else '',
                'status': 'success',
                'content_length': len(response.content)
            }
            
            if selectors:
                extracted_data = {}
                for key, selector in selectors.items():
                    elements = soup.select(selector)
                    extracted_data[key] = [elem.get_text().strip() for elem in elements]
                result['extracted_data'] = extracted_data
            else:
                # Default extraction
                result['headings'] = [h.get_text().strip() for h in soup.find_all(['h1', 'h2', 'h3'])]
                result['paragraphs'] = [p.get_text().strip() for p in soup.find_all('p')][:10]
                result['links'] = [urljoin(url, a.get('href')) for a in soup.find_all('a', href=True)][:20]
            
            return result
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'url': url
            }
    
    def scrape_multiple(self, urls, delay=1):
        results = []
        for url in urls:
            result = self.scrape_page(url)
            results.append(result)
            time.sleep(delay)  # Be respectful to servers
        return results
    
    def extract_emails(self, text):
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        return re.findall(email_pattern, text)
    
    def extract_phone_numbers(self, text):
        phone_pattern = r'(\+?1-?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'
        return re.findall(phone_pattern, text)
    
    def execute(self, inputs):
        task = inputs.get('task', 'scrape_single')
        
        if task == 'scrape_single':
            url = inputs.get('url')
            selectors = inputs.get('selectors')
            return self.scrape_page(url, selectors)
        
        elif task == 'scrape_multiple':
            urls = inputs.get('urls', [])
            delay = inputs.get('delay', 1)
            return self.scrape_multiple(urls, delay)
        
        elif task == 'extract_contacts':
            url = inputs.get('url')
            page_data = self.scrape_page(url)
            if page_data['status'] == 'success':
                text = ' '.join(page_data.get('paragraphs', []))
                page_data['emails'] = self.extract_emails(text)
                page_data['phone_numbers'] = self.extract_phone_numbers(text)
            return page_data
        
        return {'error': 'Unknown task'}

def main(inputs):
    agent = WebScrapingAgent()
    return agent.execute(inputs)
`,
      dependencies: ['requests', 'beautifulsoup4', 'lxml'],
      capabilities: ['web_scraping', 'content_extraction', 'data_cleaning']
    });

    this.templates.set('api_integration', {
      name: 'API Integration Agent',
      description: 'Handles external API integrations and data synchronization',
      code: `
import requests
import json
import time
from datetime import datetime, timedelta

class APIIntegrationAgent:
    def __init__(self):
        self.capabilities = [
            "api_calls",
            "data_transformation",
            "authentication",
            "rate_limiting"
        ]
        self.session = requests.Session()
    
    def make_api_call(self, method, url, headers=None, params=None, data=None):
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=data
            )
            response.raise_for_status()
            
            return {
                'status': 'success',
                'status_code': response.status_code,
                'data': response.json() if response.content else None,
                'headers': dict(response.headers)
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'url': url
            }
    
    def batch_api_calls(self, requests_list, rate_limit=1):
        results = []
        for req in requests_list:
            result = self.make_api_call(**req)
            results.append(result)
            time.sleep(rate_limit)
        return results
    
    def transform_data(self, data, mapping):
        if isinstance(data, list):
            return [self.transform_single_item(item, mapping) for item in data]
        else:
            return self.transform_single_item(data, mapping)
    
    def transform_single_item(self, item, mapping):
        transformed = {}
        for new_key, old_key in mapping.items():
            if isinstance(old_key, str):
                transformed[new_key] = item.get(old_key)
            elif callable(old_key):
                transformed[new_key] = old_key(item)
        return transformed
    
    def execute(self, inputs):
        task = inputs.get('task', 'single_call')
        
        if task == 'single_call':
            return self.make_api_call(
                method=inputs.get('method', 'GET'),
                url=inputs.get('url'),
                headers=inputs.get('headers'),
                params=inputs.get('params'),
                data=inputs.get('data')
            )
        
        elif task == 'batch_calls':
            requests_list = inputs.get('requests', [])
            rate_limit = inputs.get('rate_limit', 1)
            return self.batch_api_calls(requests_list, rate_limit)
        
        elif task == 'transform_data':
            data = inputs.get('data')
            mapping = inputs.get('mapping', {})
            return self.transform_data(data, mapping)
        
        return {'error': 'Unknown task'}

def main(inputs):
    agent = APIIntegrationAgent()
    return agent.execute(inputs)
`,
      dependencies: ['requests'],
      capabilities: ['api_calls', 'data_transformation', 'authentication']
    });
  }

  private loadDefaultAgents(): void {
    // Load default agents from templates
    this.templates.forEach((template, key) => {
      const agent: PythonAgent = {
        id: `agent_${key}_${Date.now()}`,
        name: template.name,
        description: template.description,
        code: template.code,
        dependencies: template.dependencies,
        environment: 'local',
        status: 'idle',
        capabilities: template.capabilities,
        executionMode: 'sync',
        executionCount: 0,
        averageExecutionTime: 0
      };
      this.agents.set(agent.id, agent);
    });
  }

  async createPythonAgent(agentData: {
    name: string;
    description: string;
    code: string;
    dependencies?: string[];
    capabilities?: string[];
    executionMode?: 'sync' | 'async' | 'scheduled' | 'event-driven';
    schedule?: string;
  }): Promise<PythonAgent> {
    const id = `python_agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const agent: PythonAgent = {
      id,
      name: agentData.name,
      description: agentData.description,
      code: agentData.code,
      dependencies: agentData.dependencies || [],
      environment: 'local',
      status: 'idle',
      capabilities: agentData.capabilities || [],
      executionMode: agentData.executionMode || 'sync',
      schedule: agentData.schedule,
      executionCount: 0,
      averageExecutionTime: 0
    };

    this.agents.set(id, agent);

    await this.storage.createActivity({
      type: 'python_agent',
      title: `Created Python agent "${agent.name}"`,
      description: `New ${agent.executionMode} agent with ${agent.capabilities.length} capabilities`,
      userId: 1
    });

    return agent;
  }

  async deployAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.status = 'deploying';

    // Simulate deployment process
    setTimeout(async () => {
      agent.status = 'idle';
      
      await this.storage.createActivity({
        type: 'python_deployment',
        title: `Deployed Python agent "${agent.name}"`,
        description: `Agent deployed in ${agent.environment} environment`,
        userId: 1
      });
    }, 2000);
  }

  async executeAgent(agentId: string, inputs: any): Promise<PythonExecution> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: PythonExecution = {
      id: executionId,
      agentId,
      status: 'running',
      startTime: new Date(),
      inputs,
      logs: [`Starting execution of ${agent.name}`]
    };

    this.executions.set(executionId, execution);
    agent.status = 'running';

    // Simulate execution
    setTimeout(async () => {
      try {
        const result = await this.simulateExecution(agent, inputs);
        execution.status = 'completed';
        execution.outputs = result;
        execution.endTime = new Date();
        execution.logs.push('Execution completed successfully');

        // Update agent statistics
        const executionTime = execution.endTime.getTime() - execution.startTime.getTime();
        agent.executionCount++;
        agent.averageExecutionTime = 
          (agent.averageExecutionTime * (agent.executionCount - 1) + executionTime) / agent.executionCount;
        agent.status = 'idle';
        agent.lastExecution = execution.endTime;

        await this.storage.createActivity({
          type: 'python_execution',
          title: `Python agent "${agent.name}" completed execution`,
          description: `Execution time: ${executionTime}ms`,
          userId: 1
        });
      } catch (error) {
        execution.status = 'failed';
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        execution.endTime = new Date();
        execution.logs.push(`Execution failed: ${execution.error}`);
        agent.status = 'error';
      }
    }, Math.random() * 3000 + 1000); // 1-4 seconds

    return execution;
  }

  private async simulateExecution(agent: PythonAgent, inputs: any): Promise<any> {
    // Mock execution based on agent capabilities
    const result: any = {
      status: 'success',
      timestamp: new Date().toISOString(),
      agent_id: agent.id,
      execution_mode: agent.executionMode
    };

    if (agent.capabilities.includes('statistical_analysis')) {
      result.statistics = {
        mean: 42.5,
        std: 12.3,
        count: inputs.data?.length || 100
      };
    }

    if (agent.capabilities.includes('data_visualization')) {
      result.visualizations = [
        'histogram.png',
        'correlation_matrix.png',
        'time_series.png'
      ];
    }

    if (agent.capabilities.includes('predictive_modeling')) {
      result.model_performance = {
        accuracy: 0.85 + Math.random() * 0.1,
        precision: 0.82 + Math.random() * 0.1,
        recall: 0.88 + Math.random() * 0.1
      };
    }

    if (agent.capabilities.includes('web_scraping')) {
      result.scraped_data = {
        urls_processed: inputs.urls?.length || 1,
        pages_scraped: Math.floor(Math.random() * 10) + 1,
        data_points: Math.floor(Math.random() * 100) + 50
      };
    }

    if (agent.capabilities.includes('api_calls')) {
      result.api_responses = {
        successful_calls: Math.floor(Math.random() * 5) + 1,
        failed_calls: 0,
        total_data_points: Math.floor(Math.random() * 50) + 20
      };
    }

    return result;
  }

  getAvailableAgents(): PythonAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentTemplates(): Array<{ id: string; name: string; description: string; capabilities: string[] }> {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      capabilities: template.capabilities
    }));
  }

  getExecution(executionId: string): PythonExecution | undefined {
    return this.executions.get(executionId);
  }

  getAgentExecutions(agentId: string): PythonExecution[] {
    return Array.from(this.executions.values()).filter(exec => exec.agentId === agentId);
  }

  async updateAgent(agentId: string, updates: Partial<PythonAgent>): Promise<PythonAgent> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    Object.assign(agent, updates);

    await this.storage.createActivity({
      type: 'python_agent',
      title: `Updated Python agent "${agent.name}"`,
      description: 'Agent configuration updated',
      userId: 1
    });

    return agent;
  }

  async deleteAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.agents.delete(agentId);

    await this.storage.createActivity({
      type: 'python_agent',
      title: `Deleted Python agent "${agent.name}"`,
      description: 'Agent removed from system',
      userId: 1
    });
  }

  getSystemStatus(): {
    totalAgents: number;
    runningAgents: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  } {
    const agents = Array.from(this.agents.values());
    const executions = Array.from(this.executions.values());

    return {
      totalAgents: agents.length,
      runningAgents: agents.filter(a => a.status === 'running').length,
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length
    };
  }
}