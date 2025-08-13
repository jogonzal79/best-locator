// src/core/generators/web/testcafe-generator.ts
import { BaseWebGenerator } from '../base-generator.js';
import { SelectorResult } from '../../../types/index.js';

export class TestCafeGenerator extends BaseWebGenerator {
  
  getPriorityOrder(): string[] {
    // TestCafe uses Selector chains
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
    return 65;
  }
  
  optimizeForFramework(result: SelectorResult): SelectorResult {
    // TestCafe doesn't support XPath
    if (result.type === 'xpath') {
      // Try to convert to CSS if possible
      if (result.selector.includes('[@id=')) {
        const idMatch = result.selector.match(/\[@id="([^"]+)"\]/);
        if (idMatch) {
          return {
            ...result,
            type: 'id',
            selector: idMatch[1],
            confidence: result.confidence - 10,
            reasoning: 'TestCafe doesn\'t support XPath, converted to ID'
          };
        }
      }
      
      // Generic fallback for XPath
      return {
        ...result,
        type: 'css',
        selector: 'body *', // Very generic, will need withText()
        confidence: 30,
        reasoning: 'TestCafe doesn\'t support XPath, fallback to generic'
      };
    }
    
    // Convert role to element + text
    if (result.type === 'role') {
      const [role, name] = result.selector.split('|');
      
      // Map ARIA roles to HTML elements for TestCafe
      const roleToElement: Record<string, string> = {
        'button': 'button',
        'link': 'a',
        'textbox': 'input',
        'checkbox': 'input[type="checkbox"]',
        'radio': 'input[type="radio"]',
        'combobox': 'select',
        'navigation': 'nav',
        'main': 'main',
        'heading': 'h1, h2, h3, h4, h5, h6'
      };
      
      const element = roleToElement[role] || `[role="${role}"]`;
      
      if (name) {
        return {
          ...result,
          type: 'text',
          selector: name,
          tagName: element,
          confidence: result.confidence - 5,
          reasoning: 'TestCafe uses element.withText() for role+name'
        };
      }
      
      return {
        ...result,
        type: 'css',
        selector: element,
        confidence: result.confidence - 10,
        reasoning: 'TestCafe uses CSS selector for roles'
      };
    }
    
    // TestCafe prefers test-id as CSS selector
    if (result.type === 'test-id') {
      return {
        ...result,
        type: 'css',
        selector: `[data-testid="${result.selector}"]`,
        confidence: result.confidence,
        reasoning: 'TestCafe uses CSS for test-id'
      };
    }
    
    return result;
  }
}