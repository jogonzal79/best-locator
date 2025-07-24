import { ElementInfo } from '../../types/index.js';

export class AriaCalculator {
  private implicitRoles: Record<string, string> = {
    'a': 'link', 'button': 'button', 'select': 'combobox', 'textarea': 'textbox',
    'nav': 'navigation', 'main': 'main', 'header': 'banner', 'footer': 'contentinfo',
    'h1': 'heading', 'h2': 'heading', 'h3': 'heading', 'h4': 'heading', 'h5': 'heading', 'h6': 'heading'
  };

  private inputRoles: Record<string, string> = {
    'button': 'button', 'checkbox': 'checkbox', 'radio': 'radio', 'submit': 'button',
    'reset': 'button', 'search': 'searchbox', 'email': 'textbox', 'tel': 'textbox',
    'text': 'textbox', 'password': 'textbox', 'url': 'textbox'
  };

  public computeRole(element: ElementInfo): string | null {
    if (element.attributes.role) {
      return element.attributes.role;
    }

    const tagName = element.tagName.toLowerCase();

    // --- MEJORAS SUGERIDAS INTEGRADAS ---
    if (tagName === 'a' && !element.attributes.href) {
      return null; // <a> sin href no tiene rol de link
    }
    if (tagName === 'img' && !element.attributes.alt) {
      return 'presentation'; // <img> sin alt es decorativa
    }
    // ------------------------------------

    if (tagName === 'input' && element.attributes.type) {
      return this.inputRoles[element.attributes.type] || 'textbox';
    }
    
    return this.implicitRoles[tagName] || null;
  }

  public computeAccessibleName(element: ElementInfo): string | null {
    const { attributes, textContent } = element;
    
    if (attributes['aria-label']) return attributes['aria-label'].trim();
    
    const cleanText = textContent?.trim();
    if (cleanText) return cleanText;

    if (attributes['placeholder']) return attributes['placeholder'].trim();
    if (attributes['alt']) return attributes['alt'].trim();
    if (attributes['title']) return attributes['title'].trim();
    
    return null;
  }
}