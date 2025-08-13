// src/core/formatters/frameworks/testcafe-formatter.ts
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

const qS = (s: string) => `'${String(s).replace(/'/g, `\\'`)}'`;
const attrEsc = (s: string) => String(s).replace(/"/g, '\\"');

export class TestCafeFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, _language: Language): string {
    switch (result.type) {
      case 'test-id': {
        const v = attrEsc(result.selector);
        return `Selector(${qS(`[data-testid="${v}"]`)})`;
      }

      case 'role': {
        const [roleRaw, name] = this.parseRoleSelector(result.selector);
        const role = roleRaw?.trim();

        if (name) {
          if (role && this.isValidHTMLTag(role)) {
            return `Selector(${qS(role)}).withText(${qS(name)})`;
          }
          if (role) {
            const v = attrEsc(role);
            return `Selector(${qS(`[role="${v}"]`)}).withText(${qS(name)})`;
          }
          return `Selector(${qS('body *')}).withText(${qS(name)})`;
        }

        if (role && this.isValidHTMLTag(role)) {
          return `Selector(${qS(role)})`;
        }
        if (role) {
          const v = attrEsc(role);
          return `Selector(${qS(`[role="${v}"]`)})`;
        }
        return `Selector(${qS('body *')})`;
      }

      case 'text': {
        const tagName = (result as any).tagName as string | undefined;
        if (tagName && this.isValidHTMLTag(tagName)) {
          return `Selector(${qS(tagName)}).withText(${qS(result.selector)})`;
        }
        return `Selector(${qS('body *')}).withText(${qS(result.selector)})`;
      }

      case 'placeholder': {
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
        const v = attrEsc(result.selector);
        return `Selector(${qS(`[id="${v}"]`)})`;
      }

      case 'xpath': {
        const truncated = String(result.selector).slice(0, 180).replace(/\n/g, ' ');
        return `/* XPath no soportado por TestCafe: ${truncated} */\nSelector(${qS('body *')})`;
      }

      default:
        return `Selector(${qS(result.selector)})`;
    }
  }

  private parseRoleSelector(selector: string): [string, string?] {
    if (!selector) return ['', undefined];
    if (selector.includes('|')) {
      const [role, name] = selector.split('|', 2);
      return [role.trim(), name?.trim()];
    }
    const malformedMatch = selector.match(/^(\w+)\[name=['"]([^'"]*)['"]\]$/);
    if (malformedMatch) {
      return [malformedMatch[1], malformedMatch[2]];
    }
    return [selector.trim()];
  }

  private isValidHTMLTag(tag: string): boolean {
    if (!tag) return false;
    const t = tag.toLowerCase();
    const validTags = new Set([
      'p','span','strong','em','small','mark','time','code','pre',
      'h1','h2','h3','h4','h5','h6',
      'a','img','picture','source','video','audio','track',
      'form','label','input','select','textarea','button','fieldset','legend','datalist','optgroup','option',
      'ul','ol','li','dl','dt','dd',
      'table','thead','tbody','tfoot','tr','td','th','caption','colgroup','col',
      'div','section','article','aside','main','nav','header','footer','summary','details',
      'svg','path','canvas','figure','figcaption','blockquote','hr','br'
    ]);
    return validTags.has(t);
  }

  formatMobile?(..._args: any[]): string {
    return '';
  }
}
