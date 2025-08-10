// src/core/formatters/frameworks/webdriverio-formatter.ts
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

const qS = (s: string) => `'${String(s).replace(/'/g, `\\'`)}'`;

export class WebdriverIOFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, _language: Language): string {
    // WebdriverIO usa la misma sintaxis para TypeScript y JavaScript.
    
    switch (result.type) {
      case 'test-id':
        return `await browser.$(${qS(`[data-testid="${result.selector}"]`)})`;
      
      case 'role': {
        const [role, name] = String(result.selector).split('|');
        // WebdriverIO tiene un selector de ARIA muy potente.
        if (name) {
          return `await browser.$(${qS(`${role}[name="${name}"]`)})`;
        }
        return `await browser.$(${qS(role)})`;
      }
        
      case 'text':
        // Selector de texto parcial, es el más común y robusto.
        return `await browser.$(${qS(`*=${result.selector}`)})`;

      case 'placeholder':
        return `await browser.$(${qS(`[placeholder="${result.selector}"]`)})`;

      case 'link-href': {
        // Combina un selector de CSS con la búsqueda de texto parcial del enlace.
        return `await browser.$(${qS(`a[href*="${result.selector}"]`)})`;
      }
        
      case 'css':
        return `await browser.$(${qS(result.selector)})`;

      case 'id':
          return `await browser.$(${qS(`#${result.selector}`)})`;

      case 'xpath':
        return `await browser.$(${qS(result.selector)})`;

      default:
        return `await browser.$(${qS(result.selector)})`;
    }
  }
}