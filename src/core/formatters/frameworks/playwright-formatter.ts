// src/core/formatters/frameworks/playwright-formatter.ts
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

const qS = (s: string) => `'${String(s).replace(/'/g, `\\'`)}'`;
const qD = (s: string) => `"${String(s).replace(/"/g, `\\"`)}"`;

export class PlaywrightFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, language: Language): string {
    const isPython = language === 'python';
    const isJava = language === 'java';
    const isCSharp = language === 'csharp';
    const isTypeScript = language === 'typescript' || language === 'javascript';

    // Helper para generar el formato correcto según el lenguaje
    const emit = {
      testId: (v: string) => {
        if (isPython) return `page.get_by_test_id(${qD(v)})`;
        if (isJava) return `page.getByTestId(${qD(v)})`;
        if (isCSharp) return `Page.GetByTestId(${qD(v)})`;
        return `await page.getByTestId(${qS(v)})`;
      },
      altText: (v: string) => {
        if (isPython) return `page.get_by_alt_text(${qD(v)})`;
        if (isJava) return `page.getByAltText(${qD(v)})`;
        if (isCSharp) return `Page.GetByAltText(${qD(v)})`;
        return `await page.getByAltText(${qS(v)})`;
      },
      role: (role: string, name?: string) => {
        if (isPython) {
          return name ? `page.get_by_role(${qD(role)}, name=${qD(name)})` : `page.get_by_role(${qD(role)})`;
        }
        if (isJava) {
          return name ? `page.getByRole(${qD(role)}, new Page.GetByRoleOptions().setName(${qD(name)}))` : `page.getByRole(${qD(role)})`;
        }
        if (isCSharp) {
          return name ? `Page.GetByRole(AriaRole.${role.charAt(0).toUpperCase() + role.slice(1)}, new() { Name = ${qD(name)} })` : `Page.GetByRole(AriaRole.${role.charAt(0).toUpperCase() + role.slice(1)})`;
        }
        return name ? `await page.getByRole(${qS(role)}, { name: ${qS(name)} })` : `await page.getByRole(${qS(role)})`;
      },
      text: (v: string) => {
        if (isPython) return `page.get_by_text(${qD(v)})`;
        if (isJava) return `page.getByText(${qD(v)})`;
        if (isCSharp) return `Page.GetByText(${qD(v)})`;
        return `await page.getByText(${qS(v)})`;
      },
      linkHref: (frag: string) => {
        const css = `a[href*="${frag}"]`;
        if (isPython) return `page.locator(${qD(css)})`;
        if (isJava) return `page.locator(${qD(css)})`;
        if (isCSharp) return `Page.Locator(${qD(css)})`;
        return `await page.locator(${qS(css)})`;
      },
      css: (css: string) => {
        if (isPython) return `page.locator(${qD(css)})`;
        if (isJava) return `page.locator(${qD(css)})`;
        if (isCSharp) return `Page.Locator(${qD(css)})`;
        return `await page.locator(${qS(css)})`;
      },
      xpath: (xp: string) => {
        const loc = `xpath=${xp}`;
        if (isPython) return `page.locator(${qD(loc)})`;
        if (isJava) return `page.locator(${qD(loc)})`;
        if (isCSharp) return `Page.Locator(${qD(loc)})`;
        return `await page.locator(${qS(loc)})`;
      },
      relative: (anchor: string, tag?: string) => {
        if (isPython) {
          const base = `page.get_by_text(${qD(anchor)})`;
          const loc = `.locator(${qD(tag || '*')})`;
          return `${base}${loc}`;
        }
        if (isJava) {
          const base = `page.getByText(${qD(anchor)})`;
          const loc = `.locator(${qD(tag || '*')})`;
          return `${base}${loc}`;
        }
        if (isCSharp) {
          const base = `Page.GetByText(${qD(anchor)})`;
          const loc = `.Locator(${qD(tag || '*')})`;
          return `${base}${loc}`;
        }
        const base = `await page.getByText(${qS(anchor)})`;
        const loc = `.locator(${qS(tag || '*')})`;
        return `${base}${loc}`;
      }
    };

    // Corrección de formatos malformados tipo "button[name='Login']"
    const normalizeRole = (sel: string): { role?: string; name?: string } | null => {
      // Formato incorrecto: "button[name='Login']"
      const m = sel.match(/^\s*([a-zA-Z]+)\s*\[\s*name\s*=\s*(['"])(.*?)\2\s*]\s*$/);
      if (m) return { role: m[1], name: m[3] };
      
      // Formato clave=valor
      const kvPairs = sel.split(',').map(p => p.trim());
      const kv: Record<string, string> = {};
      kvPairs.forEach(pair => {
        const [key, value] = pair.split('=').map(x => x.trim());
        if (key && value) kv[key] = value.replace(/['"]/g, '');
      });
      if (kv.role) return { role: kv.role, name: kv.name };
      
      return null;
    };

    switch (result.type) {
      case 'test-id': 
        return emit.testId(result.selector);
      case 'alt-text': 
        return emit.altText(result.selector);
      case 'role': {
        const sel = String(result.selector);
        
        // Primero intentamos detectar formato malformado
        const fixed = sel.includes('|') ? null : normalizeRole(sel);
        if (fixed?.role) return emit.role(fixed.role, fixed.name);
        
        // Formato correcto con pipe
        const [role, name] = sel.split('|');
        return emit.role(role, name);
      }
      case 'text': 
        return emit.text(result.selector);
      case 'link-href': 
        return emit.linkHref(result.selector);
      case 'css': 
        return emit.css(result.selector);
      case 'xpath': 
        return emit.xpath(result.selector);
      case 'relative': {
        const [anchor, tag] = String(result.selector).split('|');
        return emit.relative(anchor, tag);
      }
      default:
        // Fallback genérico
        if (isPython) return `page.locator(${qD(result.selector)})`;
        if (isJava) return `page.locator(${qD(result.selector)})`;
        if (isCSharp) return `Page.Locator(${qD(result.selector)})`;
        return `await page.locator(${qS(result.selector)})`;
    }
  }
}