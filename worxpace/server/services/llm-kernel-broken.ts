import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import fs from "fs";
import path from "path";

interface LLMConfig {
  defaultProvider: string;
  providers: {
    openai: {
      apiKey: string;
      model: string;
      enabled: boolean;
    };
    gemini: {
      apiKey: string;
      model: string;
      enabled: boolean;
    };
    ollama: {
      endpoint: string;
      model: string;
      enabled: boolean;
    };
    llmstudio: {
      endpoint: string;
      model: string;
      enabled: boolean;
    };
  };
  fallbackOrder: string[];
}

export class LLMKernel {
  private config: LLMConfig;
  private openai?: OpenAI;
  private gemini?: GoogleGenerativeAI;

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadConfig();
    this.initializeProviders();
  }

  private loadConfig() {
    const configPath = path.join(process.cwd(), 'server/config/llm-config.json');
    
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configData);
      
      // Inject environment variables for API keys
      if (process.env.OPENAI_API_KEY) {
        this.config.providers.openai.apiKey = process.env.OPENAI_API_KEY;
        this.config.providers.openai.enabled = true;
      }
      if (process.env.GEMINI_API_KEY) {
        this.config.providers.gemini.apiKey = process.env.GEMINI_API_KEY;
        this.config.providers.gemini.enabled = true;
      }
    } catch (error) {
      console.log('Loading default LLM configuration...');
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): LLMConfig {
    return {
      defaultProvider: "openai",
      providers: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          enabled: !!process.env.OPENAI_API_KEY
        },
        gemini: {
          apiKey: process.env.GEMINI_API_KEY || "",
          model: "gemini-2.5-flash",
          enabled: !!process.env.GEMINI_API_KEY
        },
        ollama: {
          endpoint: process.env.OLLAMA_ENDPOINT || "http://localhost:11434",
          model: process.env.OLLAMA_MODEL || "llama3.2",
          enabled: false
        },
        llmstudio: {
          endpoint: process.env.LLM_STUDIO_ENDPOINT || "http://localhost:1234",
          model: process.env.LLM_STUDIO_MODEL || "local-model",
          enabled: false
        }
      },
      fallbackOrder: ["openai", "gemini", "ollama", "llmstudio"]
    };
  }

  private initializeProviders() {
    if (this.config.providers.openai.enabled) {
      this.openai = new OpenAI({ 
        apiKey: this.config.providers.openai.apiKey 
      });
    }

    if (this.config.providers.gemini.enabled) {
      this.gemini = new GoogleGenerativeAI(
        this.config.providers.gemini.apiKey
      );
    }
  }

  async generateResponse(
    messages: Array<{ role: string; content: string }>, 
    options: {
      provider?: string;
      temperature?: number;
      maxTokens?: number;
      functions?: any[];
    } = {}
  ): Promise<{ content: string; functionCalls?: any[] }> {
    const provider = options.provider || this.config.defaultProvider;
    
    try {
      switch (provider) {
        case "openai":
          return await this.generateOpenAIResponse(messages, options);
        case "gemini":
          return await this.generateGeminiResponse(messages, options);
        case "ollama":
          return await this.generateOllamaResponse(messages, options);
        case "llmstudio":
          return await this.generateLLMStudioResponse(messages, options);
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error with provider ${provider}:`, error);
      
      // Try fallback providers
      for (const fallbackProvider of this.config.fallbackOrder) {
        if (fallbackProvider !== provider && this.config.providers[fallbackProvider as keyof typeof this.config.providers].enabled) {
          try {
            return await this.generateResponse(messages, { ...options, provider: fallbackProvider });
          } catch (fallbackError) {
            console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
          }
        }
      }
      
      throw new Error('All LLM providers failed');
    }
  }

  private async generateOpenAIResponse(
    messages: Array<{ role: string; content: string }>,
    options: any
  ): Promise<{ content: string; functionCalls?: any[] }> {
    if (!this.openai) throw new Error('OpenAI not initialized');

    const response = await this.openai.chat.completions.create({
      model: this.config.providers.openai.model,
      messages: messages as any,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2048,
      functions: options.functions,
      function_call: options.functions ? "auto" : undefined,
    });

    const message = response.choices[0].message;
    
    return {
      content: message.content || '',
      functionCalls: message.function_call ? [message.function_call] : []
    };
  }

  private async generateGeminiResponse(
    messages: Array<{ role: string; content: string }>,
    options: any
  ): Promise<{ content: string; functionCalls?: any[] }> {
    if (!this.gemini) throw new Error('Gemini not initialized');

    const model = this.gemini.getGenerativeModel({ 
      model: this.config.providers.gemini.model 
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;

    return {
      content: response.text(),
      functionCalls: []
    };
  }

  private async generateOllamaResponse(
    messages: Array<{ role: string; content: string }>,
    options: any
  ): Promise<{ content: string; functionCalls?: any[] }> {
    const response = await fetch(`${this.config.providers.ollama.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.providers.ollama.model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.message.content,
      functionCalls: []
    };
  }

  private async generateLLMStudioResponse(
    messages: Array<{ role: string; content: string }>,
    options: any
  ): Promise<{ content: string; functionCalls?: any[] }> {
    const response = await fetch(`${this.config.providers.llmstudio.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.providers.llmstudio.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048
      })
    });

    if (!response.ok) {
      throw new Error(`LLM Studio API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      functionCalls: []
    };
  }

  updateConfig(newConfig: Partial<LLMConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    const configPath = path.join(process.cwd(), 'server/config/llm-config.json');
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    
    this.initializeProviders();
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }
}
