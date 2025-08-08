// Archivo: src/core/framework-formatter.ts

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
      case 'link-href':
        return this.formatCss(`a[href*="${selector}"]`, lowerFramework, lang);
      default:
        return this.formatCss(selector, lowerFramework, lang);
    }
  }

  // --- Funciones de Ayuda para Formateo Web ---

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
  if (role.includes('[name=')) {
    const match = role.match(/^(\w+)\[name=['"]([^'"]+)['"]\]$/);
    if (match) { role = match[1]; name = match[2]; }
  }  
  if (framework === 'playwright') {
    // 🆕 MEJORADO: Mejor manejo de nombres con caracteres especiales
    const escapedName = name ? name.replace(/"/g, '\\"').replace(/'/g, "\\'") : '';
    
    const nameParamPy = escapedName ? `, name="${escapedName}"` : '';
    const nameParamTs = escapedName ? `, { name: '${escapedName}' }` : '';
    const nameParamJava = escapedName ? `, new Page.GetByRoleOptions().setName("${escapedName}")` : '';
    const nameParamCs = escapedName ? `, new() { Name = "${escapedName}" }` : '';

    if (lang === 'python') return `page.get_by_role("${role}"${nameParamPy})`;
    if (lang === 'java') return `page.getByRole(AriaRole.${role.toUpperCase()}${nameParamJava})`;
    if (lang === 'csharp') return `page.GetByRole(AriaRole.${role.charAt(0).toUpperCase() + role.slice(1)}${nameParamCs})`;
    return `await page.getByRole('${role}'${nameParamTs})`;
  }
  
  if (framework === 'cypress') {
    // 🆕 NUEVO: Soporte para Cypress con roles
    if (name) {
      return `cy.get('[role="${role}"]').contains('${name.replace(/'/g, "\\'")}')`;
    }
    return `cy.get('[role="${role}"]')`;
  }
  
  if (framework === 'selenium') {
    // 🆕 NUEVO: Soporte para Selenium con roles
    const selector = name ? `[role="${role}"][aria-label="${name}"]` : `[role="${role}"]`;
    const cleanSelector = this.escapeQuotes(selector, lang);
    
    if (lang === 'python') return `driver.find_element(By.CSS_SELECTOR, "${cleanSelector}")`;
    if (lang === 'java') return `driver.findElement(By.cssSelector("${cleanSelector}"))`;
    if (lang === 'csharp') return `driver.FindElement(By.CssSelector("${cleanSelector}"))`;
    return `await driver.findElement(By.css('${selector.replace(/'/g, "\\'")}'))`;
  }
  
  // Fallback genérico
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
        // --- INICIO DE LA CORRECCIÓN ---
        if (lang === 'java') return `driver.findElement(By.xpath("${xpath.replace(/"/g, '\\"')}"))`;
        if (lang === 'csharp') return `driver.FindElement(By.XPath("${xpath.replace(/"/g, '\\"')}"))`;
        // --- FIN DE LA CORRECCIÓN ---
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

  // --- NUEVOS MÉTODOS PARA FORMATEO MÓVIL ---

  public formatMobile(
    selectorResult: SelectorResult,
    platform: 'ios' | 'android',
    language: string
  ): string {
    const { selector, type } = selectorResult;
    const lang = language.toLowerCase() as Language;

    if (!selector) return '// No mobile selector generated';

    switch (type) {
      case 'accessibility-id':
        return this.formatAccessibilityId(selector, lang);
      case 'resource-id':
        return this.formatResourceId(selector, lang);
      case 'text':
        return this.formatMobileText(selector, lang);
      case 'ios-predicate':
        return this.formatIOSPredicate(selector, lang);
      case 'uiautomator':
        return this.formatUiAutomator(selector, lang);
      case 'xpath':
        return this.formatMobileXPath(selector, lang);
      default:
        return this.formatMobileGeneric(selector, lang);
    }
  }

  private formatAccessibilityId(value: string, lang: Language): string {
    const cleanValue = this.escapeQuotes(value, lang);
    if (lang === 'python') return `driver.find_element(AppiumBy.ACCESSIBILITY_ID, "${cleanValue}")`;
    if (lang === 'java') return `driver.findElement(AppiumBy.accessibilityId("${cleanValue}"))`;
    if (lang === 'csharp') return `driver.FindElement(MobileBy.AccessibilityId("${cleanValue}"))`;
    // Default to JS/TS WebDriverIO syntax
    return `await driver.findElement('accessibility id', '${value.replace(/'/g, "\\'")}')`;
  }

  private formatResourceId(value: string, lang: Language): string {
    const cleanValue = this.escapeQuotes(value, lang);
    if (lang === 'python') return `driver.find_element(AppiumBy.ID, "${cleanValue}")`;
    if (lang === 'java') return `driver.findElement(AppiumBy.id("${cleanValue}"))`;
    if (lang === 'csharp') return `driver.FindElement(MobileBy.Id("${cleanValue}"))`;
    return `await driver.findElement('id', '${value.replace(/'/g, "\\'")}')`;
  }

  private formatMobileText(text: string, lang: Language): string {
    const cleanText = this.escapeQuotes(text, lang);
    if (lang === 'python') return `driver.find_element(AppiumBy.XPATH, "//*[@text='${cleanText}']")`;
    if (lang === 'java') return `driver.findElement(AppiumBy.xpath("//*[@text='${cleanText}']"))`;
    if (lang === 'csharp') return `driver.FindElement(MobileBy.XPath("//*[@text='${cleanText}']"))`;
    return `await driver.findElement('xpath', "//*[@text=\\"${text.replace(/"/g, '\\"')}\\"]")`;
  }

  private formatIOSPredicate(predicate: string, lang: Language): string {
    const cleanPredicate = this.escapeQuotes(predicate, lang);
    if (lang === 'python') return `driver.find_element(AppiumBy.IOS_PREDICATE, "${cleanPredicate}")`;
    if (lang === 'java') return `driver.findElement(AppiumBy.iosNsPredicateString("${cleanPredicate}"))`;
    if (lang === 'csharp') return `driver.FindElement(MobileBy.IosNsPredicate("${cleanPredicate}"))`;
    return `await driver.findElement('-ios predicate string', '${predicate.replace(/'/g, "\\'")}')`;
  }

  private formatUiAutomator(selector: string, lang: Language): string {
    const cleanSelector = this.escapeQuotes(selector, lang);
    if (lang === 'python') return `driver.find_element(AppiumBy.ANDROID_UIAUTOMATOR, "${cleanSelector}")`;
    if (lang === 'java') return `driver.findElement(AppiumBy.androidUIAutomator("${cleanSelector}"))`;
    if (lang === 'csharp') return `driver.FindElement(MobileBy.AndroidUIAutomator("${cleanSelector}"))`;
    return `await driver.findElement('android uiautomator', '${selector.replace(/'/g, "\\'")}')`;
  }

  private formatMobileXPath(xpath: string, lang: Language): string {
    const cleanXPath = this.escapeQuotes(xpath, lang);
    if (lang === 'python') return `driver.find_element(AppiumBy.XPATH, "${cleanXPath}")`;
    if (lang === 'java') return `driver.findElement(AppiumBy.xpath("${cleanXPath}"))`;
    if (lang === 'csharp') return `driver.FindElement(MobileBy.XPath("${cleanXPath}"))`;
    return `await driver.findElement('xpath', '${xpath.replace(/'/g, "\\'")}')`;
  }

  private formatMobileGeneric(selector: string, lang: Language): string {
    // As a fallback, assume it's an XPath
    return this.formatMobileXPath(selector, lang);
  }
}