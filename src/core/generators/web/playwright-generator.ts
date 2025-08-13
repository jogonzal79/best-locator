// src/core/generators/web/playwright-generator.ts
import { BaseWebGenerator } from '../base-generator.js';
import { SelectorResult } from '../../../types/index.js';

export class PlaywrightGenerator extends BaseWebGenerator {
  getPriorityOrder(): string[] {
    // Incluir TODAS las estrategias, orden idiomático Playwright
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
    return 70;
  }

  optimizeForFramework(result: SelectorResult): SelectorResult {
    // Convertir CSS con data-testid a test-id
    if (result.type === 'css') {
      const testIdMatch = result.selector.match(/\[data-testid="([^"]+)"\]/);
      if (testIdMatch) {
        return { ...result, type: 'test-id', selector: testIdMatch[1], confidence: 100, reasoning: 'Converted CSS to Playwright test-id' };
      }
      const roleMatch = result.selector.match(/\[role="([^"]+)"\]/);
      if (roleMatch) {
        return { ...result, type: 'role', selector: roleMatch[1], confidence: 95, reasoning: 'Converted CSS to Playwright role' };
      }
    }

    if (result.type === 'id') {
      return { ...result, type: 'css', selector: `#${result.selector}`, confidence: Math.max(0, result.confidence - 5), reasoning: 'Playwright prefers locators over IDs' };
    }
    return result;
  }
}
