#!/usr/bin/env node

// Importamos las librerías que necesitamos
import { Command } from 'commander';
import chalk from 'chalk';
import { chromium } from 'playwright';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';

// Declarar tipos para el objeto window
declare global {
  interface Window {
    selectedElementInfo: any;
    elementSelected: boolean;
  }
}

// Creamos el programa principal
const program = new Command();

// Configuramos la información básica del CLI
program
  .name('best-locator')
  .description('🎯 Universal selector generator for UI testing')
  .version('0.1.0');

// Comando hello (para testing)
program
  .command('hello')
  .description('Test that our CLI works')
  .action(() => {
    console.log(chalk.green('🎉 Hello! Best-Locator is working!'));
    console.log(chalk.blue('✨ Ready to generate awesome selectors!'));
  });

// Comando pick - nuestro comando principal
program
  .command('pick <url> [framework] [language]')
  .description('Pick an element from a webpage and generate selector')
  .action(async (url: string, framework = 'playwright', language = 'typescript') => {
    console.log(chalk.blue(`🚀 Opening ${url}...`));
    console.log(chalk.yellow(`📋 Framework: ${framework}`));
    console.log(chalk.yellow(`💬 Language: ${language}`));
    
    // ... resto del código igual
    
    
    try {
      // Abrir el navegador
      const browser = await chromium.launch({ 
        headless: false // Para que podamos ver el navegador
      });
      
      const page = await browser.newPage();
      
      // Ir a la URL
      await page.goto(url);
      
      console.log(chalk.green('✅ Page loaded successfully!'));
      console.log(chalk.cyan('👆 Click on any element to select it...'));
      
      // Inyectar JavaScript para detectar clicks
      await page.addScriptTag({
        content: `
          // Evitar que se ejecuten clicks normales
          document.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const element = event.target;
            
            // Highlight del elemento
            element.style.outline = '3px solid #ff0000';
            element.style.backgroundColor = '#ffff0050';
            
            // Guardar información del elemento
            window.selectedElementInfo = {
              tagName: element.tagName.toLowerCase(),
              id: element.id,
              className: element.className,
              textContent: element.textContent?.trim() || '',
              attributes: {}
            };
            
            // Capturar todos los atributos
            for (let attr of element.attributes) {
              window.selectedElementInfo.attributes[attr.name] = attr.value;
            }
            
            // Marcar que ya seleccionamos un elemento
            window.elementSelected = true;
          }, true);
        `
      });
      
      // Esperar hasta que el usuario haga click en un elemento
      await page.waitForFunction('window.elementSelected', { timeout: 60000 });
      
      // Obtener la información del elemento seleccionado
      const elementInfo: any = await page.evaluate('window.selectedElementInfo');
      
      console.log(chalk.green('\n🎯 Element selected!'));
      console.log(chalk.blue('📋 Element information:'));
      console.log(chalk.white(`   Tag: ${elementInfo.tagName}`));
      console.log(chalk.white(`   ID: ${elementInfo.id || '(none)'}`));
      console.log(chalk.white(`   Classes: ${elementInfo.className || '(none)'}`));
      console.log(chalk.white(`   Text: ${elementInfo.textContent.substring(0, 50)}${elementInfo.textContent.length > 50 ? '...' : ''}`));
      
      // Mostrar atributos importantes
      console.log(chalk.blue('🏷️  Attributes:'));
      Object.entries(elementInfo.attributes).forEach(([key, value]) => {
        if (['data-testid', 'data-cy', 'data-test', 'role', 'aria-label'].includes(key)) {
          console.log(chalk.green(`   ${key}: ${value}`));
        } else if (['id', 'class', 'name', 'type'].includes(key)) {
          console.log(chalk.yellow(`   ${key}: ${value}`));
        }
      });
      
      // ✨ Generar selector inteligente
      console.log(chalk.magenta('\n🧠 Generating smart selector...'));
      const generator = new SelectorGenerator();
      const selectorResult = generator.generateSelector(elementInfo);
      
      console.log(chalk.cyan('🎯 Best Selector:'));
      console.log(chalk.yellow(`   ${selectorResult.selector}`));
      console.log(chalk.white(`   Type: ${selectorResult.type}`));
      console.log(chalk.white(`   Confidence: ${selectorResult.confidence}%`));
      
      // ✨ Formatear para el framework específico
      console.log(chalk.green(`\n📋 Formatted for ${framework} ${language}:`));
      const formatter = new FrameworkFormatter();
      const formattedCode = formatter.format(selectorResult.selector, framework, language);
      console.log(chalk.blue(`   ${formattedCode}`));

      // 📋 Copiar al portapapeles
      try {
        const clipboardy = await import('clipboardy');
        await clipboardy.default.write(formattedCode);
        console.log(chalk.green('✅ Copied to clipboard!'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not copy to clipboard'));
      }
      
      console.log(chalk.red('\n🔄 Closing browser...'));
      await browser.close();
      
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
    }
  });

// Ejecutamos el programa
program.parse();