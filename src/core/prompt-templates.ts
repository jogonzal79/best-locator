// prompt-templates.ts
import { ElementInfo, PageContext } from './ai-engine.js';

export class PromptTemplates {
  getSelectorPrompt(element: ElementInfo, context: PageContext): string {
    const attrs = JSON.stringify(element.attributes);
    
    return `You are a function that returns ONLY a CSS selector.

Examples:
INPUT: tag=input attrs={"data-test":"username"} → <ANSWER>[data-test=\"username\"]</ANSWER>
INPUT: tag=div attrs={"class":"login_logo"} → <ANSWER>.login_logo</ANSWER>

Now generate:
INPUT: tag=${element.tagName} attrs=${attrs}
<ANSWER>`;
  }

  getAnalysisPrompt(element: ElementInfo, context: PageContext): string {
    return `Analyze ${element.tagName}. Return: good selector`;
  }

  getExplanationPrompt(selector: string, element: ElementInfo): string {
    return `Why is "${selector}" good for ${element.tagName}?`;
  }

  getPageAnalysisPrompt(context: PageContext): string {
    return `Analyze this webpage for test automation:

URL: ${context.url}
TITLE: ${context.title}

Detect page type (login, checkout, dashboard, etc.) and return JSON:
{
  "pageType": "login_page",
  "testingStrategy": "focus on form validation",
  "keyElements": ["username", "password", "submit"],
  "confidence": 0.9
}`;
  }
}

// ollama-client.ts
export interface OllamaClientConfig {
  model: string;
  // puedes agregar otras propiedades de configuración aquí si es necesario
}

export class OllamaClient {
  private config: OllamaClientConfig;

  constructor(config: OllamaClientConfig) {
    this.config = config;
  }

  private createRequestBody(prompt: string) {
    return {
      model: this.config.model,
      prompt: prompt,
      temperature: 0,
      stream: false,
      options: {
        num_predict: 32,
        stop: ["</ANSWER>"]
      }
    };
  }

  // ... método que envía la solicitud utilizando createRequestBody() ...
}

// ai-engine.ts
// import { ElementInfo } from './ai-engine.js';

interface AIEnhancedResult {
  selector: string;
  confidence: number;
  type: string;
  aiEnhanced: boolean;
}

export class AIEngine {
  // ... otras partes del archivo ...

  private getFallbackResult(element: ElementInfo): AIEnhancedResult {
    // implementación existente...
    return { selector: '', confidence: 0, type: 'fallback', aiEnhanced: false };
  }

  private parseSelectorResponse(response: any, element: ElementInfo): AIEnhancedResult {
    const responseText = response.response || '';
    
    // Extraer selector entre marcadores
    const match = responseText.match(/<ANSWER>\s*([^<\r\n]+)\s*$/);
    if (match) {
      const selector = match[1].trim();
      console.log('🎯 AI extracted selector:', selector);
      
      return {
        selector: selector,
        confidence: 95,
        type: 'ai-enhanced',
        aiEnhanced: true
      };
    }
    
    // Si falla, fallback
    return this.getFallbackResult(element);
  }

  // ... resto de métodos ...
}
