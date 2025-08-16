// src/core/strategies/ReactSelectorStrategy.ts

import { ISelectorStrategy } from './ISelectorStrategy.js';
import { ElementInfo, SelectorResult } from '../../types/index.js';

/**
 * Estrategia específica para aplicaciones desarrolladas con React.
 * Prioriza atributos comunes como data-testid y aria-label.
 */
export class ReactSelectorStrategy implements ISelectorStrategy {
  name = 'react';

  evaluate(element: ElementInfo): SelectorResult | null {
    // 1. Prioridad: data-testid
    const testId = element.attributes['data-testid'];
    if (testId) {
      return {
        selector: `[data-testid="${testId}"]`,
        confidence: 95,
        type: 'data-testid',
        reasoning: 'React: uses stable data-testid attribute commonly used in testing.'
      };
    }

    // 2. Alternativa: aria-label
    const ariaLabel = element.attributes['aria-label'];
    if (ariaLabel) {
      return {
        selector: `[aria-label="${ariaLabel}"]`,
        confidence: 85,
        type: 'aria-label',
        reasoning: 'React: aria-label used for accessibility and often stable.'
      };
    }

    // 3. Alternativa adicional: id
    const id = element.id;
    if (id && !id.includes('$')) {
      return {
        selector: `#${id}`,
        confidence: 75,
        type: 'id',
        reasoning: 'React: using non-dynamic ID.'
      };
    }

    // 4. Fallback: tagName
    if (element.tagName) {
      return {
        selector: element.tagName.toLowerCase(),
        confidence: 50,
        type: 'tag',
        reasoning: 'React: fallback to tag selector.'
      };
    }

    return null;
  }
}
