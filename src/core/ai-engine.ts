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
    if (!this.config.ai.enabled) throw new Error('AI is disabled');
    const prompt = this.templates.getAnalysisPrompt(element, context);
    try {
      const response = await this.client.generate(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      if (this.config.ai.fallback.onError === 'fail') throw error;
      return this.getDefaultAnalysis();
    }
  }

  async generateSelector(element: ElementInfo, context: PageContext): Promise<AIEnhancedResult> {
    if (!this.config.ai.enabled) throw new Error('AI is disabled');
    const prompt = this.templates.getSelectorPrompt(element, context);
    try {
      const response = await this.client.generate(prompt);
      return this.parseSelectorResponse(response, element);
    } catch (error) {
      if (this.config.ai.fallback.onError === 'fail') throw error;
      return this.getFallbackResult(element);
    }
  }

  async explainSelector(selector: string, element: ElementInfo): Promise<string> {
    const prompt = this.templates.getExplanationPrompt(selector, element);
    try {
      const response = await this.client.generate(prompt);
      return response.response || 'No explanation available';
    } catch {
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
      const responseText = response.response || '';
      console.log('🔥 [DEBUG] EXACT AI RESPONSE:', JSON.stringify(responseText));
      
      let selector = responseText.trim();

      // AGREGAR verificación:
      if (!selector) {
        console.log('🔥 [DEBUG] Empty response, using fallback');
        return this.getFallbackResult(element);
      }
      
      // ESTRATEGIA 1: Buscar entre marcadores <ANSWER>
      let match = responseText.match(/<ANSWER>\s*([^<\r\n]+)\s*$/);
      if (match) {
        selector = match[1].trim();
        console.log('🎯 [DEBUG] Found marked answer:', selector);
      }
      
      // ESTRATEGIA 2: Si AI devolvió elemento HTML, extraer selector
      else if (responseText.includes('<') && responseText.includes('>')) {
        console.log('🔄 [DEBUG] AI returned HTML element, extracting selector...');
        
        // Extraer class del HTML: <div class="login_logo">
        const classMatch = responseText.match(/class="([^"]+)"/);
        if (classMatch) {
          const className = classMatch[1].split(' ')[0]; // Primera clase
          selector = `.${className}`;
          console.log('🎯 [DEBUG] Extracted class selector:', selector);
        }
        // Extraer id del HTML: <div id="myid">
        else {
          const idMatch = responseText.match(/id="([^"]+)"/);
          if (idMatch) {
            selector = `#${idMatch[1]}`;
            console.log('🎯 [DEBUG] Extracted id selector:', selector);
          }
          // Extraer tag del HTML: <button>
          else {
            const tagMatch = responseText.match(/<(\w+)/);
            if (tagMatch) {
              selector = tagMatch[1];
              console.log('🎯 [DEBUG] Extracted tag selector:', selector);
            }
          }
        }
      }
      
      // ESTRATEGIA 3: Buscar selector CSS directo
      else {
        const selectorPatterns = [
          /\[data-test="([^"]+)"\]/,
          /\[data-testid="([^"]+)"\]/,
          /\.([a-zA-Z][\w-]+)/,
          /#([a-zA-Z][\w-]+)/
        ];
        
        for (const pattern of selectorPatterns) {
          const patternMatch = responseText.match(pattern);
          if (patternMatch) {
            selector = patternMatch[0];
            console.log('🎯 [DEBUG] Found CSS selector:', selector);
            break;
          }
        }
      }
      
      // Validar selector final
      if (selector && this.isValidSelector(selector)) {
        console.log('🎯 [DEBUG] ✅ AI selector is valid:', selector);
        
        return {
          selector: selector,
          confidence: 95,
          type: 'ai-enhanced',
          aiEnhanced: true,
          aiAnalysis: {
            explanation: 'AI-generated selector from element analysis',
            alternatives: [responseText.trim()],
            pageContext: 'Web element',
            stabilityScore: 0.95,
            suggestions: [],
            confidence: 0.95
          }
        };
      }
      
      console.log('🔄 [DEBUG] AI selector not valid, using fallback');
      return this.getFallbackResult(element);
    } catch (error) {
      console.log('🔥 [DEBUG] Error parsing AI response:', error);
      return this.getFallbackResult(element);
    }
  }

  private isValidSelector(selector: string): boolean {
    const cleanSelector = selector.trim();
    if (cleanSelector.length < 1 || cleanSelector.length > 300) return false;
    const hasValidStructure = (
      /^[a-zA-Z#\.\[]/.test(cleanSelector) &&
      !/[<>{}|\\^`]/.test(cleanSelector) &&
      (cleanSelector.match(/\[/g) || []).length === (cleanSelector.match(/\]/g) || []).length &&
      (cleanSelector.match(/"/g) || []).length % 2 === 0
    );
    const validPatterns = [
      /^[a-zA-Z][a-zA-Z0-9-_]*$/,
      /^#[a-zA-Z][a-zA-Z0-9-_]*$/,
      /^\.[a-zA-Z][a-zA-Z0-9-_]*$/,
      /^[a-zA-Z][a-zA-Z0-9-_]*\.[a-zA-Z][a-zA-Z0-9-_]*$/,
      /^[a-zA-Z][a-zA-Z0-9-_]*#[a-zA-Z][a-zA-Z0-9-_]*$/,
      /^\[[a-zA-Z-]+(="[^"]*")?\]$/,
      /^[a-zA-Z][a-zA-Z0-9-_]*\[[a-zA-Z-]+(="[^"]*")?\]$/
    ];
    const matchesPattern = validPatterns.some(p => p.test(cleanSelector));
    const isCommonSelector = (
      cleanSelector.includes('[data-test=') ||
      cleanSelector.includes('[data-testid=') ||
      cleanSelector.includes('[data-cy=') ||
      cleanSelector.startsWith('#') ||
      cleanSelector.startsWith('.') ||
      /^[a-zA-Z]/.test(cleanSelector)
    );
    const isValid = hasValidStructure && (matchesPattern || isCommonSelector);
    console.log('🔥 [DEBUG] Validating selector:', cleanSelector);
    console.log('🔥 [DEBUG] Structure valid:', hasValidStructure,
      '| Pattern match:', matchesPattern,
      '| Common:', isCommonSelector,
      '| Final:', isValid);
    return isValid;
  }

  private getFallbackResult(element: ElementInfo): AIEnhancedResult {
    console.log('🔄 Using improved traditional method as fallback');
    
    let selector = '';
    let confidence = 70;
    let type = 'traditional-fallback';

    if (element.attributes['data-test']) {
      selector = `[data-test="${element.attributes['data-test']}"]`;
      confidence = 95;
      type = 'data-test-fallback';
    } else if (element.attributes['data-testid']) {
      selector = `[data-testid="${element.attributes['data-testid']}"]`;
      confidence = 95;
      type = 'data-testid-fallback';
    } else if (element.id) {
      selector = `#${element.id}`;
      confidence = 80;
      type = 'id-fallback';
    } else if (element.className && element.className.trim()) {
      const classes = element.className
        .split(' ')
        .filter(c => c.trim())
        .filter(c => !c.includes('error') && !c.includes('active') && !c.includes('focus'))
        .filter(c => c.length > 2)
        .slice(0, 1);

      if (classes.length > 0) {
        const bestClass = classes[0];
        if (bestClass.length > 3 && !['btn', 'box', 'div', 'item'].includes(bestClass)) {
          selector = `.${bestClass}`;
          confidence = 60;
          type = 'css-class-fallback';
        } else {
          selector = `${element.tagName}.${bestClass}`;
          confidence = 40;
          type = 'tag-class-fallback';
        }
      } else {
        selector = element.tagName;
        confidence = 20;
        type = 'tag-only-fallback';
      }
    } else {
      selector = element.tagName;
      confidence = 20;
      type = 'tag-only-fallback';
    }

    return {
      selector,
      confidence,
      type,
      aiEnhanced: false
    };
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

  private detectSelectorType(selector: string): string {
    if (selector.includes('data-test')) return 'test attribute';
    if (selector.includes('aria-label')) return 'accessibility attribute';
    if (selector.startsWith('#')) return 'ID selector';
    if (selector.startsWith('.')) return 'class selector';
    return 'CSS selector';
  }
}
