import { SelectorResult } from '../types/index.js';

type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'csharp';

export class FrameworkFormatter {
  public format(selectorResult: SelectorResult, framework: string, language: string): string {
    const { selector, type } = selectorResult;

    if (!selector) return '// No selector generated';

    const lang = language.toLowerCase() as Language;
    const lowerFramework = framework.toLowerCase();

    // Usamos el 'type' del SelectorResult para decidir la estrategia de formato
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
      default:
        // para 'css', 'class', 'link-href-keyword', 'tag-only', etc.
        return this.formatCss(selector, lowerFramework, lang);
    }
  }

  // --- Funciones de Ayuda para Formateo ---

  private escapeQuotes(str: string | undefined, lang: Language): string {
    if (!str) return '';
    // Para Python, Java, y C# es más seguro usar comillas dobles y escapar las internas
    if (lang === 'python' || lang === 'java' || lang === 'csharp') {
        return str.replace(/"/g, '\\"');
    }
    // Para JS/TS, es más común usar comillas simples y escapar las internas
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
    // Para Selenium y Cypress, usamos un selector de atributo estándar
    // Asumimos que el atributo es [data-testid="..."] como un estándar común
    return this.formatCss(`[data-testid="${value}"]`, framework, lang);
  }

  private formatRole(role: string, name: string, framework: string, lang: Language): string {
    if (framework === 'playwright') {
        const nameParamPy = name ? `, name="${this.escapeQuotes(name, lang)}"`: '';
        const nameParamTs = name ? `, { name: '${this.escapeQuotes(name, lang)}' }`: '';
        const nameParamJava = name ? `, new Page.GetByRoleOptions().setName("${this.escapeQuotes(name, lang)}")`: '';
        const nameParamCs = name ? `, new() { Name = "${this.escapeQuotes(name, lang)}" }`: '';

        if (lang === 'python') return `page.get_by_role("${role}"${nameParamPy})`;
        if (lang === 'java') return `page.getByRole(AriaRole.${role.toUpperCase()}${nameParamJava})`;
        if (lang === 'csharp') return `page.GetByRole(AriaRole.${role.charAt(0).toUpperCase() + role.slice(1)}${nameParamCs})`;
        return `await page.getByRole('${role}'${nameParamTs})`;
    }
    // Para otros frameworks, un selector de atributo de rol es el mejor fallback
    return this.formatCss(`[role="${role}"]`, framework, lang);
  }

  private formatText(text: string, framework: string, lang: Language): string {
    const cleanText = this.escapeQuotes(text, lang);
    if (framework === 'playwright') {
        if (lang === 'python') return `page.get_by_text("${cleanText}")`;
        if (lang === 'java') return `page.getByText("${cleanText}")`;
        if (lang === 'csharp') return `Page.GetByText("${cleanText}")`;
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
        if (lang === 'java') return `page.getByPlaceholder("${cleanText}")`;
        if (lang === 'csharp') return `Page.GetByPlaceholder("${cleanText}")`;
        return `await page.getByPlaceholder('${text.replace(/'/g, "\\'")}')`;
      }
      return this.formatCss(`[placeholder="${text}"]`, framework, lang);
  }
  
  private formatCss(selector: string, framework: string, lang: Language): string {
    const cleanSelector = this.escapeQuotes(selector, lang);
    if (framework === 'playwright') {
        if (lang === 'python') return `page.locator('${selector.replace(/'/g, "\\'")}')`;
        if (lang === 'java') return `page.locator("${selector.replace(/"/g, '\\"')}")`;
        if (lang === 'csharp') return `Page.Locator("${selector.replace(/"/g, '\\"')}")`;
        return `await page.locator('${selector.replace(/'/g, "\\'")}')`;
    }
    if (framework === 'cypress') {
        return `cy.get('${selector.replace(/'/g, "\\'")}')`;
    }
    if (framework === 'selenium') {
        if (lang === 'python') return `driver.find_element(By.CSS_SELECTOR, "${cleanSelector}")`;
        if (lang === 'java') return `driver.findElement(By.cssSelector("${cleanSelector}"))`;
        if (lang === 'csharp') return `driver.FindElement(By.CssSelector("${cleanSelector}"))`;
        return `await driver.findElement(By.css('${selector.replace(/'/g, "\\'")}'))`;
    }
    return `'${selector}'`;
  }
}