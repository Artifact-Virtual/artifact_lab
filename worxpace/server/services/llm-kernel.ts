import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    this.initializeProviders();
  }

  private getDefaultConfig(): LLMConfig {
    return {
      defaultProvider: "offline",
      providers: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY || "",
          model: "gpt-4o",
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
      fallbackOrder: ["openai", "gemini"]
    };
  }

  private initializeProviders() {
    if (this.config.providers.openai.enabled && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    if (this.config.providers.gemini.enabled && process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    options: { temperature?: number; maxTokens?: number; functions?: any[] } = {}
  ): Promise<string> {
    // Return helpful offline response when no API keys are configured
    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      const userMessage = messages[messages.length - 1]?.content || "";
      
      if (userMessage.toLowerCase().includes("deploy") || userMessage.toLowerCase().includes("agent")) {
        return "I can help you deploy agents manually. Use the AI Agents page to create and configure new agents with specific workflows and capabilities.";
      }
      
      if (userMessage.toLowerCase().includes("workflow") || userMessage.toLowerCase().includes("automation")) {
        return "Visit the Automation Hub to create and manage workflows. You can set up triggers, schedules, and connect different services without AI assistance.";
      }
      
      if (userMessage.toLowerCase().includes("knowledge") || userMessage.toLowerCase().includes("data")) {
        return "Use the Knowledge Base to add and manage your data sources. You can upload documents, connect databases, and organize information manually.";
      }
      
      return "I'm ARTIFACT VIRTUAL's assistant. To enable full AI capabilities, configure your OpenAI or Gemini API keys in Settings. I can guide you through the platform's features manually.";
    }

    // Try available providers
    for (const provider of this.config.fallbackOrder) {
      try {
        switch (provider) {
          case 'openai':
            if (this.openai) {
              return await this.generateOpenAIResponse(messages, options);
            }
            break;
          case 'gemini':
            if (this.gemini) {
              return await this.generateGeminiResponse(messages, options);
            }
            break;
        }
      } catch (error) {
        console.error(`Provider ${provider} failed:`, error);
        continue;
      }
    }
    
    return "AI services are temporarily unavailable. Please check your API configuration in Settings.";
  }

  private async generateOpenAIResponse(
    messages: Array<{ role: string; content: string }>,
    options: { temperature?: number; maxTokens?: number; functions?: any[] } = {}
  ): Promise<string> {
    if (!this.openai) throw new Error("OpenAI not initialized");

    const response = await this.openai.chat.completions.create({
      model: this.config.providers.openai.model,
      messages: messages as any,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 500,
      functions: options.functions
    });

    return response.choices[0]?.message?.content || "No response generated";
  }

  private async generateGeminiResponse(
    messages: Array<{ role: string; content: string }>,
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string> {
    if (!this.gemini) throw new Error("Gemini not initialized");

    const model = this.gemini.getGenerativeModel({ 
      model: this.config.providers.gemini.model 
    });

    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const result = await model.generateContent(prompt);
    
    return result.response.text() || "No response generated";
  }

  updateConfig(newConfig: Partial<LLMConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.initializeProviders();
  }

  getConfig(): LLMConfig {
    return this.config;
  }
}