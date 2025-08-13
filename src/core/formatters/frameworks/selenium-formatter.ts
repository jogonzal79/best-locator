// src/core/formatters/frameworks/selenium-formatter.ts
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

const qD = (s: string) => `"${String(s).replace(/"/g, `\\"`)}"`;

/** Devuelve un literal XPath seguro:
 * - "hola"  -> 'hola'
 * - 'hola'  -> "hola"
 * - 'a"b'c' -> concat('a"b', "'", 'c')
 */
function xpLiteral(s: string): string {
  const str = String(s);
  if (!str.includes(`'`)) return `'${str}'`;
  if (!str.includes(`"`)) return `"${str}"`;
  // contiene ambas comillas -> usar concat con " y ' como tokens
  const parts = str.split(`'`).map(p => `'${p}'`);
  // intercalar comillas simples como tokens "'"
  return `concat(${parts.join(`, "'", `)})`;
}

/** Parseo tolerante de "role|name" o "role[name='...']" */
function parseRole(selector: string): { role?: string; name?: string } {
  const s = String(selector ?? '').trim();
  if (!s) return {};
  if (s.includes('|')) {
    const [r, n] = s.split('|', 2);
    return { role: r?.trim(), name: n?.trim() };
  }
  const m = s.match(/^(\w+)\[name=['"]([^'"]+)['"]\]$/);
  if (m) return { role: m[1], name: m[2] };
  return { role: s };
}

export class SeleniumFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, language: Language): string {
    const isPython = language === 'python';
    const isJava = language === 'java';
    const isCSharp = language === 'csharp';

    // Mapeo consistente de estrategias por lenguaje
    const findElement = (by: 'css' | 'xpath' | 'id' | 'name', value: string): string => {
      if (isPython) {
        const PY = by === 'css' ? 'CSS_SELECTOR' : by.toUpperCase(); // CSS_SELECTOR, XPATH, ID, NAME
        return `driver.find_element(By.${PY}, ${qD(value)})`;
      } else if (isJava) {
        const method = by === 'css' ? 'cssSelector' : by; // cssSelector, xpath, id, name
        return `driver.findElement(By.${method}(${qD(value)}))`;
      } else if (isCSharp) {
        const method = by === 'css' ? 'CssSelector' : (by === 'xpath' ? 'XPath' : by.charAt(0).toUpperCase() + by.slice(1));
        return `driver.FindElement(By.${method}(${qD(value)}))`;
      }
      // JS/TS (selenium-webdriver): By.css, By.xpath, By.id, By.name
      const method = by === 'css' ? 'css' : by;
      return `driver.findElement(By.${method}(${qD(value)}))`;
    };

    switch (result.type) {
      case 'css':
        return findElement('css', result.selector);

      case 'xpath':
        return findElement('xpath', result.selector);

      case 'id':
        return findElement('id', result.selector);

      case 'test-id': {
        const css = `[data-testid="${result.selector}"]`;
        return findElement('css', css);
      }

      case 'link-href': {
        const css = `a[href*="${result.selector}"]`;
        return findElement('css', css);
      }

      case 'text': {
        // Texto visible exacto, normalizado
        const lit = xpLiteral(result.selector);
        const xp = `//*[normalize-space(.)=${lit}]`;
        return findElement('xpath', xp);
      }

      case 'role': {
        const { role, name } = parseRole(result.selector);

        // Caso PRO: role|name -> XPath robusto:
        //  - Coincide por @role="..." (si existe)
        //  - También cubrimos semánticos comunes (button/link/textbox)
        //  - Nombre por @aria-label, @value, @title o texto normalizado
        if (role && name) {
          const r = xpLiteral(role);
          const n = xpLiteral(name);

          // Añadimos equivalentes semánticos seguros para algunos roles comunes
          let semanticOr = '';
          switch (role.toLowerCase()) {
            case 'button':
              semanticOr = ` or self::button or (self::input and (@type='submit' or @type='button'))`;
              break;
            case 'link':
              semanticOr = ` or self::a`;
              break;
            case 'textbox':
              semanticOr = ` or self::input or self::textarea`;
              break;
            default:
              // para otros roles mantenemos solo @role
              break;
          }

          const xp =
            `//*[(@role=${r}${semanticOr}) and ` +
            `(@aria-label=${n} or @value=${n} or @title=${n} or normalize-space(.)=${n})]`;

          return findElement('xpath', xp);
        }

        // Solo role (sin nombre): buscar por @role (y semánticos básicos)
        if (role) {
          const r = xpLiteral(role);
          let xp = `//*[@role=${r}]`;
          switch (role.toLowerCase()) {
            case 'button':
              xp = `//*[@role=${r} or self::button or (self::input and (@type='submit' or @type='button'))]`;
              break;
            case 'link':
              xp = `//*[@role=${r} or self::a]`;
              break;
            case 'textbox':
              xp = `//*[@role=${r} or self::input or self::textarea]`;
              break;
          }
          return findElement('xpath', xp);
        }

        // Fallback conservador
        return findElement('css', result.selector);
      }

      case 'relative':
      default:
        return findElement('css', result.selector);
    }
  }
}
