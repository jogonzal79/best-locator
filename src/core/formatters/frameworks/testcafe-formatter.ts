// src/core/formatters/frameworks/testcafe-formatter.ts - VERSIÓN ROBUSTA
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

// Escapa comillas simples para incrustar en template literal con comillas simples
const qS = (s: string) => `'${String(s).replace(/'/g, `\\'`)}'`;

// Escapa comillas dobles para valores de atributos CSS (href, placeholder, etc.)
const attrEsc = (s: string) => String(s).replace(/"/g, '\\"');

export class TestCafeFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, _language: Language): string {
    // NOTA: TestCafe usa la misma sintaxis para JS/TS; _language no afecta

    switch (result.type) {
      case 'test-id': {
        const v = attrEsc(result.selector);
        return `Selector(${qS(`[data-testid="${v}"]`)})`;
      }

      case 'role': {
        // Manejo tolerante de formatos "role|name" y "role[name='...']"
        const [roleRaw, name] = this.parseRoleSelector(result.selector);
        const role = roleRaw?.trim();

        // Con nombre visible (preferido: tag válido + texto)
        if (name) {
          if (role && this.isValidHTMLTag(role)) {
            return `Selector(${qS(role)}).withText(${qS(name)})`;
          }
          // Si no es un tag HTML válido, intentamos atributo ARIA role
          if (role) {
            const v = attrEsc(role);
            return `Selector(${qS(`[role="${v}"]`)}).withText(${qS(name)})`;
          }
          // Fallback conservador (evita '*')
          return `Selector(${qS('body *')}).withText(${qS(name)})`;
        }

        // Sin nombre (solo role)
        if (role && this.isValidHTMLTag(role)) {
          return `Selector(${qS(role)})`;
        }
        if (role) {
          const v = attrEsc(role);
          return `Selector(${qS(`[role="${v}"]`)})`;
        }
        // Último recurso
        return `Selector(${qS('body *')})`;
      }

      case 'text': {
        // Usar tagName si viene en el resultado y es un tag válido
        const tagName = (result as any).tagName as string | undefined;
        if (tagName && this.isValidHTMLTag(tagName)) {
          return `Selector(${qS(tagName)}).withText(${qS(result.selector)})`;
        }
        // Fallback más acotado que '*'
        return `Selector(${qS('body *')}).withText(${qS(result.selector)})`;
      }

      case 'placeholder': {
        // Buscar inputs y textareas con ese placeholder
        const v = attrEsc(result.selector);
        return `Selector(${qS(`input[placeholder="${v}"], textarea[placeholder="${v}"]`)})`;
      }

      case 'link-href': {
        const v = attrEsc(result.selector);
        const css = `a[href*="${v}"]`;
        return `Selector(${qS(css)})`;
      }

      case 'css':
        return `Selector(${qS(result.selector)})`;

      case 'id': {
        // Más robusto que #id (evita problemas con IDs que requieren escape)
        const v = attrEsc(result.selector);
        return `Selector(${qS(`[id="${v}"]`)})`;
      }

      case 'xpath': {
        // TestCafe no soporta XPath nativamente. Devolvemos una pista útil.
        const truncated = String(result.selector).slice(0, 180).replace(/\n/g, ' ');
        return `/* XPath no soportado por TestCafe: ${truncated} */\nSelector(${qS('body *')})`;
      }

      default:
        return `Selector(${qS(result.selector)})`;
    }
  }

  /**
   * Parseo tolerante para selectores de role:
   * - "button|Login"
   * - "button[name='Login']"
   * - "button"
   */
  private parseRoleSelector(selector: string): [string, string?] {
    if (!selector) return ['', undefined];

    // Formato correcto "role|name"
    if (selector.includes('|')) {
      const [role, name] = selector.split('|', 2);
      return [role.trim(), name?.trim()];
    }

    // Formato malformado "role[name='...']" o "role[name="..."]"
    const malformedMatch = selector.match(/^(\w+)\[name=['"]([^'"]*)['"]\]$/);
    if (malformedMatch) {
      return [malformedMatch[1], malformedMatch[2]];
    }

    // Solo role
    return [selector.trim()];
  }

  /**
   * Validación básica de tags HTML comunes para evitar falsos positivos.
   * (Puedes mover esto a config y ampliarlo según tu caso de uso)
   */
  private isValidHTMLTag(tag: string): boolean {
    if (!tag) return false;
    const t = tag.toLowerCase();

    // Conjunto ampliado de tags comunes (HTML + algunos semánticos)
    const validTags = new Set([
      // Text / headings
      'p', 'span', 'strong', 'em', 'small', 'mark', 'time', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Links & media
      'a', 'img', 'picture', 'source', 'video', 'audio', 'track',
      // Forms
      'form', 'label', 'input', 'select', 'textarea', 'button', 'fieldset', 'legend', 'datalist', 'optgroup', 'option',
      // Lists
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      // Tables
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col',
      // Sections & layout
      'div', 'section', 'article', 'aside', 'main', 'nav', 'header', 'footer', 'summary', 'details',
      // Misc
      'svg', 'path', 'canvas', 'figure', 'figcaption', 'blockquote', 'hr', 'br'
    ]);

    return validTags.has(t);
  }
}
