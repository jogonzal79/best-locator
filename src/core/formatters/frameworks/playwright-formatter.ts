// src/core/formatters/frameworks/playwright-formatter.ts
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

const qJS = (s: string) => `'${String(s).replace(/'/g, `\\'`)}'`;
const qPY = (s: string) => `"${String(s).replace(/"/g, `\\"`)}"`;

function q(lang: Language, s: string) {
  return lang === 'python' ? qPY(s) : qJS(s);
}

function prefix(framework: WebFramework, language: Language) {
  // En Playwright JS/TS solemos devolver con await; en Python no
  const isPy = language === 'python';
  return isPy ? '' : 'await ';
}

export class PlaywrightFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, language: Language): string {
    const pre = prefix('playwright', language);
    const isPy = language === 'python';

    const getByRole = (role: string, name?: string) => {
      if (isPy) {
        return name
          ? `page.get_by_role(${q(language, role)}, name=${q(language, name)})`
          : `page.get_by_role(${q(language, role)})`;
      }
      return name
        ? `${pre}page.getByRole(${q(language, role)}, { name: ${q(language, name)} })`
        : `${pre}page.getByRole(${q(language, role)})`;
    };

    switch (result.type) {
      case 'test-id': {
        return isPy
          ? `page.get_by_test_id(${q(language, result.selector)})`
          : `${pre}page.getByTestId(${q(language, result.selector)})`;
      }

      case 'role': {
        // formatos admitidos: "button|Login" o "button[name='Login']"
        const s = String(result.selector);
        let role = '';
        let name: string | undefined;
        if (s.includes('|')) {
          const [r, n] = s.split('|', 2);
          role = r.trim();
          name = n?.trim();
        } else {
          const m = s.match(/^(\w+)\[name=['"]([^'"]*)['"]\]$/);
          if (m) {
            role = m[1];
            name = m[2];
          } else {
            role = s.trim();
          }
        }
        return getByRole(role, name);
      }

      case 'text': {
        return isPy
          ? `page.get_by_text(${q(language, result.selector)})`
          : `${pre}page.getByText(${q(language, result.selector)})`;
      }

      case 'placeholder': {
        return isPy
          ? `page.get_by_placeholder(${q(language, result.selector)})`
          : `${pre}page.getByPlaceholder(${q(language, result.selector)})`;
      }

      case 'link-href': {
        const css = `a[href*="${String(result.selector).replace(/"/g, '\\"')}"]`;
        return `${pre}page.locator(${q(language, css)})`;
      }

      case 'css':
        return `${pre}page.locator(${q(language, result.selector)})`;

      case 'id':
        return `${pre}page.locator(${q(language, `#${result.selector}`)})`;

      case 'xpath':
        // Playwright soporta "xpath=..."
        return `${pre}page.locator(${q(language, `xpath=${result.selector}`)})`;

      default:
        return `${pre}page.locator(${q(language, result.selector)})`;
    }
  }
}
