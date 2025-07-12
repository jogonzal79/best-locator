// src/core/framework-formatter.ts

interface SelectorResult {
  selector: string;
  confidence: number;
  type: string;
}

export class FrameworkFormatter {
  
  format(selector: string, framework: string, language: string): string {
    const fw = framework.toLowerCase();
    const lang = language.toLowerCase();
    
    // Validar combinaciones framework + lenguaje
    if (!this.isValidCombination(fw, lang)) {
      throw new Error(`❌ Invalid combination: ${framework} + ${language}. ${this.getSuggestedCombinations(fw)}`);
    }
    
    switch (fw) {
      case 'playwright':
        return this.formatPlaywright(selector, lang);
      case 'cypress':
        return this.formatCypress(selector, lang);
      case 'selenium':
        return this.formatSelenium(selector, lang);
      default:
        throw new Error(`❌ Unsupported framework: ${framework}. Supported: playwright, cypress, selenium`);
    }
  }
  
  private isValidCombination(framework: string, language: string): boolean {
    const validCombinations: { [key: string]: string[] } = {
      'playwright': ['javascript', 'typescript', 'python', 'java', 'csharp', 'c#'],
      'selenium': ['javascript', 'typescript', 'python', 'java', 'csharp', 'c#'],
      'cypress': ['javascript', 'typescript']
    };
    
    const normalizedLang = language === 'c#' ? 'csharp' : language;
    return validCombinations[framework]?.includes(normalizedLang) || false;
  }
  
  private getSuggestedCombinations(framework: string): string {
    const suggestions: { [key: string]: string } = {
      'playwright': 'Try: javascript, typescript, python, java, csharp',
      'selenium': 'Try: javascript, typescript, python, java, csharp',
      'cypress': 'Try: javascript, typescript (Cypress only supports these languages)'
    };
    
    return suggestions[framework] || 'Check supported combinations';
  }
  
  private formatPlaywright(selector: string, language: string): string {
    const normalizedLang = language === 'c#' ? 'csharp' : language;
    
    switch (normalizedLang) {
      case 'typescript':
      case 'javascript':
        return `await page.locator('${selector}')`;
      case 'python':
        return `page.locator("${selector}")`;
      case 'java':
        return `page.locator("${selector}")`;
      case 'csharp':
        return `await Page.Locator("${selector}")`;
      default:
        return `await page.locator('${selector}')`;
    }
  }
  
  private formatCypress(selector: string, language: string): string {
    const normalizedLang = language === 'c#' ? 'csharp' : language;
    
    // Cypress solo soporta JavaScript y TypeScript
    if (!['javascript', 'typescript'].includes(normalizedLang)) {
      throw new Error(`❌ Cypress only supports JavaScript and TypeScript, not ${language}`);
    }
    
    // Formatear según el tipo de selector
    if (selector.startsWith('#')) {
      return `cy.get('${selector}')`;
    } else if (selector.includes('data-testid')) {
      const testId = selector.match(/data-testid="([^"]+)"/)?.[1];
      return testId ? `cy.findByTestId('${testId}')` : `cy.get('${selector}')`;
    } else {
      return `cy.get('${selector}')`;
    }
  }
  
  private formatSelenium(selector: string, language: string): string {
    const normalizedLang = language === 'c#' ? 'csharp' : language;
    
    switch (normalizedLang) {
      case 'javascript':
        return `await driver.findElement(By.css('${selector}'))`;
      case 'typescript':
        return `await driver.findElement(By.css('${selector}'))`;
      case 'python':
        return `driver.find_element(By.CSS_SELECTOR, "${selector}")`;
      case 'java':
        return `driver.findElement(By.cssSelector("${selector}"))`;
      case 'csharp':
        return `driver.FindElement(By.CssSelector("${selector}"))`;
      default:
        return `driver.find_element(By.CSS_SELECTOR, "${selector}")`;
    }
  }
}