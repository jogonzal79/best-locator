import { IAIProvider } from '../iai-provider.js';
import { ElementInfo } from '../../../types/index.js';
import { PromptTemplates } from '../../prompt-templates.js';

interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  timeout: number;
}

export class OpenAIProvider implements IAIProvider {
  private config: OpenAIConfig;
  private templates: PromptTemplates;
  private apiUrl = "https://api.openai.com/v1/chat/completions";

  constructor(config: OpenAIConfig) {
    if (!config.apiKey) throw new Error("OpenAI API key is missing.");
    this.config = config;
    this.templates = new PromptTemplates();
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.makeApiCall(prompt);
    return response.choices?.[0]?.message?.content || '';
  }

  async explainSelector(selector: string, element: ElementInfo): Promise<string> {
    const prompt = this.templates.getExplanationPrompt(selector, element);
    return this.generateText(prompt);
  }

  async isAvailable(): Promise<boolean> {
    try {
        const responseText = await this.generateText("Respond with only the word OK");
        return responseText.includes('OK');
    } catch {
        return false;
    }
  }

  private async makeApiCall(userPrompt: string): Promise<any> {
    const systemPrompt = "You are an expert UI test engineer. Act as a pure function.";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.apiKey}` },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: this.config.temperature,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(`OpenAI API error: ${err.error.message}`);
      }
      return await res.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error('OpenAI request timed out.');
      throw error;
    }
  }
}