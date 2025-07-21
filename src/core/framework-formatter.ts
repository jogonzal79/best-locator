// src/core/framework-formatter.ts

interface SelectorResult {
  selector: string;
  confidence: number;
  type: string;
}

export class FrameworkFormatter {
  /**
   * Formats a raw selector string into framework-specific code snippets.
   */
  format(selector: string, framework: string, language: string): string {
    // AGREGAR verificación al inicio:
    if (!selector) {
      
      return 'INVALID_SELECTOR';
    }

    

    // Si el selector es get_by_*, convertir a sintaxis nativa de Playwright
    if (selector.startsWith('get_by_')) {
      if (framework === 'playwright') {
        const converted = this.convertToPlaywrightNative(selector);
        if (language === 'typescript' || language === 'javascript') {
          return `await page.${converted}`;
        } else if (language === 'python') {
          return `page.${converted}`;
        }
      }
    }

    // Si el selector ya viene en formato especial (cy.*), manejarlo
    if (selector.startsWith('cy.')) {
      // Ya está formateado, solo envolver según lenguaje
      if (language === 'typescript' || language === 'javascript') {
        return selector;
      }
      return selector;
    }

    // Para selectores CSS tradicionales
    if (framework === 'playwright') {
      if (language === 'typescript' || language === 'javascript') {
        return `await page.locator('${selector}')`;
      } else if (language === 'python') {
        return `page.locator("${selector}")`;
      }
    } else if (framework === 'cypress') {
      if (language === 'typescript' || language === 'javascript') {
        return `cy.get('${selector}')`;
      } else {
        return `cy.get('${selector}')`;
      }
    } else if (framework === 'selenium') {
      if (language === 'java') {
        return `driver.findElement(By.cssSelector("${selector}"))`;
      } else if (language === 'python') {
        return `driver.find_element(By.CSS_SELECTOR, "${selector}")`;
      }
    }

    // Fallback seguro
    return `await page.locator('${selector}')`;
  }

  /**
   * Convierte selectores get_by_* a sintaxis nativa de Playwright.
   */
  private convertToPlaywrightNative(selector: string): string {
    // get_by_role("button", name="texto") → getByRole("button", { name: "texto" })
    if (selector.startsWith('get_by_role(')) {
      const match = selector.match(/get_by_role\("([^\"]+)",\s*name="([^\"]+)"\)/);
      if (match) {
        const [, role, name] = match;
        return `getByRole("${role}", { name: "${name}" })`;
      }
    }

    // get_by_text("texto") → getByText("texto")
    if (selector.startsWith('get_by_text(')) {
      return selector.replace('get_by_text', 'getByText');
    }

    // Fallback
    return selector;
  }
}
