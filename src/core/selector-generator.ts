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
    
    // 1. MÁXIMA PRIORIDAD: data-test (SauceDemo y muchas apps usan esto)
    if (elementInfo.attributes['data-test']) {
      return {
        selector: `[data-test="${elementInfo.attributes['data-test']}"]`,
        confidence: 95,
        type: 'data-test'
      };
    }
    
    // 2. SEGUNDA PRIORIDAD: data-testid (React Testing Library estándar)
    if (elementInfo.attributes['data-testid']) {
      return {
        selector: `[data-testid="${elementInfo.attributes['data-testid']}"]`,
        confidence: 95,
        type: 'data-testid'
      };
    }
    
    // 3. TERCERA PRIORIDAD: data-cy (Cypress estándar)
    if (elementInfo.attributes['data-cy']) {
      return {
        selector: `[data-cy="${elementInfo.attributes['data-cy']}"]`,
        confidence: 90,
        type: 'data-cy'
      };
    }
    
    // 4. CUARTA PRIORIDAD: aria-label (accessibility + testing)
    if (elementInfo.attributes['aria-label']) {
      return {
        selector: `[aria-label="${elementInfo.attributes['aria-label']}"]`,
        confidence: 85,
        type: 'aria-label'
      };
    }
    
    // 5. QUINTA PRIORIDAD: role attribute (semántico)
    if (elementInfo.attributes['role']) {
      return {
        selector: `[role="${elementInfo.attributes['role']}"]`,
        confidence: 80,
        type: 'role'
      };
    }
    
    // 6. SEXTA PRIORIDAD: name attribute (forms)
    if (elementInfo.attributes['name']) {
      return {
        selector: `[name="${elementInfo.attributes['name']}"]`,
        confidence: 75,
        type: 'name'
      };
    }
    
    // 7. SÉPTIMA PRIORIDAD: ID único (styling dependent)
    if (elementInfo.id && elementInfo.id.trim()) {
      return {
        selector: `#${elementInfo.id}`,
        confidence: 70,
        type: 'id'
      };
    }
    
    // 8. OCTAVA PRIORIDAD: texto específico (si es corto y único)
    if (elementInfo.textContent && elementInfo.textContent.length < 50 && elementInfo.textContent.trim()) {
      return {
        selector: `text="${elementInfo.textContent.trim()}"`,
        confidence: 60,
        type: 'text'
      };
    }
    
    // 9. NOVENA PRIORIDAD: placeholder attribute (inputs)
    if (elementInfo.attributes['placeholder']) {
      return {
        selector: `[placeholder="${elementInfo.attributes['placeholder']}"]`,
        confidence: 55,
        type: 'placeholder'
      };
    }
    
    // 10. Fallback: CSS selector por clase (menos confiable)
    if (elementInfo.className && elementInfo.className.trim()) {
      const classes = elementInfo.className.split(' ').filter(c => c.trim()).join('.');
      return {
        selector: `.${classes}`,
        confidence: 40,
        type: 'css-class'
      };
    }
    
    // 11. Último recurso: selector por tag (muy poco confiable)
    return {
      selector: elementInfo.tagName,
      confidence: 20,
      type: 'tag'
    };
  }
}