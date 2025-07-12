// src/core/framework-formatter.ts

interface SelectorResult {
  selector: string;
  confidence: number;
  type: string;
}

export class FrameworkFormatter {
  
  format(selector: string, framework: string, language: string): string {
    switch (framework.toLowerCase()) {
      case 'playwright':
        return this.formatPlaywright(selector, language);
      case 'cypress':
        return this.formatCypress(selector, language);
      case 'selenium':
        return this.formatSelenium(selector, language);
      default:
        return selector;
    }
  }
  
  private formatPlaywright(selector: string, language: string): string {
    switch (language.toLowerCase()) {
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
    if (selector.startsWith('#')) {
      return `cy.get('${selector}')`;
    } else if (selector.includes('data-testid')) {
      const testId = selector.match(/data-testid="([^"]+)"/)?.[1];
      return `cy.findByTestId('${testId}')`;
    } else {
      return `cy.get('${selector}')`;
    }
  }
  
  private formatSelenium(selector: string, language: string): string {
    switch (language.toLowerCase()) {
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