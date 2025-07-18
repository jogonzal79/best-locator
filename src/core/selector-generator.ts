// src/core/selector-generator.ts
import { AIEngine, PageContext } from './ai-engine.js';

interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  attributes: { [key: string]: string };
}

interface SelectorResult {
  selector: string;
  confidence: number;
  type: string;
  aiEnhanced?: boolean;
  aiAnalysis?: any;
  reasoning?: string;
  aiExplanation?: string;
}

export class SelectorGenerator {
  private aiEngine?: AIEngine;
  private config: any;

  // 🔧 FIX 1: Recibir toda la configuración
  constructor(config: any) {
    this.config = config;
    if (config?.ai?.enabled) {
      this.aiEngine = new AIEngine(config);
    }
  }

  // 🧠 Método con IA mejorado
  async generateSelectorWithAI(elementInfo: ElementInfo, context: PageContext): Promise<SelectorResult> {
    if (!this.aiEngine) {
      console.log('⚠️  AI not available, using traditional method');
      return this.generateSelector(elementInfo);
    }

    try {
      console.log('🧠 Generating AI-enhanced selector...');
      const aiResult = await this.aiEngine.generateSelector(elementInfo, context);
      
      // 🎯 FIX 2: Asegurar que retorne tipo "ai-enhanced"
      return {
        selector: aiResult.selector,
        confidence: Math.max(aiResult.confidence || 95, 90), // Mínimo 90% para IA
        type: 'ai-enhanced', // ← FORZAR tipo ai-enhanced
        aiEnhanced: true,
        reasoning: (aiResult as any).reasoning || aiResult.type || 'AI-generated selector based on element analysis',
        aiExplanation: (aiResult as any).explanation || (aiResult as any).reasoning || 'AI analysis completed'
      };
    } catch (error) {
      console.warn('🚨 AI generation failed, falling back to traditional method:', error);
      const traditionalResult = this.generateSelector(elementInfo);
      // Marcar como fallback cuando IA falla
      traditionalResult.type = 'fallback';
      traditionalResult.confidence = Math.min(traditionalResult.confidence, 70);
      return traditionalResult;
    }
  }
  
  generateSelector(elementInfo: ElementInfo): SelectorResult {
    console.log('🔍 Generating traditional selector for:', elementInfo.tagName);
    
    // 1. MÁXIMA PRIORIDAD: data-test
    if (elementInfo.attributes['data-test']) {
      return {
        selector: `[data-test="${elementInfo.attributes['data-test']}"]`,
        confidence: 95,
        type: 'data-test',
        reasoning: 'Selected data-test attribute - highest reliability for testing'
      };
    }
    
    // 2. data-testid
    if (elementInfo.attributes['data-testid']) {
      return {
        selector: `[data-testid="${elementInfo.attributes['data-testid']}"]`,
        confidence: 95,
        type: 'data-testid',
        reasoning: 'Selected data-testid attribute - excellent for automated testing'
      };
    }
    
    // 3. data-cy (Cypress)
    if (elementInfo.attributes['data-cy']) {
      return {
        selector: `[data-cy="${elementInfo.attributes['data-cy']}"]`,
        confidence: 90,
        type: 'data-cy',
        reasoning: 'Selected data-cy attribute - optimized for Cypress testing'
      };
    }
    
    // 4. data-qa
    if (elementInfo.attributes['data-qa']) {
      return {
        selector: `[data-qa="${elementInfo.attributes['data-qa']}"]`,
        confidence: 90,
        type: 'data-qa',
        reasoning: 'Selected data-qa attribute - designed for QA automation'
      };
    }
    
    // 5. aria-label
    if (elementInfo.attributes['aria-label']) {
      return {
        selector: `[aria-label="${elementInfo.attributes['aria-label']}"]`,
        confidence: 85,
        type: 'aria-label',
        reasoning: 'Selected aria-label - good accessibility and stability'
      };
    }
    
    // 6. role
    if (elementInfo.attributes['role']) {
      return {
        selector: `[role="${elementInfo.attributes['role']}"]`,
        confidence: 80,
        type: 'role',
        reasoning: 'Selected role attribute - semantic and relatively stable'
      };
    }
    
    // 7. name
    if (elementInfo.attributes['name']) {
      return {
        selector: `[name="${elementInfo.attributes['name']}"]`,
        confidence: 75,
        type: 'name',
        reasoning: 'Selected name attribute - common for form elements'
      };
    }
    
    // 8. id
    if (elementInfo.id && elementInfo.id.trim()) {
      return {
        selector: `#${elementInfo.id}`,
        confidence: 70,
        type: 'id',
        reasoning: 'Selected ID - unique but may change across environments'
      };
    }
    
    // 9. textContent (corto y específico)
    if (elementInfo.textContent && elementInfo.textContent.length < 50 && elementInfo.textContent.trim()) {
      const cleanText = elementInfo.textContent.trim();
      return {
        selector: `text="${cleanText}"`,
        confidence: 60,
        type: 'text',
        reasoning: 'Selected by text content - visible but may change with translations'
      };
    }
    
    // 10. placeholder
    if (elementInfo.attributes['placeholder']) {
      return {
        selector: `[placeholder="${elementInfo.attributes['placeholder']}"]`,
        confidence: 55,
        type: 'placeholder',
        reasoning: 'Selected placeholder - moderate stability, user-facing text'
      };
    }
    
    // 11. clases CSS (filtrar clases útiles)
    if (elementInfo.className && elementInfo.className.trim()) {
      const classes = elementInfo.className
        .split(' ')
        .filter(c => c.trim() && !c.includes('error') && !c.includes('active') && !c.includes('focus'))
        .slice(0, 2) // Máximo 2 clases
        .join('.');
      
      if (classes) {
        return {
          selector: `.${classes}`,
          confidence: 40,
          type: 'css-class',
          reasoning: 'Selected CSS classes - lower reliability, may change with styling'
        };
      }
    }
    
    // 12. Fallback por tag + atributos específicos
    if (elementInfo.attributes['type']) {
      return {
        selector: `${elementInfo.tagName}[type="${elementInfo.attributes['type']}"]`,
        confidence: 30,
        type: 'tag-type',
        reasoning: 'Selected by tag and type - basic selector, low specificity'
      };
    }
    
    // 13. Último recurso: solo tag
    return {
      selector: elementInfo.tagName,
      confidence: 20,
      type: 'tag-only',
      reasoning: 'Fallback to tag name - very basic, low reliability'
    };
  }
}