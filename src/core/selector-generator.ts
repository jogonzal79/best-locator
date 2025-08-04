// src/core/selector-generator.ts - CORRECCIÓN PARA ELEMENTOS RESTAURADOS

import { AIEngine } from './ai-engine.js';
import { BestLocatorConfig, SelectorResult, ElementInfo, PageContext } from '../types/index.js';
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

  public async generateSelectorWithAI(elementInfo: ElementInfo, context: PageContext): Promise<SelectorResult> {
    const priorityResult = this.getPrioritySelector(elementInfo);
    if (priorityResult) {
      return priorityResult;
    }
    
    if (this.aiEngine && await this.aiEngine.isAvailable()) {
      try {
        return await this.aiEngine.generateSelector(elementInfo, context);
      } catch (error) {
         logger.warning('⚠️ AI generation failed, falling back to traditional method.');
      }
    }
    return this.generateSelector(elementInfo);
  }

  public generateSelector(elementInfo: ElementInfo): SelectorResult {
    // 🛡️ SANITIZAR DATOS DE ENTRADA (elementos restaurados pueden tener tipos incorrectos)
    const sanitizedElement = this.sanitizeElementInfo(elementInfo);
    const { attributes, tagName, textContent, id, className } = sanitizedElement;

    const priorityResult = this.getPrioritySelector(sanitizedElement);
    if (priorityResult) {
      return priorityResult;
    }

    if (attributes['aria-label']) {
      return this.result(`${tagName}[aria-label="${attributes['aria-label']}"]`, 90, 'css', `Uses 'aria-label'.`);
    }
    if (attributes['role']) {
      return this.result(`${tagName}[role="${attributes['role']}"]`, 85, 'css', `Uses ARIA role.`);
    }

    if (attributes['name']) {
      return this.result(`${tagName}[name="${attributes['name']}"]`, 80, 'css', `Uses form element name.`);
    }
    if (id && !/^\d+$/.test(id)) {
      return this.result(id, 75, 'id', `Uses a unique ID.`);
    }

    const isTextless = !textContent || textContent.trim().length === 0;
    if (tagName === 'a' && attributes.href && isTextless) {
      const href = attributes.href;
      const keywords = ['discord', 'twitter', 'facebook', 'linkedin', 'github', 'youtube', 'instagram'];
      for (const keyword of keywords) {
        if (href.includes(keyword)) {
          return this.result(`a[href*="${keyword}"]`, 88, 'css', `Uses keyword from href.`);
        }
      }
    }

    const cleanText = textContent?.trim();
    if (cleanText && cleanText.length > 0 && cleanText.length < 50) {
      return this.result(cleanText, 70, 'text', `Uses visible text content.`);
    }
    
    if (attributes['placeholder']) {
      return this.result(attributes['placeholder'], 65, 'placeholder', `Uses placeholder text.`);
    }

    // 🛡️ MANEJO SEGURO DE className
    if (className && typeof className === 'string' && className.trim()) {
        const stableClasses = className.split(' ').filter(c => c && c.length > 3 && !/hover|active|disabled|focus|selected|--|__|jet/i.test(c));
        if (stableClasses.length > 0) {
            const bestClass = stableClasses.sort((a, b) => b.length - a.length)[0];
            return this.result(`${tagName}.${bestClass}`, 50, 'css', `Uses tag name and a stable CSS class.`);
        }
    }
    
    return this.result(tagName, 10, 'css', 'Fallback to tag name.');
  }

  /**
   * 🛡️ SANITIZAR ElementInfo para elementos restaurados desde sessionStorage
   */
  private sanitizeElementInfo(elementInfo: ElementInfo): ElementInfo {
    return {
      tagName: String(elementInfo.tagName || 'div').toLowerCase(),
      id: String(elementInfo.id || ''),
      className: typeof elementInfo.className === 'string' ? elementInfo.className : '',
      textContent: String(elementInfo.textContent || ''),
      attributes: elementInfo.attributes && typeof elementInfo.attributes === 'object' ? elementInfo.attributes : {},
      order: elementInfo.order,
      computedRole: elementInfo.computedRole,
      accessibleName: elementInfo.accessibleName,
    };
  }

  private result(selector: string, confidence: number, type: string, reasoning: string): SelectorResult {
    return { selector, confidence, type, reasoning };
  }

  private getPrioritySelector(elementInfo: ElementInfo): SelectorResult | null {
    for (const attr of this.config.projectAttributes) {
      if (elementInfo.attributes[attr]) {
        return this.result(elementInfo.attributes[attr], 100, 'test-id', `Selected attribute '${attr}'.`);
      }
    }
    return null;
  }
}