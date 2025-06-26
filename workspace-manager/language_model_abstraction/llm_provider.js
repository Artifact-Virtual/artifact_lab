// Advanced LLM Abstraction Layer
// Universal provider system supporting local and hosted models

import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LLMProvider {
    constructor(config) {
        this.config = config;
        this.providers = {
            ollama: new OllamaProvider(config),
            openai: new OpenAIProvider(config),
            claude: new ClaudeProvider(config),
            gemini: new GeminiProvider(config),
            llmstudio: new LLMStudioProvider(config)
        };
    }

    async query(prompt, options = {}) {
        const provider = this.providers[this.config.model_provider];
        if (!provider) {
            throw new Error(`Unknown provider: ${this.config.model_provider}`);
        }
        
        try {
            const response = await provider.query(prompt, options);
            this.logQuery(prompt, response, this.config.model_provider);
            return response;
        } catch (error) {
            console.error(`LLM Query Error (${this.config.model_provider}):`, error);
            throw error;
        }
    }

    async switchProvider(providerName, modelConfig = {}) {
        if (!this.providers[providerName]) {
            throw new Error(`Provider ${providerName} not supported`);
        }
        
        this.config.model_provider = providerName;
        Object.assign(this.config, modelConfig);
        
        // Save updated config
        await this.saveConfig();
        console.log(`Switched to provider: ${providerName}`);
    }

    async saveConfig() {
        const configPath = path.join(__dirname, 'config.json');
        await fs.writeJson(configPath, this.config, { spaces: 2 });
    }

    logQuery(prompt, response, provider) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            provider,
            prompt: prompt.substring(0, 100) + '...',
            response: response.substring(0, 100) + '...',
            tokens: response.length
        };
        
        // Log to file for audit trail
        this.appendLog(logEntry);
    }

    async appendLog(logEntry) {
        const logPath = path.join(__dirname, 'query_log.jsonl');
        const logLine = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(logPath, logLine);
    }
}

class OllamaProvider {
    constructor(config) {
        this.config = config;
        this.endpoint = config.ollama_endpoint || 'http://localhost:11434/api/generate';
        this.model = config.ollama_model || 'codellama:7b';
    }

    async query(prompt, options = {}) {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    ...options
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    }
}

class OpenAIProvider {
    constructor(config) {
        this.config = config;
        this.apiKey = config.openai_api_key || process.env.OPENAI_API_KEY;
        this.model = config.openai_model || 'gpt-4';
        this.endpoint = 'https://api.openai.com/v1/chat/completions';
    }

    async query(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 2000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

class ClaudeProvider {
    constructor(config) {
        this.config = config;
        this.apiKey = config.claude_api_key || process.env.CLAUDE_API_KEY;
        this.model = config.claude_model || 'claude-3-sonnet-20240229';
        this.endpoint = 'https://api.anthropic.com/v1/messages';
    }

    async query(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('Claude API key not configured');
        }

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: options.max_tokens || 2000,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }
}

class GeminiProvider {
    constructor(config) {
        this.config = config;
        this.apiKey = config.gemini_api_key || process.env.GEMINI_API_KEY;
        this.model = config.gemini_model || 'gemini-pro';
    }

    async query(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.max_tokens || 2000
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
}

class LLMStudioProvider {
    constructor(config) {
        this.config = config;
        this.endpoint = config.llmstudio_endpoint || 'http://localhost:1234/v1/chat/completions';
        this.model = config.llmstudio_model || 'local-model';
    }

    async query(prompt, options = {}) {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 2000
            })
        });

        if (!response.ok) {
            throw new Error(`LLM Studio API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

export { LLMProvider };
