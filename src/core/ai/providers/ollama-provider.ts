import { IAIProvider } from '../iai-provider.js';
import { ElementInfo } from '../../../types/index.js';
import { PromptTemplates } from '../../prompt-templates.js';

interface OllamaConfig {
  host: string;
  model: string;
  timeout: number;
  temperature: number;
}

export class OllamaProvider implements IAIProvider {
  private config: OllamaConfig;
  private templates: PromptTemplates;

  constructor(config: OllamaConfig) {
    this.config = config;
    this.templates = new PromptTemplates();
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.makeApiCall(prompt);
    return response.response || '';
  }

  async explainSelector(selector: string, element: ElementInfo): Promise<string> {
    const prompt = this.templates.getExplanationPrompt(selector, element);
    return this.generateText(prompt);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(this.config.host, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async makeApiCall(prompt: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    try {
      const res = await fetch(`${this.config.host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          stream: false,
          options: { temperature: this.config.temperature, num_predict: 150 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ollama API error: ${res.status} - ${errorText}`);
      }
      return await res.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error('Ollama request timed out.');
      throw error;
    }
  }
}