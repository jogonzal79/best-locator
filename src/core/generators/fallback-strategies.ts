// src/core/generators/fallback-strategies.ts

import { SelectorResult, ElementInfo } from '../../types/index.js';

/**
 * Estrategias de fallback para cuando no se encuentra un selector fuerte.
 * No son ideales, pero ayudan a garantizar que siempre se genere algo usable.
 */
export class FallbackStrategies {
  /**
   * Intenta usar el tag y texto de botones o links (<a>, <button>)
   */
  tryLinkStrategy(element: ElementInfo): SelectorResult | null {
    const tag = element.tagName.toLowerCase();
    const text = element.textContent?.trim();

    if (
      ['a', 'button'].includes(tag) &&
      text &&
      text.length > 0 &&
      text.length <= 30
    ) {
      const escapedText = CSS.escape(text);
      return this.result(`${tag}:has-text("${escapedText}")`, 40, 'text', 'Link or button with visible text');
    }

    return null;
  }

  /**
   * Usa nth-child como último recurso para ubicar un elemento dentro de su padre.
   */
  tryNthChildStrategy(element: ElementInfo): SelectorResult | null {
    const index = element.index;
    const parentTag = element.parentTag || 'div';

    if (typeof index === 'number' && index >= 0) {
      return this.result(`${parentTag} > :nth-child(${index + 1})`, 20, 'nth-child', 'Positional selector (weak fallback)');
    }

    return null;
  }

  /**
   * Si hay un atributo data-* relevante (como data-testid), se puede usar como selector.
   */
  tryDataAttributeStrategy(element: ElementInfo): SelectorResult | null {
    const attrs = element.attributes;
    for (const [key, value] of Object.entries(attrs)) {
      if (
        key.startsWith('data-') &&
        value &&
        typeof value === 'string' &&
        value.length <= 50
      ) {
        return this.result(`[${key}="${CSS.escape(value)}"]`, 45, 'attribute', `Uses ${key} attribute as fallback`);
      }
    }

    return null;
  }

  // 🔧 CORREGIDO: Método de utilidad para construir el resultado
  private result(
    selector: string,
    confidence: number,
    type: string,
    reason: string
  ): SelectorResult {
    return {
      selector,
      confidence,
      type,
      reasoning: reason  // 👈 CAMBIO: 'reason' → 'reasoning'
    };
  }
}