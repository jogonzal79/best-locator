// src/core/strategies/AngularSelectorStrategy.ts

import { ISelectorStrategy } from './ISelectorStrategy.js';
import { ElementInfo, SelectorResult } from '../../types/index.js';

/**
 * Estrategia para aplicaciones Angular.
 * Se basa en convenciones típicas como formControlName, ng-reflect-* y data-test.
 */
export class AngularSelectorStrategy implements ISelectorStrategy {
  name = 'angular';

  evaluate(element: ElementInfo): SelectorResult | null {
    // 1. Prioridad: data-test
    const dataTest = element.attributes['data-test'];
    if (dataTest) {
      return {
        selector: `[data-test="${dataTest}"]`,
        confidence: 95,
        type: 'data-test',
        reasoning: 'Angular: uses data-test as stable test selector.'
      };
    }

    // 2. formControlName (común en formularios reactivos)
    const formControlName = element.attributes['formcontrolname'];
    if (formControlName) {
      return {
        selector: `[formControlName="${formControlName}"]`,
        confidence: 90,
        type: 'formControlName',
        reasoning: 'Angular: uses formControlName for form fields.'
      };
    }

    // 3. ng-reflect-* (visible en modo debug y pruebas, aunque no siempre estático)
    const reflectKeys = Object.keys(element.attributes).filter(attr =>
      attr.startsWith('ng-reflect-')
    );

    if (reflectKeys.length > 0) {
      const key = reflectKeys[0];
      const value = element.attributes[key];
      if (value) {
        return {
          selector: `[${key}="${value}"]`,
          confidence: 80,
          type: 'ng-reflect',
          reasoning: `Angular: uses ${key}, a common debug attribute for Angular components.`
        };
      }
    }

    // 4. aria-label
    const ariaLabel = element.attributes['aria-label'];
    if (ariaLabel) {
      return {
        selector: `[aria-label="${ariaLabel}"]`,
        confidence: 75,
        type: 'aria-label',
        reasoning: 'Angular: fallback using accessibility attribute.'
      };
    }

    // 5. Fallback: tag
    if (element.tagName) {
      return {
        selector: element.tagName.toLowerCase(),
        confidence: 50,
        type: 'tag',
        reasoning: 'Angular: fallback to generic tag selector.'
      };
    }

    return null;
  }
}
