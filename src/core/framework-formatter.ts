// src/core/framework-formatter.ts
import { SelectorResult } from '../types/index.js';

type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'csharp';

export class FrameworkFormatter {
  public format(selectorResult: SelectorResult, framework: string, language: string): string {
    const { selector, type } = selectorResult;
    if (!selector) return '// No selector generated';

    const lang = language.toLowerCase() as Language;
    const lowerFramework = framework.toLowerCase();

    switch (type) {
      case 'test-id':
        return this.formatTestId(selector, lowerFramework, lang);
      case 'role':
        const [role, name] = selector.split('|');
        return this.formatRole(role, name, lowerFramework, lang);
      case 'text':
        return this.formatText(selector, lowerFramework, lang);
      case 'placeholder':
        return this.formatPlaceholder(selector, lowerFramework, lang);
      case 'id':
        return this.formatCss(`#${selector}`, lowerFramework, lang);
      default: // css, class, tag-only, etc.
        return this.formatCss(selector, lowerFramework, lang);
    }
  }

  private escapeQuotes(str: string | undefined, lang: Language): string {
    if (!str) return '';
    if (lang === 'python' || lang === 'java' || lang === 'csharp') {
      return str.replace(/"/g, '\\"');
    }
    return str.replace(/'/g, "\\'");
  }

  private formatTestId(value: string, framework: string, lang: Language): string {
    if (framework === 'playwright') {
      const cleanValue = this.escapeQuotes(value, lang);
      if (lang === 'python') return `page.get_by_test_id("${cleanValue}")`;
      if (lang === 'java') return `page.getByTestId("${cleanValue}")`;
      if (lang === 'csharp') return `Page.GetByTestId("${cleanValue}")`;
      return `await page.getByTestId('${value.replace(/'/g, "\\'")}')`;
    }
    return this.formatCss(`[data-testid="${value}"]`, framework, lang);
  }

  private formatRole(role: string, name: string, framework: string, lang: Language): string {
    if (framework === 'playwright') {
      const nameParam = name ? `, { name: '${this.escapeQuotes(name, lang)}' }` : '';
      const nameParamPy = name ? `, name="${this.escapeQuotes(name, lang)}"` : '';
      if (lang === 'python') return `page.get_by_role("${role}"${nameParamPy})`;
      return `await page.getByRole('${role}'${nameParam})`;
    }
    return this.formatCss(`[role="${role}"]`, framework, lang);
  }

  private formatText(text: string, framework: string, lang: Language): string {
    const cleanText = this.escapeQuotes(text, lang);
    if (framework === 'playwright') {
      if (lang === 'python') return `page.get_by_text("${cleanText}")`;
      return `await page.getByText('${text.replace(/'/g, "\\'")}')`;
    }
    if (framework === 'cypress') {
      return `cy.contains('${text.replace(/'/g, "\\'")}')`;
    }
    if (framework === 'selenium') {
      const xpath = `//*[text()="${cleanText}"]`;
      if (lang === 'python') return `driver.find_element(By.XPATH, "${xpath}")`;
      return `await driver.findElement(By.xpath('${xpath.replace(/'/g, "\\'")}'))`;
    }
    return `'${text}'`;
  }

  private formatPlaceholder(text: string, framework: string, lang: Language): string {
      if (framework === 'playwright') {
        const cleanText = this.escapeQuotes(text, lang);
        if (lang === 'python') return `page.get_by_placeholder("${cleanText}")`;
        return `await page.getByPlaceholder('${text.replace(/'/g, "\\'")}')`;
      }
      return this.formatCss(`[placeholder="${text}"]`, framework, lang);
  }
  
  private formatCss(selector: string, framework: string, lang: Language): string {
    const cleanSelector = this.escapeQuotes(selector, lang);
    if (framework === 'playwright') {
      if (lang === 'python') return `page.locator('${selector.replace(/'/g, "\\'")}')`;
      return `await page.locator('${selector.replace(/'/g, "\\'")}')`;
    }
    if (framework === 'cypress') {
      return `cy.get('${selector.replace(/'/g, "\\'")}')`;
    }
    if (framework === 'selenium') {
      if (lang === 'python') return `driver.find_element(By.CSS_SELECTOR, "${cleanSelector}")`;
      return `await driver.findElement(By.css('${selector.replace(/'/g, "\\'")}'))`;
    }
    return `'${selector}'`;
  }
}