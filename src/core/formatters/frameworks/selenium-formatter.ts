// src/core/formatters/frameworks/selenium-formatter.ts
import { IFormatter, Language, WebFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

const qD = (s: string) => `"${String(s).replace(/"/g, `\\"`)}"`;

export class SeleniumFormatter implements IFormatter {
  format(result: SelectorResult, _framework: WebFramework, language: Language): string {
    const isPython = language === 'python';
    const isJava = language === 'java';
    const isCSharp = language === 'csharp';
    
    // Helper para generar el formato correcto según el lenguaje
    const findElement = (by: string, value: string): string => {
      if (isPython) {
        return `driver.find_element(By.${by}, ${qD(value)})`;
      } else if (isJava) {
        const methodName = by === 'CSS_SELECTOR' ? 'cssSelector' : by.toLowerCase();
        return `driver.findElement(By.${methodName}(${qD(value)}))`;
      } else if (isCSharp) {
        const methodName = by === 'CSS_SELECTOR' ? 'CssSelector' : by.charAt(0).toUpperCase() + by.slice(1).toLowerCase();
        return `driver.FindElement(By.${methodName}(${qD(value)}))`;
      }
      // Default TypeScript/JavaScript
      return `driver.findElement(By.${by.toLowerCase()}(${qD(value)}))`;
    };
    
    switch (result.type) {
      case 'css':
        return findElement('CSS_SELECTOR', result.selector);
      case 'xpath':
        return findElement('XPATH', result.selector);
      case 'test-id': {
        const css = `[data-testid="${result.selector}"]`;
        return findElement('CSS_SELECTOR', css);
      }
      case 'link-href': {
        const css = `a[href*="${result.selector}"]`;
        return findElement('CSS_SELECTOR', css);
      }
      case 'text': {
        const xpath = `//*[normalize-space(text())="${result.selector}"]`;
        return findElement('XPATH', xpath);
      }
      case 'role':
      case 'relative':
      default:
        return findElement('CSS_SELECTOR', result.selector);
    }
  }
}