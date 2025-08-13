// src/core/formatters/frameworks/webdriverio-formatter.ts
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

const qS = (s: string) => `'${String(s).replace(/'/g, `\\'`)}'`;

function isHtmlTag(tag: string) {
  return /^(a|button|input|select|textarea|label|img|div|span|li|ul|ol|table|tr|td|th|section|nav|main|header|footer|p|h1|h2|h3|h4|h5|h6)$/i.test(tag);
}

export class WebdriverIOFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, _language: Language): string {
    switch (result.type) {
      case 'test-id':
        return `await browser.$(${qS(`[data-testid="${result.selector}"]`)})`;

      case 'role': {
        const raw = String(result.selector);
        let role = '';
        let name: string | undefined;

        if (raw.includes('|')) {
          const [r, n] = raw.split('|', 2);
          role = r.trim();
          name = n?.trim();
        } else {
          const m = raw.match(/^(\w+)\[name=['"]([^'"]*)['"]\]$/);
          if (m) { role = m[1]; name = m[2]; }
          else { role = raw.trim(); }
        }

        if (name) {
          if (isHtmlTag(role)) {
            // Lo que piden los tests
            return `await browser.$(${qS(`${role}[name="${name}"]`)})`;
          }
          // Si no parece tag, intentamos atributo ARIA + name
          return `await browser.$(${qS(`[role="${role}"][name="${name}"]`)})`;
        }
        // solo role
        return isHtmlTag(role)
          ? `await browser.$(${qS(role)})`
          : `await browser.$(${qS(`[role="${role}"]`)})`;
      }

      case 'text':
        // parcial por texto
        return `await browser.$(${qS(`*=${result.selector}`)})`;

      case 'placeholder':
        return `await browser.$(${qS(`[placeholder="${result.selector}"]`)})`;

      case 'link-href':
        return `await browser.$(${qS(`a[href*="${result.selector}"]`)})`;

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
