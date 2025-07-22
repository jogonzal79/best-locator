// src/core/selector-generator.ts
import { AIEngine, PageContext, ElementInfo, AIEnhancedResult } from './ai-engine.js';
import { BestLocatorConfig, SelectorResult } from '../types/index.js';
import { logger } from '../app/logger.js';

export class SelectorGenerator {
  private aiEngine?: AIEngine;
  private config: BestLocatorConfig;

  constructor(config: BestLocatorConfig) {
    this.config = config;
    if (config?.ai?.enabled) {
      this.aiEngine = new AIEngine(config);
    }
  }

  /**
   * NUEVA LÓGICA HÍBRIDA: Combina la lógica determinista con la IA.
   */
  public async generateSelectorWithAI(
    elementInfo: ElementInfo,
    context: PageContext,
    framework: string = 'playwright'
  ): Promise<SelectorResult> {
    
    // ================== INICIO DE LA CORRECCIÓN ==================
    //
    // PASO 1: Comprobación prioritaria. ¿Existe un selector de máxima fiabilidad?
    //
    const priorityResult = this.getPrioritySelector(elementInfo);
    if (priorityResult) {
      // Si encontramos un data-test o similar, lo usamos y no consultamos a la IA.
      // Esto garantiza la máxima estabilidad y consistencia.
      return priorityResult;
    }

    // PASO 2: Si no hay un selector prioritario, AHORA SÍ, pedimos ayuda a la IA.
    if (this.aiEngine) {
      try {
        const aiResult: AIEnhancedResult = await this.aiEngine.generateSelector(elementInfo, context);
        if (aiResult.aiEnhanced && aiResult.selector) {
          return {
            ...aiResult,
            reasoning: 'AI-generated selector based on element context.'
          };
        }
      } catch (error) {
         logger.warning('⚠️ AI generation failed, falling back to traditional method.');
      }
    }
    
    // PASO 3: Si todo lo demás falla, usamos el método tradicional como último recurso.
    return this.generateSelector(elementInfo);
    // =================== FIN DE LA CORRECCIÓN ====================
  }

  /**
   * Método tradicional de generación de selectores.
   */
  public generateSelector(elementInfo: ElementInfo): SelectorResult {
    const priorityResult = this.getPrioritySelector(elementInfo);
    if (priorityResult) {
      return priorityResult;
    }

    // Si no hay selector prioritario, busca otras alternativas
    const detectedRole = this.getElementRole(elementInfo);
    if (detectedRole && elementInfo.textContent && elementInfo.textContent.trim()) {
      const cleanText = elementInfo.textContent.trim().replace(/"/g, '\\"');
      return {
        selector: `getByRole("${detectedRole}", { name: "${cleanText}" })`,
        confidence: 90,
        type: 'semantic-role',
        reasoning: `Semantic role with text is highly reliable.`
      };
    }
    
    if (elementInfo.id && !/^\d+$/.test(elementInfo.id)) {
      return { selector: `#${elementInfo.id}`, confidence: 80, type: 'id', reasoning: 'Selected ID - generally unique.' };
    }

    if (elementInfo.attributes['placeholder']) {
      return { selector: `[placeholder="${elementInfo.attributes['placeholder']}"]`, confidence: 75, type: 'placeholder', reasoning: 'Selected by placeholder text.' };
    }
    
    const className = typeof elementInfo.className === 'string' ? elementInfo.className : '';
    if (className && className.trim()) {
      const bestClass = className.split(' ').find(c => c && c.length > 2 && !/\d/.test(c) && !c.includes('active'));
      if (bestClass) {
        return { selector: `.${bestClass}`, confidence: 50, type: 'css-class', reasoning: `Selected a specific CSS class.` };
      }
    }

    return { selector: elementInfo.tagName, confidence: 10, type: 'tag-only', reasoning: 'Fallback to tag name - low reliability.' };
  }

  /**
   * Función de ayuda que busca el selector de máxima prioridad (data-test, etc.).
   */
  private getPrioritySelector(elementInfo: ElementInfo): SelectorResult | null {
    const testAttributes = this.config.projectAttributes || ['data-test', 'data-testid', 'data-cy'];
    for (const attr of testAttributes) {
      if (elementInfo.attributes[attr]) {
        return {
          selector: `[${attr}="${elementInfo.attributes[attr]}"]`,
          confidence: 100,
          type: 'data-test-attribute',
          reasoning: `Selected attribute '${attr}' - highest reliability for testing.`
        };
      }
    }
    return null; // No se encontró un selector prioritario.
  }

  private getElementRole(elementInfo: ElementInfo): string | null {
    // ... (este método de ayuda no necesita cambios)
    const tag = elementInfo.tagName.toLowerCase();
    const type = elementInfo.attributes['type']?.toLowerCase();
    if (elementInfo.attributes['role']) { return elementInfo.attributes['role']; }
    const roleMap: { [key: string]: string } = { 'a': 'link', 'button': 'button', 'select': 'combobox', 'textarea': 'textbox', 'h1': 'heading', 'h2': 'heading', 'h3': 'heading', 'h4': 'heading', 'h5': 'heading', 'h6': 'heading' };
    if (tag === 'input') { const inputTypeMap: { [key: string]: string } = { 'button': 'button', 'checkbox': 'checkbox', 'radio': 'radio', 'submit': 'button' }; return inputTypeMap[type || ''] || 'textbox'; }
    return roleMap[tag] || null;
  }
}
