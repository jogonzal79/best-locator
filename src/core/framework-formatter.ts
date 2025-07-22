// src/core/framework-formatter.ts
import { logger } from '../app/logger.js';

export class FrameworkFormatter {
  /**
   * Formats a raw CSS selector into a framework-specific and language-specific code snippet.
   */
  format(selector: string, framework: string, language: string): string {
    if (!selector) {
      logger.warning('Formatter received an empty selector.');
      return '// No selector generated';
    }

    // Normalizamos las entradas para que no importen mayúsculas/minúsculas
    const lowerFramework = framework.toLowerCase();
    // Asumimos un lenguaje por defecto si no se especifica
    const lowerLanguage = language ? language.toLowerCase() : 'typescript';

    switch (lowerFramework) {
      case 'playwright':
        switch (lowerLanguage) {
          case 'python':
            return `page.locator("${selector}")`;
          case 'java':
            return `page.locator("${selector}")`;
          case 'c#':
            return `Page.Locator("${selector}")`;
          case 'typescript':
          case 'javascript':
          default:
            return `await page.locator('${selector}')`;
        }

      case 'cypress':
        // Cypress es principalmente para JavaScript/TypeScript
        if (lowerLanguage !== 'typescript' && lowerLanguage !== 'javascript') {
            logger.warning(`Cypress does not support '${language}'. Providing JavaScript snippet.`);
        }
        return `cy.get('${selector}')`;

      case 'selenium':
        switch (lowerLanguage) {
          case 'python':
            return `driver.find_element(By.CSS_SELECTOR, "${selector}")`;
          case 'java':
            return `driver.findElement(By.cssSelector("${selector}"))`;
          case 'c#':
            return `driver.FindElement(By.CssSelector("${selector}"))`;
          case 'javascript':
          case 'typescript':
            return `await driver.findElement(By.css('${selector}'))`;
          default:
            logger.warning(`Language '${language}' not recognized for Selenium. Providing Python snippet as a default.`);
            return `driver.find_element(By.CSS_SELECTOR, "${selector}")`;
        }
      
      default:
        logger.warning(`Framework '${framework}' not recognized. Providing a generic snippet.`);
        return `'${selector}' // CSS Selector for unrecognized framework: ${framework}`;
    }
  }

  /**
   * Este método ya no es necesario si el generador siempre produce CSS estándar,
   * pero lo mantenemos por si se reutiliza en el futuro.
   */
  private convertToPlaywrightNative(selector: string): string {
    if (selector.startsWith('getByRole')) {
      return selector;
    }
    // ... otras conversiones si fueran necesarias
    return selector;
  }
}
