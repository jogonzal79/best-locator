import { ElementInfo } from '../../types/index.js';

export class AriaCalculator {
  // Mapa de roles implícitos basado en la etiqueta del elemento
  private implicitRoles: Record<string, string> = {
    'a': 'link',
    'button': 'button',
    'select': 'combobox',
    'textarea': 'textbox',
    'nav': 'navigation',
    'main': 'main',
    'header': 'banner',
    'footer': 'contentinfo',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading'
  };

  // Mapa de roles para los diferentes tipos de <input>
  private inputRoles: Record<string, string> = {
    'button': 'button',
    'checkbox': 'checkbox',
    'radio': 'radio',
    'submit': 'button',
    'reset': 'button',
    'search': 'searchbox',
    'email': 'textbox',
    'tel': 'textbox',
    'text': 'textbox',
    'password': 'textbox',
    'url': 'textbox'
  };

  public computeRole(element: ElementInfo): string | null {
    // 1. Un rol explícito siempre tiene prioridad
    if (element.attributes.role) {
      return element.attributes.role;
    }

    const tagName = element.tagName.toLowerCase();

    // 2. Casos especiales importantes
    if (tagName === 'a' && !element.attributes.href) {
      return null; // Un <a> sin href no tiene rol de link
    }
    if (tagName === 'img' && !element.attributes.alt) {
      return 'presentation'; // Un <img> sin alt es decorativo
    }

    // 3. Roles de inputs
    if (tagName === 'input' && element.attributes.type) {
      return this.inputRoles[element.attributes.type] || 'textbox';
    }

    // 4. Roles implícitos de otras etiquetas
    return this.implicitRoles[tagName] || null;
  }

  public computeAccessibleName(element: ElementInfo): string | null {
    const { attributes, textContent } = element;

    // Implementación pragmática de la jerarquía de nombres accesibles
    // 1. aria-label tiene alta prioridad
    if (attributes['aria-label']) {
      return attributes['aria-label'].trim();
    }

    // 2. El contenido de texto es la siguiente mejor opción
    const cleanText = textContent?.trim();
    if (cleanText) {
      return cleanText;
    }

    // 3. Placeholder y otros atributos como fallback
    if (attributes['placeholder']) {
      return attributes['placeholder'].trim();
    }
    if (attributes['alt']) {
      return attributes['alt'].trim();
    }
    if (attributes['title']) {
      return attributes['title'].trim();
    }

    return null;
  }
}