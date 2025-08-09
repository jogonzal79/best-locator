// src/core/formatters/frameworks/cypress-formatter.ts
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

const qS = (s: string) => `'${String(s).replace(/'/g, `\\'`)}'`;
const qD = (s: string) => `"${String(s).replace(/"/g, `\\"`)}"`;

export class CypressFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, _language: Language): string {
    switch (result.type) {
      case 'test-id': 
        return `cy.get('[data-testid="${result.selector}"]')`;
      case 'text': 
        return `cy.contains(${qS(result.selector)})`;
      case 'css': 
        return `cy.get(${qS(result.selector)})`;
      case 'xpath': 
        return `cy.xpath(${qS(result.selector)})`;
      case 'link-href': {
        const css = `a[href*="${result.selector}"]`;
        return `cy.get(${qS(css)})`;
      }
      case 'role': {
        const [role, name] = String(result.selector).split('|');
        return name ? `cy.contains(${qS(name)})` : `cy.contains(${qS(role)})`;
      }
      case 'relative': {
        const [anchor, tag] = String(result.selector).split('|');
        return `cy.contains(${qS(anchor)}).find(${qS(tag || '*')})`;
      }
      default:
        return `cy.get(${qS(result.selector)})`;
    }
  }
}