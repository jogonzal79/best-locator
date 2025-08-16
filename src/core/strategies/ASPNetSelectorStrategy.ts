// src/core/strategies/ASPNetSelectorStrategy.ts

import { ISelectorStrategy } from './ISelectorStrategy.js';
import { ElementInfo, SelectorResult } from '../../types/index.js';

/**
 * Estrategia para aplicaciones ASP.NET (WebForms / MVC).
 * Se enfoca en patrones como IDs con "_" (WebForms), atributos data-* y aria-*.
 */
export class ASPNetSelectorStrategy implements ISelectorStrategy {
  name = 'aspnet';

  evaluate(element: ElementInfo): SelectorResult | null {
    const id = element.id;

    // 1. IDs con guiones bajos (típicos de ASP.NET WebForms)
    if (id && id.includes('_') && !id.includes('$')) {
      return {
        selector: `#${id}`,
        confidence: 92,
        type: 'id',
        reasoning: 'ASP.NET: uses stable WebForms-style ID with underscores.'
      };
    }

    // 2. Atributos data-* (ASP.NET MVC o Razor Components)
    const dataAttrKey = Object.keys(element.attributes).find(attr =>
      attr.startsWith('data-')
    );

    if (dataAttrKey) {
      const value = element.attributes[dataAttrKey];
      if (value) {
        return {
          selector: `[${dataAttrKey}="${value}"]`,
          confidence: 88,
          type: 'data-attribute',
          reasoning: 'ASP.NET: uses data-* attribute for stable selectors.'
        };
      }
    }

    // 3. aria-label como fallback
    const ariaLabel = element.attributes['aria-label'];
    if (ariaLabel) {
      return {
        selector: `[aria-label="${ariaLabel}"]`,
        confidence: 80,
        type: 'aria-label',
        reasoning: 'ASP.NET: uses accessibility label as stable fallback.'
      };
    }

    // 4. Fallback: nombre de etiqueta
    if (element.tagName) {
      return {
        selector: element.tagName.toLowerCase(),
        confidence: 50,
        type: 'tag',
        reasoning: 'ASP.NET: fallback to generic tag name.'
      };
    }

    return null;
  }
}
