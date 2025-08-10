// src/core/formatters/frameworks/testcafe-formatter.ts
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

// Helper para escapar comillas simples
const qS = (s: string) => `'${String(s).replace(/'/g, `\\'`)}'`;

export class TestCafeFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, _language: Language): string {
    
    // TestCafe usa la misma sintaxis para todos los lenguajes (JS/TS)
    // por lo que no necesitamos diferenciar por lenguaje aquí.

    switch (result.type) {
      case 'test-id':
        return `Selector(${qS(`[data-testid="${result.selector}"]`)})`;
      
      case 'role': {
        const [role, name] = String(result.selector).split('|');
        if (name) {
          // Combina rol (como tag) y texto visible para mayor robustez
          return `Selector(${qS(role)}).withText(${qS(name)})`;
        }
        // Si no hay nombre, usa un selector de CSS simple para el rol/tag
        return `Selector(${qS(role)})`;
      }
        
      case 'text':
        // --- CAMBIO CLAVE: Usar tagName si está disponible ---
        // Si el resultado incluye una etiqueta (tagName), la usamos para mayor especificidad.
        if ((result as any).tagName) {
          return `Selector(${qS((result as any).tagName)}).withText(${qS(result.selector)})`;
        }
        // Si no hay tagName, mantenemos el comportamiento anterior como fallback.
        return `Selector('*').withText(${qS(result.selector)})`;

      case 'placeholder':
        return `Selector(${qS(`[placeholder="${result.selector}"]`)})`;

      case 'link-href': {
        const css = `a[href*="${result.selector}"]`;
        return `Selector(${qS(css)})`;
      }
        
      case 'css':
        return `Selector(${qS(result.selector)})`;

      case 'id':
          return `Selector(${qS(`#${result.selector}`)})`;

      // TestCafe no soporta XPath de forma nativa, así que lo convertimos a CSS si es posible
      // o usamos un selector genérico como fallback.
      case 'xpath':
        return `Selector(${qS(result.selector)})`; // Fallback a CSS si es un XPath simple

      default:
        return `Selector(${qS(result.selector)})`;
    }
  }
}