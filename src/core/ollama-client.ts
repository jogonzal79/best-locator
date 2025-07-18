import fetch from 'node-fetch';

export interface OllamaConfig {
  host: string;
  model: string;
  timeout: number;
  temperature: number;
}

export interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
}

export class OllamaClient {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
  }

  async generate(prompt: string): Promise<OllamaResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
            prompt,
            temperature: this.config.temperature,
            stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      return await response.json() as OllamaResponse;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Ollama request timeout');
      }
      throw new Error(`Ollama connection failed: ${error.message}`);
    }
  }

  // 🔄 Método ping actualizado con AbortController y sin 'timeout' obsoleto
  async ping(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.config.host}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.host}/api/tags`);
      const data = await response.json() as { models: { name: string }[] };
      return data.models.map(m => m.name);
    } catch {
      return [];
    }
  }
}
