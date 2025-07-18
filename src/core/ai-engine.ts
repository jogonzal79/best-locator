import { OllamaClient } from './ollama-client.js';
import { PromptTemplates } from './prompt-templates.js';
import { AIConfig } from './ai-config.js';

export interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  attributes: { [key: string]: string };
}

export interface PageContext {
  url: string;
  title: string;
  pageType?: string;
  nearbyElements?: ElementInfo[];
  parentStructure?: string[];
  semanticRole?: string;
}

export interface AIAnalysis {
  explanation: string;
  alternatives: string[];
  pageContext: string;
  stabilityScore: number;
  suggestions: string[];
  confidence: number;
}

export interface AIEnhancedResult {
  selector: string;
  confidence: number;
  type: string;
  aiEnhanced: boolean;
  aiAnalysis?: AIAnalysis;
}

export class AIEngine {
  private client: OllamaClient;
  private templates: PromptTemplates;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = new OllamaClient(config.ai.ollama);
    this.templates = new PromptTemplates();
  }

  async analyzeElement(element: ElementInfo, context: PageContext): Promise<AIAnalysis> {
    if (!this.config.ai.enabled) {
      throw new Error('AI is disabled');
    }

    const prompt = this.templates.getAnalysisPrompt(element, context);
    
    try {
      const response = await this.client.generate(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      if (this.config.ai.fallback.onError === 'fail') {
        throw error;
      }
      return this.getDefaultAnalysis();
    }
  }

  async generateSelector(element: ElementInfo, context: PageContext): Promise<AIEnhancedResult> {
    if (!this.config.ai.enabled) {
      throw new Error('AI is disabled');
    }

    const prompt = this.templates.getSelectorPrompt(element, context);
    
    try {
      const response = await this.client.generate(prompt);
      return this.parseSelectorResponse(response, element);
    } catch (error) {
      if (this.config.ai.fallback.onError === 'fail') {
        throw error;
      }
      return this.getFallbackResult(element);
    }
  }

  async explainSelector(selector: string, element: ElementInfo): Promise<string> {
    const prompt = this.templates.getExplanationPrompt(selector, element);
    
    try {
      const response = await this.client.generate(prompt);
      return response.response || 'No explanation available';
    } catch (error) {
      return `Traditional selector based on ${this.detectSelectorType(selector)}`;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  private parseAnalysisResponse(response: any): AIAnalysis {
    try {
      const parsed = JSON.parse(response.response);
      return {
        explanation: parsed.explanation || 'AI analysis performed',
        alternatives: parsed.alternatives || [],
        pageContext: parsed.pageContext || 'General webpage',
        stabilityScore: parsed.stabilityScore || 0.8,
        suggestions: parsed.suggestions || [],
        confidence: parsed.confidence || 0.85
      };
    } catch {
      return this.getDefaultAnalysis();
    }
  }

  private parseSelectorResponse(response: any, element: ElementInfo): AIEnhancedResult {
    try {
      const parsed = JSON.parse(response.response);
      return {
        selector: parsed.selector || this.getFallbackSelector(element),
        confidence: parsed.confidence || 80,
        type: parsed.type || 'ai-generated',
        aiEnhanced: true,
        aiAnalysis: {
          explanation: parsed.explanation || 'AI-optimized selector',
          alternatives: parsed.alternatives || [],
          pageContext: parsed.pageContext || 'General element',
          stabilityScore: parsed.stabilityScore || 0.8,
          suggestions: parsed.suggestions || [],
          confidence: parsed.confidence || 0.8
        }
      };
    } catch {
      return this.getFallbackResult(element);
    }
  }

  private getDefaultAnalysis(): AIAnalysis {
    return {
      explanation: 'Using traditional selector logic',
      alternatives: [],
      pageContext: 'General webpage element',
      stabilityScore: 0.7,
      suggestions: [],
      confidence: 0.7
    };
  }

  private getFallbackResult(element: ElementInfo): AIEnhancedResult {
    return {
      selector: this.getFallbackSelector(element),
      confidence: 70,
      type: 'fallback',
      aiEnhanced: false
    };
  }

  private getFallbackSelector(element: ElementInfo): string {
    if (element.attributes['data-test']) return `[data-test="${element.attributes['data-test']}"]`;
    if (element.attributes['data-testid']) return `[data-testid="${element.attributes['data-testid']}"]`;
    if (element.id) return `#${element.id}`;
    return element.tagName;
  }

  private detectSelectorType(selector: string): string {
    if (selector.includes('data-test')) return 'test attribute';
    if (selector.includes('aria-label')) return 'accessibility attribute';
    if (selector.startsWith('#')) return 'ID selector';
    if (selector.startsWith('.')) return 'class selector';
    return 'CSS selector';
  }
}