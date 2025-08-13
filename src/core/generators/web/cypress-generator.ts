// src/core/generators/web/cypress-generator.ts
import { BaseWebGenerator } from '../base-generator.js';
import { ElementInfo, SelectorResult } from '../../../types/index.js';

export class CypressGenerator extends BaseWebGenerator {
  getPriorityOrder(): string[] {
    return [
      'test-id',       // data-testid, data-cy, etc.
      'stable-id',     // id “humano” (incluye ASP.NET c/underscore)
      'aria-role',     // role + accessibleName
      'form-attrs',    // name / label[for]
      'semantic-attrs',// aria-label, type específicos
      'placeholder',   // placeholders cortos
      'link-href',     // a[href*="..."]
      'stable-css',    // clases “semánticas”
      'text',          // último recurso
    ];
  }

  getMinConfidenceThreshold(): number {
    return 50;
  }

  protected tryPriorityAttributes(element: ElementInfo): SelectorResult | null {
    if (element.attributes['data-cy']) {
      return this.result(element.attributes['data-cy'], 100, 'test-id', 'Cypress best practice: data-cy');
    }
    return super.tryPriorityAttributes(element);
  }

  optimizeForFramework(result: SelectorResult): SelectorResult {
    if (result.type === 'id') {
      return { ...result, type: 'css', selector: `#${result.selector}`, reasoning: 'Cypress uses CSS syntax for IDs' };
    }
    if (result.type === 'role') {
      const [_, name] = result.selector.split('|');
      if (name) {
        return { ...result, type: 'text', selector: name, confidence: Math.max(result.confidence - 10, 0), reasoning: 'Cypress uses cy.contains() for text' };
      }
    }
    if (result.type === 'css' && result.selector.includes('.form-control')) {
      return { ...result, confidence: Math.max(result.confidence - 20, 30), reasoning: 'Generic class selector (low confidence)' };
    }
    return result;
  }
}
