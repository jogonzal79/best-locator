// src/core/strategies/DjangoSelectorStrategy.ts

import { ISelectorStrategy } from './ISelectorStrategy.js';
import { ElementInfo, SelectorResult } from '../../types/index.js';

export class DjangoSelectorStrategy implements ISelectorStrategy {
  name = 'django';

  evaluate(element: ElementInfo): SelectorResult | null {
    // 1. Usar ID si existe
    const id = element.attributes['id'];
    if (id) {
      return {
        selector: `#${id}`,
        confidence: 95,
        type: 'id',
        reasoning: 'Django: uses element ID, likely to be unique from template rendering'
      };
    }

    // 2. Usar name si parece significativo
    const name = element.attributes['name'];
    if (name && /^[a-zA-Z0-9_-]+$/.test(name)) {
      return {
        selector: `[name="${name}"]`,
        confidence: 85,
        type: 'name',
        reasoning: 'Django: uses meaningful name attribute'
      };
    }

    // 3. Usar data-* attribute si disponible
    const dataKeys = Object.keys(element.attributes).filter(attr => attr.startsWith('data-'));
    if (dataKeys.length > 0) {
      const key = dataKeys[0];
      const value = element.attributes[key];
      return {
        selector: `[${key}="${value}"]`,
        confidence: 80,
        type: key,
        reasoning: `Django: uses custom data attribute (${key})`
      };
    }

    // 4. aria-label como último recurso
    const aria = element.attributes['aria-label'];
    if (aria) {
      return {
        selector: `[aria-label="${aria}"]`,
        confidence: 75,
        type: 'aria-label',
        reasoning: 'Django: fallback to aria-label'
      };
    }

    return null;
  }
}
