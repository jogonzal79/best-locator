// src/core/strategies/AgnosticSelectorStrategy.ts

import { ISelectorStrategy } from './ISelectorStrategy.js';
import { ElementInfo, SelectorResult } from '../../types/index.js';

export class AgnosticSelectorStrategy implements ISelectorStrategy {
  name = 'agnostic';

  evaluate(element: ElementInfo): SelectorResult | null {
    const id = element.id;
    if (id && id.trim()) {
      return {
        selector: `#${CSS.escape(id)}`,
        confidence: 90,
        type: 'id',
        reasoning: 'Agnostic: uses simple ID selector'
      };
    }

    const dataAttributes = Object.entries(element.attributes).filter(([key]) =>
      key.startsWith('data-')
    );

    // Preferidos
    const preferredDataAttrs = ['data-testid', 'data-test', 'data-cy', 'data-role'];

    for (const attr of preferredDataAttrs) {
      const value = element.attributes[attr];
      if (value) {
        return {
          selector: `[${attr}="${value}"]`,
          confidence: 88,
          type: attr,
          reasoning: `Agnostic: uses ${attr} attribute`
        };
      }
    }

    // Si no hay preferidos, usar el primer data-* disponible
    if (dataAttributes.length > 0) {
      const [firstAttr, firstValue] = dataAttributes[0];
      return {
        selector: `[${firstAttr}="${firstValue}"]`,
        confidence: 78,
        type: firstAttr,
        reasoning: `Agnostic: fallback to generic ${firstAttr}`
      };
    }

    // Aria-label como opción de accesibilidad
    const ariaLabel = element.attributes['aria-label'];
    if (ariaLabel) {
      return {
        selector: `[aria-label="${ariaLabel}"]`,
        confidence: 80,
        type: 'aria-label',
        reasoning: 'Agnostic: uses aria-label'
      };
    }

    return null;
  }
}
