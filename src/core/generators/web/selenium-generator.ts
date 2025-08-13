// src/core/generators/web/selenium-generator.ts
import { BaseWebGenerator } from '../base-generator.js';
import { SelectorResult } from '../../../types/index.js';

export class SeleniumGenerator extends BaseWebGenerator {
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
    return 40;
  }

  optimizeForFramework(result: SelectorResult): SelectorResult {
    if (result.type === 'id') {
      return { ...result, confidence: Math.min(result.confidence + 10, 100), reasoning: 'Selenium prefers By.id() when available' };
    }
    if (result.type === 'css') {
      if (result.selector.startsWith('#')) {
        const id = result.selector.substring(1);
        return { ...result, type: 'id', selector: id, confidence: Math.min(result.confidence + 10, 100), reasoning: 'Converted CSS #id to By.id()' };
      }
      const nameMatch = result.selector.match(/\[name=["']([^"']+)["']\]/);
      if (nameMatch) {
        return { ...result, type: 'name', selector: nameMatch[1], confidence: Math.min(result.confidence + 5, 100), reasoning: 'Selenium prefers By.name() for form elements' };
      }
    }
    if (result.type === 'role') {
      const [role, name] = result.selector.split('|');
      if (name) {
        return { ...result, type: 'xpath', selector: `//*[@role="${role}" and normalize-space()="${name}"]`, confidence: Math.max(result.confidence - 5, 0), reasoning: 'Selenium uses XPath for role+text combinations' };
      }
    }
    if (result.type === 'placeholder') {
      return { ...result, type: 'css', selector: `[placeholder="${result.selector}"]`, reasoning: 'Selenium uses CSS for placeholder' };
    }
    return result;
  }
}
