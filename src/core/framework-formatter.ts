import { logger } from '../app/logger.js';

export class FrameworkFormatter {
  format(selector: string, framework: string, language: string): string {
    if (!selector) {
      return '// No selector generated';
    }

    const lowerFramework = framework.toLowerCase();
    const lowerLanguage = language ? language.toLowerCase() : 'typescript';
    
    if (selector.startsWith('text=')) {
        // CORRECCIÓN: Limpiamos las comillas que el generador manual añade
        let textContent = selector.substring(5);
        if (textContent.startsWith('"') && textContent.endsWith('"')) {
            textContent = textContent.slice(1, -1);
        }
        
        switch (lowerFramework) {
            case 'playwright':
                return this.formatPlaywrightText(textContent, lowerLanguage);
            case 'cypress':
                return `cy.contains('${textContent.replace(/'/g, "\\'")}')`;
            case 'selenium':
                return this.formatSeleniumText(textContent, lowerLanguage);
            default:
                return `// Text selector not standard: ${selector}`;
        }
    }

    // Lógica para selectores CSS
    switch (lowerFramework) {
      case 'playwright':
        return this.formatPlaywrightCss(selector, lowerLanguage);
      case 'cypress':
        return `cy.get('${selector.replace(/'/g, "\\'")}')`;
      case 'selenium':
        return this.formatSeleniumCss(selector, lowerLanguage);
      default:
        return `'${selector}'`;
    }
  }

  private formatPlaywrightText(text: string, lang: string): string {
    const cleanText = text.replace(/"/g, '\\"');
    if (lang === 'python') return `page.get_by_text("${cleanText}")`;
    if (lang === 'java') return `page.getByText("${cleanText}")`;
    if (lang === 'csharp') return `Page.GetByText("${cleanText}")`;
    return `await page.getByText('${cleanText.replace(/'/g, "\\'")}')`;
  }
  
  private formatSeleniumText(text: string, lang: string): string {
    const cleanText = text.replace(/"/g, '\\"');
    const xpath = `//*[text()="${cleanText}"]`;
    if (lang === 'python') return `driver.find_element(By.XPATH, "${xpath}")`;
    if (lang === 'java') return `driver.findElement(By.xpath("${xpath}"))`;
    if (lang === 'csharp') return `driver.FindElement(By.XPath("${xpath}"))`;
    return `await driver.findElement(By.xpath('${xpath.replace(/'/g, "\\'")}'))`;
  }
  
  private formatPlaywrightCss(selector: string, lang: string): string {
    const cleanSelector = selector.replace(/'/g, "\\'");
    if (lang === 'python') return `page.locator('${cleanSelector}')`;
    if (lang === 'java') return `page.locator("${cleanSelector.replace(/"/g, '\\"')}")`;
    if (lang === 'csharp') return `Page.Locator("${cleanSelector.replace(/"/g, '\\"')}")`;
    return `await page.locator('${cleanSelector}')`;
  }

  private formatSeleniumCss(selector: string, lang: string): string {
    const cleanSelector = selector.replace(/"/g, '\\"');
    if (lang === 'python') return `driver.find_element(By.CSS_SELECTOR, "${cleanSelector}")`;
    if (lang === 'java') return `driver.findElement(By.cssSelector("${cleanSelector}"))`;
    if (lang === 'csharp') return `driver.FindElement(By.CssSelector("${cleanSelector}"))`;
    return `await driver.findElement(By.css('${cleanSelector.replace(/'/g, "\\'")}'))`;
  }
}