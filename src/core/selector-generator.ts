// src/core/selector-generator.ts
import { AIEngine, PageContext, ElementInfo } from './ai-engine.js';

interface SelectorResult {
  selector: string;
  confidence: number;
  type: string;
  aiEnhanced?: boolean;
  aiAnalysis?: any;
  reasoning?: string;
  aiExplanation?: string;
  framework_optimized?: boolean;
}

export class SelectorGenerator {
  private aiEngine?: AIEngine;
  private config: any;

  constructor(config: any) {
    this.config = config;
    if (config?.ai?.enabled) {
      this.aiEngine = new AIEngine(config);
    }
  }

  /**
   * Generate a selector optimized for the specified framework using AI.
   */
  async generateSelectorWithAI(
    elementInfo: ElementInfo,
    context: PageContext,
    framework: string = 'playwright'
  ): Promise<SelectorResult> {
    // ESTRATEGIA 1: Si el elemento tiene data-test, usar método tradicional
    if (
      elementInfo.attributes['data-test'] || 
      elementInfo.attributes['data-testid'] || 
      elementInfo.attributes['data-cy']
    ) {
      console.log('🎯 Element has test attributes, using optimized traditional method');
      const traditionalResult = this.generateSelector(elementInfo);
      return {
        ...traditionalResult,
        type: 'ai-optimized-traditional',
        confidence: Math.max(traditionalResult.confidence, 95),
        reasoning: 'AI detected test attributes and used optimal traditional method'
      };
    }
    // ESTRATEGIA 2: Usar estrategia específica por framework
    if (framework === 'playwright') {
      return this.generatePlaywrightOptimized(elementInfo, context);
    } else if (framework === 'cypress') {
      return this.generateCypressOptimized(elementInfo, context);
    } else if (framework === 'selenium') {
      return this.generateSeleniumOptimized(elementInfo, context);
    }
    // Fallback
    return this.generateTraditionalSelector(elementInfo);
  }

  /**
   * Playwright-specific selector strategy
   */
  private generatePlaywrightOptimized(
    elementInfo: ElementInfo,
    context: PageContext
  ): SelectorResult {
    // 1. MÁXIMA PRIORIDAD: Role semántico universal (igual que método tradicional)
    const detectedRole = this.getElementRole(elementInfo);
    if (detectedRole && elementInfo.textContent && elementInfo.textContent.trim()) {
      const cleanText = elementInfo.textContent.trim();
      
      return {
        selector: `get_by_role("${detectedRole}", name="${cleanText}")`,
        confidence: 100,
        type: 'ai-universal-role',
        framework_optimized: true,
        reasoning: `AI with universal semantic role detection - industry best practice (${detectedRole})`
      };
    }
    // 2. get_by_text para elementos con texto único
    if (elementInfo.textContent && this.isUniqueText(elementInfo.textContent)) {
      return {
        selector: `get_by_text("${elementInfo.textContent.trim()}")`,
        confidence: 85,
        type: 'playwright-text',
        framework_optimized: true
      };
    }
    // 3. Fallback a CSS tradicional
    return this.generateTraditionalSelector(elementInfo);
  }

  /**
   * Cypress-specific selector strategy
   */
  private generateCypressOptimized(
    elementInfo: ElementInfo,
    context: PageContext
  ): SelectorResult {
    // 1. data-cy tiene prioridad máxima en Cypress
    if (elementInfo.attributes['data-cy']) {
      return {
        selector: `[data-cy="${elementInfo.attributes['data-cy']}"]`,
        confidence: 95,
        type: 'cypress-data-cy',
        framework_optimized: true
      };
    }
    // 2. cy.contains() para texto
    if (elementInfo.textContent && this.isUniqueText(elementInfo.textContent)) {
      return {
        selector: `cy.contains("${elementInfo.textContent.trim()}")`,
        confidence: 80,
        type: 'cypress-contains',
        framework_optimized: true
      };
    }
    // 3. Fallback a CSS tradicional
    return this.generateTraditionalSelector(elementInfo);
  }

  /**
   * Selenium-specific selector strategy
   */
  private generateSeleniumOptimized(
    elementInfo: ElementInfo,
    context: PageContext
  ): SelectorResult {
    // Selenium se basa principalmente en CSS y XPath
    return this.generateTraditionalSelector(elementInfo);
  }

  /**
   * Fallback al método tradicional existente
   */
  private generateTraditionalSelector(elementInfo: ElementInfo): SelectorResult {
    return this.generateSelector(elementInfo);
  }

  private isUniqueText(text: string): boolean {
    if (!text || text.trim().length < 3) return false;
    const trimmed = text.trim();
    return trimmed.length < 50 && !this.isGenericText(trimmed) && !trimmed.match(/^\d+$/) && !trimmed.includes('...');
  }

  private isGenericText(text: string): boolean {
    const generic = ['click', 'button', 'submit', 'ok', 'yes', 'no', 'cancel', 'close', 'save', 'edit'];
    return generic.includes(text.toLowerCase());
  }
  /**
   * Mapeo universal de elementos HTML a roles ARIA
   */
  private getElementRole(elementInfo: ElementInfo): string | null {
   // console.log('🔥 [DEBUG] getElementRole - elementInfo:', JSON.stringify(elementInfo, null, 2));

    const tag = elementInfo.tagName.toLowerCase();
    const type = elementInfo.attributes['type']?.toLowerCase();
    
    // Mapeo completo según estándares ARIA
    const roleMap: { [key: string]: string } = {
      'button': 'button',
      'a': 'link',
      'h1': 'heading',
      'h2': 'heading', 
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading',
      'select': 'combobox',
      'textarea': 'textbox'
    };
    
    // Input types específicos
    if (tag === 'input') {
      switch (type) {
        case 'text':
        case 'email':
        case 'password':
        case 'search':
        case 'url':
          return 'textbox';
        case 'checkbox':
          return 'checkbox';
        case 'radio':
          return 'radio';
        case 'submit':
        case 'button':
          return 'button';
        default:
          return 'textbox'; // fallback para inputs
      }
    }
    // Verificar si tiene atributo role explícito (para divs con role="button", etc.)
    if (elementInfo.attributes['role']) {
      return elementInfo.attributes['role'];
    }
    // Detectar elementos dentro de contextos interactivos por clase
    if (tag === 'span' && elementInfo.className) {
      if (elementInfo.className.includes('button')) {
        return 'button';
      }
      if (elementInfo.className.includes('link')) {
        return 'link';
      }
    }

    return roleMap[tag] || null;
  }


  /**
   * Método tradicional de generación de selectores CSS y de texto
   */
  generateSelector(elementInfo: ElementInfo): SelectorResult {
    console.log('🔍 Generating traditional selector for:', elementInfo.tagName);


    // 0. NUEVA MÁXIMA PRIORIDAD: Role semántico universal
    const detectedRole = this.getElementRole(elementInfo);
    if (detectedRole && elementInfo.textContent && elementInfo.textContent.trim()) {
      const cleanText = elementInfo.textContent.trim();
      
      return {
        selector: `get_by_role("${detectedRole}", name="${cleanText}")`,
        confidence: 100,
        type: 'universal-role-semantic',
        reasoning: `Universal semantic role detection - industry best practice (${detectedRole})`
      };
    }

    // 0.5. Role semántico SIN texto (botones de íconos, botones X, etc.)

    if (detectedRole && (!elementInfo.textContent || !elementInfo.textContent.trim())) {
     // console.log('🔥 [DEBUG] ✅ ENTERING NO-TEXT ROLE LOGIC');
      return {
        selector: `get_by_role("${detectedRole}", name="")`,
        confidence: 95,
        type: 'universal-role-no-text',
        reasoning: `Universal semantic role for icon/visual element (${detectedRole})`
      };
    }

    if (detectedRole && (!elementInfo.textContent || !elementInfo.textContent.trim())) {
      return {
        selector: `get_by_role("${detectedRole}", name="")`,
        confidence: 95,
        type: 'universal-role-no-text',
        reasoning: `Universal semantic role for icon/visual element (${detectedRole})`
      };
    }

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
    // 3. data-cy
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
    // 6. role attribute
    if (elementInfo.attributes['role']) {
      return {
        selector: `[role="${elementInfo.attributes['role']}"]`,
        confidence: 80,
        type: 'role',
        reasoning: 'Selected role attribute - semantic and relatively stable'
      };
    }
    // 7. name attribute
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
    // 9. textContent mejorado
    if (
      elementInfo.textContent &&
      elementInfo.textContent.length < 50 &&
      elementInfo.textContent.trim()
    ) {
      const cleanText = elementInfo.textContent.trim();
      if (!['click', 'button', 'submit', 'ok', 'yes', 'no'].includes(cleanText.toLowerCase())) {
        return {
          selector: `text="${cleanText}"`,
          confidence: 65,
          type: 'text-content',
          reasoning: 'Selected by specific text content - may change with translations'
        };
      }
    }
    // 10. MEJORADO: Clases CSS más inteligentes
    if (elementInfo.className && elementInfo.className.trim()) {
      const classes = elementInfo.className
        .split(' ')
        .filter((c) => c.trim())
        .filter(
          (c) =>
            !c.includes('error') &&
            !c.includes('active') &&
            !c.includes('focus') &&
            !c.includes('hover')
        )
        .filter((c) => c.length > 2)
        .slice(0, 1);
      if (classes.length > 0) {
        const bestClass = classes[0];
        if (bestClass.length > 3 && !['btn', 'box', 'div', 'item'].includes(bestClass)) {
          return {
            selector: `.${bestClass}`,
            confidence: 60,
            type: 'css-class-optimized',
            reasoning: `Selected specific CSS class "${bestClass}" - moderate stability`
          };
        }
      }
    }
    // 11. placeholder
    if (elementInfo.attributes['placeholder']) {
      return {
        selector: `[placeholder="${elementInfo.attributes['placeholder']}"]`,
        confidence: 55,
        type: 'placeholder',
        reasoning: 'Selected placeholder - moderate stability, user-facing text'
      };
    }
    // 12. tag + primera clase
    if (elementInfo.className && elementInfo.className.trim()) {
      const firstClass = elementInfo.className.split(' ')[0];
      if (firstClass && firstClass.length > 2) {
        return {
          selector: `${elementInfo.tagName}.${firstClass}`,
          confidence: 40,
          type: 'tag-class-combo',
          reasoning: `Combined tag and class selector - better than tag alone`
        };
      }
    }
    // 13. Fallback final: solo tag
    return {
      selector: elementInfo.tagName,
      confidence: 20,
      type: 'tag-only',
      reasoning: 'Fallback to tag name - very basic, low reliability'
    };
  }
}
