// src/core/generators/web/webdriverio-generator.ts

import { BaseWebGenerator } from '../base-generator.js';
import { SelectorResult } from '../../../types/index.js';

export class WebdriverIOGenerator extends BaseWebGenerator {
  
  getPriorityOrder(): string[] {
    return [
      'test-id',       // data-testid, data-cy, etc.
      'stable-id',     // id “humano” (incluye ASP.NET c/underscore)
      'aria-role',     // role + accessibleName
      'form-attrs',    // name / label[for]
      'semantic-attrs',// aria-label, type específicos
      'placeholder',   // placeholders cortos
      'link-href',     // a[href*="..."]
      'stable-css',    // clases “semánticas”
      'text',          // último recurso
    ];
  }
  
  getMinConfidenceThreshold(): number {
    return 50;
  }
  
  optimizeForFramework(result: SelectorResult): SelectorResult {
    // WebdriverIO usa sintaxis CSS/jQuery-like
    
    // Convertir ID a #id
    if (result.type === 'id') {
      return {
        ...result,
        type: 'css',
        selector: `#${result.selector}`,
        confidence: result.confidence,
        reasoning: 'WebdriverIO uses CSS syntax for IDs'
      };
    }
    
    // Convertir test-id a CSS
    if (result.type === 'test-id') {
      return {
        ...result,
        type: 'css',
        selector: `[data-testid="${result.selector}"]`,
        confidence: result.confidence,
        reasoning: 'WebdriverIO uses CSS for data attributes'
      };
    }
    
    // Convertir role a texto parcial (más práctico)
    if (result.type === 'role') {
      const [role, name] = result.selector.split('|');
      if (name) {
        return {
          ...result,
          type: 'text',
          selector: name,
          confidence: result.confidence,
          reasoning: 'WebdriverIO uses partial text match'
        };
      }
    }
    
    // Para CSS genéricos, intentar mejorar
    if (result.type === 'css' && result.selector.includes('.form-control')) {
      return {
        ...result,
        confidence: Math.max(result.confidence - 15, 35),
        reasoning: 'Generic class (consider adding more specificity)'
      };
    }
    
    return result;
  }
}