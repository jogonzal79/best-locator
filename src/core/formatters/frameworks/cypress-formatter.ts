// src/core/formatters/frameworks/cypress-formatter.ts
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

const qS = (s: string) => `'${String(s).replace(/'/g, `\\'`)}'`;

function parseRole(selector: string): { role?: string; name?: string } {
  if (!selector) return {};
  if (selector.includes('|')) {
    const [role, name] = selector.split('|', 2);
    return { role: role?.trim(), name: name?.trim() };
  }
  const m = selector.match(/^([a-zA-Z]+)\s*\[\s*name\s*=\s*['"]([^'"]+)['"]\s*\]$/);
  if (m) return { role: m[1], name: m[2] };
  return { role: selector.trim() };
}

export class CypressFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, _language: Language): string {
    const get = (css: string) => `cy.get(${qS(css)})`;
    const contains = (text: string) => `cy.contains(${qS(text)})`;

    switch (result.type) {
      case 'test-id':
        return get(`[data-testid="${result.selector}"]`);

      case 'id':
        return get(`#${result.selector}`);

      case 'placeholder':
        return get(`[placeholder="${result.selector}"]`);

      case 'role': {
        // Cypress no tiene getByRole nativo → usar texto accesible
        const { name } = parseRole(result.selector);
        if (name) return contains(name);
        return get(`[role="${result.selector}"]`);
      }

      case 'link-href':
        return get(`a[href*="${result.selector}"]`);

      case 'text':
        return contains(result.selector);

      case 'css':
      default:
        return get(result.selector);
    }
  }

  formatMobile?(..._args: any[]): string {
    return '';
  }
}
