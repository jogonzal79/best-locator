// src/core/strategies/TailwindSelectorStrategy.ts

import { ISelectorStrategy } from './ISelectorStrategy.js';
import { ElementInfo, SelectorResult } from '../../types/index.js';

export class TailwindSelectorStrategy implements ISelectorStrategy {
  name = 'tailwind';

  evaluate(element: ElementInfo): SelectorResult | null {
    // Estrategia basada en atributos utility-friendly
    const dataAttributes = Object.entries(element.attributes).filter(([key]) =>
      key.startsWith('data-')
    );

    const preferredAttrs = ['data-testid', 'data-role', 'data-component', 'data-cy', 'data-test'];

    for (const attr of preferredAttrs) {
      const value = element.attributes[attr];
      if (value) {
        return {
          selector: `[${attr}="${value}"]`,
          confidence: 92,
          type: attr,
          reasoning: `Tailwind strategy: uses ${attr}`
        };
      }
    }

    if (dataAttributes.length > 0) {
      const [firstAttr, firstValue] = dataAttributes[0];
      return {
        selector: `[${firstAttr}="${firstValue}"]`,
        confidence: 80,
        type: firstAttr,
        reasoning: `Tailwind strategy: fallback to first available data-* attribute`
      };
    }

    return null;
  }
}
