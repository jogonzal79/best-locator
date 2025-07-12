// src/core/selector-validator.ts
import { Page } from 'playwright';
import chalk from 'chalk';

interface ValidationResult {
  status: 'passed' | 'failed' | 'warning';
  elementCount: number;
  details?: {
    tag?: string;
    text?: string;
    isVisible?: boolean;
    isClickable?: boolean;
    attributes?: { [key: string]: string };
  };
  suggestions?: string[];
  message?: string;
}

export class SelectorValidator {
  
  async validate(page: Page, selector: string): Promise<ValidationResult> {
    try {
      console.log(chalk.blue(`🔍 Validating selector: ${selector}`));
      
      // 1. Buscar elementos con el selector
      const elements = await page.$$(selector);
      
      if (elements.length === 0) {
        return {
          status: 'failed',
          elementCount: 0,
          message: 'No elements found',
          suggestions: await this.findSimilarElements(page, selector)
        };
      }
      
      if (elements.length > 1) {
        return {
          status: 'warning',
          elementCount: elements.length,
          message: `Multiple elements found (${elements.length})`,
          details: await this.getElementDetails(elements[0])
        };
      }
      
      // 2. Elemento único encontrado - obtener detalles
      const element = elements[0];
      const details = await this.getElementDetails(element);
      
      return {
        status: 'passed',
        elementCount: 1,
        details
      };
      
    } catch (error: any) {
      return {
        status: 'failed',
        elementCount: 0,
        message: `Validation error: ${error.message}`
      };
    }
  }
  
  private async getElementDetails(element: any) {
    try {
      const tagName = await element.evaluate((el: any) => el.tagName.toLowerCase());
      const textContent = await element.evaluate((el: any) => el.textContent?.trim() || '');
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      // Obtener atributos principales
      const attributes = await element.evaluate((el: any) => {
        const attrs: { [key: string]: string } = {};
        ['id', 'class', 'name', 'type', 'data-testid', 'data-cy', 'role', 'aria-label'].forEach(attr => {
          const value = el.getAttribute(attr);
          if (value) attrs[attr] = value;
        });
        return attrs;
      });
      
      return {
        tag: tagName,
        text: textContent.substring(0, 50),
        isVisible,
        isClickable: isEnabled,
        attributes
      };
    } catch (error) {
      return {};
    }
  }
  
  private async findSimilarElements(page: Page, failedSelector: string): Promise<string[]> {
    // Por ahora retornamos sugerencias básicas
    // TODO: Implementar lógica más inteligente
    const suggestions = [];
    
    try {
      // Si falló un ID, buscar por clases similares
      if (failedSelector.startsWith('#')) {
        const id = failedSelector.substring(1);
        const classElements = await page.$$(`[class*="${id}"]`);
        if (classElements.length > 0) {
          suggestions.push(`[class*="${id}"]`);
        }
      }
      
      // Si falló una clase, buscar por ID similar
      if (failedSelector.startsWith('.')) {
        const className = failedSelector.substring(1);
        const idElements = await page.$$(`[id*="${className}"]`);
        if (idElements.length > 0) {
          suggestions.push(`[id*="${className}"]`);
        }
      }
      
    } catch (error) {
      // Si hay error, no agregar sugerencias
    }
    
    return suggestions;
  }
  
  displayResult(result: ValidationResult, selector: string) {
    console.log(chalk.blue('\n📊 Validation Results:'));
    console.log(chalk.white(`   Selector: ${selector}`));
    
    switch (result.status) {
      case 'passed':
        console.log(chalk.green('   Status: ✅ PASSED'));
        console.log(chalk.white(`   Elements found: ${result.elementCount}`));
        
        if (result.details) {
          console.log(chalk.blue('\n📋 Element Details:'));
          console.log(chalk.white(`   Tag: ${result.details.tag || 'unknown'}`));
          console.log(chalk.white(`   Text: "${result.details.text || ''}"`));
          console.log(chalk.white(`   Visible: ${result.details.isVisible ? '✅' : '❌'}`));
          console.log(chalk.white(`   Clickable: ${result.details.isClickable ? '✅' : '❌'}`));
          
          if (result.details.attributes && Object.keys(result.details.attributes).length > 0) {
            console.log(chalk.blue('\n🏷️  Attributes:'));
            Object.entries(result.details.attributes).forEach(([key, value]) => {
              console.log(chalk.white(`   ${key}: ${value}`));
            });
          }
        }
        break;
        
      case 'warning':
        console.log(chalk.yellow('   Status: ⚠️  WARNING'));
        console.log(chalk.white(`   Elements found: ${result.elementCount}`));
        console.log(chalk.yellow(`   Issue: ${result.message}`));
        break;
        
      case 'failed':
        console.log(chalk.red('   Status: ❌ FAILED'));
        console.log(chalk.white(`   Elements found: ${result.elementCount}`));
        console.log(chalk.red(`   Issue: ${result.message}`));
        
        if (result.suggestions && result.suggestions.length > 0) {
          console.log(chalk.blue('\n💡 Suggestions:'));
          result.suggestions.forEach((suggestion, index) => {
            console.log(chalk.yellow(`   ${index + 1}. ${suggestion}`));
          });
        }
        break;
    }
  }
}