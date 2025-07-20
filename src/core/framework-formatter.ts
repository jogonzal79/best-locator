// src/core/framework-formatter.ts

interface SelectorResult {
  selector: string;
  confidence: number;
  type: string;
}

export class FrameworkFormatter {
  
format(selector: string, framework: string, language: string): string {
  // AGREGAR verificación al inicio:
  if (!selector) {
    console.log('🔥 [DEBUG] Empty selector received in formatter');
    return 'INVALID_SELECTOR';
  }
  
  console.log('🔥 [DEBUG] Formatting selector:', selector, 'for', framework, language);
  
  // Si el selector ya viene en formato especial, manejarlo
  if (selector.startsWith('get_by_') || selector.startsWith('cy.')) {
    // Ya está formateado, solo envolver según lenguaje
    if (language === 'typescript' || language === 'javascript') {
      return `await page.${selector}`;
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
    return `cy.get('${selector}')`;
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
}