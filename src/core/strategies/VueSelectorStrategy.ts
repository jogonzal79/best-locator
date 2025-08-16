// src/core/strategies/VueSelectorStrategy.ts

import { ISelectorStrategy } from './ISelectorStrategy.js';
import { ElementInfo, SelectorResult } from '../../types/index.js';

/**
 * Estrategia específica para aplicaciones desarrolladas con Vue.js.
 * Prioriza atributos comunes como data-testid, data-test y aria-label.
 */
export class VueSelectorStrategy implements ISelectorStrategy {
  name = 'vue';

  evaluate(element: ElementInfo): SelectorResult | null {
    // 1. Prioridad: data-testid
    const testId = element.attributes['data-testid'];
    if (testId) {
      return {
        selector: `[data-testid="${testId}"]`,
        confidence: 95,
        type: 'data-testid',
        reasoning: 'Vue: uses stable data-testid commonly added for testing.'
      };
    }

    // 2. Alternativa: data-test (muy común en Vue)
    const dataTest = element.attributes['data-test'];
    if (dataTest) {
      return {
        selector: `[data-test="${dataTest}"]`,
        confidence: 90,
        type: 'data-test',
        reasoning: 'Vue: data-test is a common convention for test selectors.'
      };
    }

    // 3. Alternativa: aria-label
    const ariaLabel = element.attributes['aria-label'];
    if (ariaLabel) {
      return {
        selector: `[aria-label="${ariaLabel}"]`,
        confidence: 80,
        type: 'aria-label',
        reasoning: 'Vue: uses aria-label for accessibility and fallback targeting.'
      };
    }

    // 4. Alternativa adicional: id
    const id = element.id;
    if (id && !id.includes('$')) {
      return {
        selector: `#${id}`,
        confidence: 70,
        type: 'id',
        reasoning: 'Vue: using static ID for element identification.'
      };
    }

    // 5. Fallback: tagName
    if (element.tagName) {
      return {
        selector: element.tagName.toLowerCase(),
        confidence: 50,
        type: 'tag',
        reasoning: 'Vue: fallback to tag selector.'
      };
    }

    return null;
  }
}
