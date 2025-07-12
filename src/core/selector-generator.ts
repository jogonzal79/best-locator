// src/core/selector-generator.ts

interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  attributes: { [key: string]: string };
}

interface SelectorResult {
  selector: string;
  confidence: number;
  type: string;
}

export class SelectorGenerator {
  
  generateSelector(elementInfo: ElementInfo): SelectorResult {
    console.log('🔍 Generating selector for:', elementInfo);
    
    // 1. Buscar data-testid (máxima prioridad)
    if (elementInfo.attributes['data-testid']) {
      return {
        selector: `[data-testid="${elementInfo.attributes['data-testid']}"]`,
        confidence: 95,
        type: 'data-testid'
      };
    }
    
    // 2. Buscar data-cy
    if (elementInfo.attributes['data-cy']) {
      return {
        selector: `[data-cy="${elementInfo.attributes['data-cy']}"]`,
        confidence: 90,
        type: 'data-cy'
      };
    }
    
    // 3. Buscar ID único
    if (elementInfo.id && elementInfo.id.trim()) {
      return {
        selector: `#${elementInfo.id}`,
        confidence: 85,
        type: 'id'
      };
    }
    
    // 4. Buscar por texto (si es corto y específico)
    if (elementInfo.textContent && elementInfo.textContent.length < 50 && elementInfo.textContent.trim()) {
      return {
        selector: `text="${elementInfo.textContent.trim()}"`,
        confidence: 70,
        type: 'text'
      };
    }
    
    // 5. Fallback: CSS selector por clase
    if (elementInfo.className && elementInfo.className.trim()) {
      const classes = elementInfo.className.split(' ').filter(c => c.trim()).join('.');
      return {
        selector: `.${classes}`,
        confidence: 50,
        type: 'css-class'
      };
    }
    
    // 6. Último recurso: selector por tag
    return {
      selector: elementInfo.tagName,
      confidence: 30,
      type: 'tag'
    };
  }
}