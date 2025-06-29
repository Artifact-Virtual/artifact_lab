import { IStorage } from "../storage";

interface WindmillScript {
  id: string;
  name: string;
  description: string;
  language: 'python' | 'typescript' | 'bash';
  content: string;
  parameters: Record<string, any>;
  status: 'active' | 'inactive';
}

interface WindmillJob {
  id: string;
  scriptId: string;
  status: 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export class WindmillIntegration {
  private apiUrl: string;
  private apiToken: string;
  private scripts = new Map<string, WindmillScript>();
  private jobs = new Map<string, WindmillJob>();

  constructor(private storage: IStorage) {
    this.apiUrl = process.env.WINDMILL_API_URL || 'http://localhost:8000';
    this.apiToken = process.env.WINDMILL_API_TOKEN || '';
  }

  async initialize(): Promise<void> {
    if (!this.apiToken) {
      console.warn('Windmill API token not configured');
      return;
    }

    try {
      await this.syncScripts();
      console.log('Windmill integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Windmill integration:', error);
    }
  }

  private async syncScripts(): Promise<void> {
    // Mock implementation - would connect to actual Windmill API
    const mockScripts: WindmillScript[] = [
      {
        id: 'data_processor',
        name: 'Data Processing Pipeline',
        description: 'Processes incoming data and generates reports',
        language: 'python',
        content: `
import pandas as pd
import json

def main(data: dict):
    df = pd.DataFrame(data.get('records', []))
    
    # Process data
    summary = {
        'total_records': len(df),
        'columns': list(df.columns),
        'summary_stats': df.describe().to_dict() if len(df) > 0 else {}
    }
    
    return {
        'status': 'success',
        'summary': summary,
        'processed_at': pd.Timestamp.now().isoformat()
    }
`,
        parameters: {
          data: { type: 'object', description: 'Input data to process' }
        },
        status: 'active'
      },
      {
        id: 'ml_model_trainer',
        name: 'ML Model Training',
        description: 'Trains machine learning models on provided datasets',
        language: 'python',
        content: `
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle
import pandas as pd

def main(dataset: dict, target_column: str):
    df = pd.DataFrame(dataset)
    
    if target_column not in df.columns:
        return {'error': f'Target column {target_column} not found'}
    
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    return {
        'status': 'success',
        'accuracy': accuracy,
        'feature_importance': dict(zip(X.columns, model.feature_importances_)),
        'model_trained': True
    }
`,
        parameters: {
          dataset: { type: 'object', description: 'Training dataset' },
          target_column: { type: 'string', description: 'Target column name' }
        },
        status: 'active'
      },
      {
        id: 'web_scraper',
        name: 'Web Content Scraper',
        description: 'Scrapes and processes web content',
        language: 'python',
        content: `
import requests
from bs4 import BeautifulSoup
import json

def main(url: str, selectors: dict = None):
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        result = {
            'url': url,
            'title': soup.title.string if soup.title else '',
            'status': 'success'
        }
        
        if selectors:
            extracted_data = {}
            for key, selector in selectors.items():
                elements = soup.select(selector)
                extracted_data[key] = [elem.get_text().strip() for elem in elements]
            result['extracted_data'] = extracted_data
        
        return result
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'url': url
        }
`,
        parameters: {
          url: { type: 'string', description: 'URL to scrape' },
          selectors: { type: 'object', description: 'CSS selectors for data extraction' }
        },
        status: 'active'
      }
    ];

    mockScripts.forEach(script => {
      this.scripts.set(script.id, script);
    });
  }

  async executeScript(scriptId: string, parameters: Record<string, any>): Promise<WindmillJob> {
    const script = this.scripts.get(scriptId);
    if (!script) {
      throw new Error(`Script ${scriptId} not found`);
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: WindmillJob = {
      id: jobId,
      scriptId,
      status: 'running',
      startTime: new Date()
    };

    this.jobs.set(jobId, job);

    // Simulate script execution
    setTimeout(async () => {
      try {
        const result = await this.simulateScriptExecution(script, parameters);
        job.status = 'completed';
        job.result = result;
        job.endTime = new Date();

        // Create activity log
        await this.storage.createActivity({
          type: 'python_execution',
          title: `Windmill script "${script.name}" completed`,
          description: `Execution time: ${job.endTime.getTime() - job.startTime.getTime()}ms`,
          userId: 1
        });
      } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.endTime = new Date();
      }
    }, Math.random() * 2000 + 1000); // 1-3 seconds

    return job;
  }

  private async simulateScriptExecution(script: WindmillScript, parameters: Record<string, any>): Promise<any> {
    // Mock execution results based on script type
    switch (script.id) {
      case 'data_processor':
        return {
          status: 'success',
          summary: {
            total_records: parameters.data?.records?.length || 0,
            columns: Object.keys(parameters.data?.records?.[0] || {}),
            summary_stats: { mean: 42, std: 12.5 }
          },
          processed_at: new Date().toISOString()
        };

      case 'ml_model_trainer':
        return {
          status: 'success',
          accuracy: 0.85 + Math.random() * 0.1,
          feature_importance: {
            feature1: Math.random(),
            feature2: Math.random(),
            feature3: Math.random()
          },
          model_trained: true
        };

      case 'web_scraper':
        return {
          url: parameters.url,
          title: 'Sample Web Page',
          status: 'success',
          extracted_data: {
            headings: ['Main Title', 'Section 1', 'Section 2'],
            paragraphs: ['Sample content...', 'More content...']
          }
        };

      default:
        return {
          status: 'success',
          message: 'Script executed successfully',
          timestamp: new Date().toISOString()
        };
    }
  }

  getAvailableScripts(): WindmillScript[] {
    return Array.from(this.scripts.values());
  }

  getJob(jobId: string): WindmillJob | undefined {
    return this.jobs.get(jobId);
  }

  async createScript(script: Omit<WindmillScript, 'id'>): Promise<WindmillScript> {
    const id = `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newScript: WindmillScript = {
      ...script,
      id
    };

    this.scripts.set(id, newScript);

    await this.storage.createActivity({
      type: 'python_script',
      title: `Created Windmill script "${script.name}"`,
      description: `New ${script.language} script with ${Object.keys(script.parameters).length} parameters`,
      userId: 1
    });

    return newScript;
  }

  async updateScript(id: string, updates: Partial<WindmillScript>): Promise<WindmillScript> {
    const script = this.scripts.get(id);
    if (!script) {
      throw new Error(`Script ${id} not found`);
    }

    const updatedScript = { ...script, ...updates };
    this.scripts.set(id, updatedScript);

    await this.storage.createActivity({
      type: 'python_script',
      title: `Updated Windmill script "${updatedScript.name}"`,
      description: 'Script configuration updated',
      userId: 1
    });

    return updatedScript;
  }

  async deleteScript(id: string): Promise<void> {
    const script = this.scripts.get(id);
    if (!script) {
      throw new Error(`Script ${id} not found`);
    }

    this.scripts.delete(id);

    await this.storage.createActivity({
      type: 'python_script',
      title: `Deleted Windmill script "${script.name}"`,
      description: 'Script removed from system',
      userId: 1
    });
  }

  getConnectionStatus(): { connected: boolean; scriptsCount: number; activeJobs: number } {
    return {
      connected: this.apiToken !== '',
      scriptsCount: this.scripts.size,
      activeJobs: Array.from(this.jobs.values()).filter(job => job.status === 'running').length
    };
  }
}