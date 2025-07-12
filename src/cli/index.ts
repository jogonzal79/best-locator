#!/usr/bin/env node

// Importamos las librerías que necesitamos
import { Command } from 'commander';
import chalk from 'chalk';
import { chromium } from 'playwright';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { SelectorValidator } from '../core/selector-validator.js';

// Declarar tipos para el objeto window
declare global {
  interface Window {
    selectedElementInfo: any;
    elementSelected: boolean;
    selectedElements: any[];
    multipleSelectionComplete: boolean;
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

// Comando pick - nuestro comando principal (modo single)
program
  .command('pick <url> [framework] [language]')
  .description('Pick an element from a webpage and generate selector')
  .action(async (url: string, framework = 'playwright', language = 'typescript') => {
    console.log(chalk.blue(`🚀 Opening ${url}...`));
    console.log(chalk.yellow(`📋 Framework: ${framework}`));
    console.log(chalk.yellow(`💬 Language: ${language}`));
    console.log(chalk.magenta(`🔀 Single mode: ON`));
    
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
              id: element.id || '',
              className: element.className || '',
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

// Comando pick-multiple - selección múltiple
program
  .command('pick-multiple <url> [framework] [language]')
  .description('Pick multiple elements from a webpage and generate selectors')
  .action(async (url: string, framework = 'playwright', language = 'typescript') => {
    console.log(chalk.blue(`🚀 Opening ${url}...`));
    console.log(chalk.yellow(`📋 Framework: ${framework}`));
    console.log(chalk.yellow(`💬 Language: ${language}`));
    console.log(chalk.magenta(`🔀 Multiple mode: ON`));
    
    try {
      // Abrir el navegador
      const browser = await chromium.launch({ 
        headless: false
      });
      
      const page = await browser.newPage();
      await page.goto(url);
      
      console.log(chalk.green('✅ Page loaded successfully!'));
      console.log(chalk.cyan('🔀 Multiple mode enabled!'));
      console.log(chalk.cyan('👆 Click on elements to select them'));
      console.log(chalk.yellow('📝 Press ESC key when you finish selecting'));
      
      // Inyectar JavaScript para modo múltiple
      await page.addScriptTag({
        content: `
          window.selectedElements = [];
          let elementCounter = 0;
          
          // Escuchar clicks
          document.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const element = event.target;
            elementCounter++;
            
            console.log('🔥 Click detected on element:', elementCounter);
            
            // Highlight simple del elemento
            element.style.outline = '3px solid #ff0000';
            element.style.backgroundColor = '#ffff0050';
            
            // Guardar información del elemento  
            const elementInfo = {
              order: elementCounter,
              tagName: element.tagName.toLowerCase(),
              id: element.id || '',
              className: element.className || '',
              textContent: element.textContent?.trim() || '',
              attributes: {}
            };
            
            // Capturar algunos atributos básicos
            if (element.id) elementInfo.attributes['id'] = element.id;
            if (element.className) elementInfo.attributes['class'] = element.className;
            
            window.selectedElements.push(elementInfo);
            console.log('✅ Element saved:', elementCounter, elementInfo.tagName);
            
            // Mostrar contador en consola del navegador
            console.log('Total elements selected:', window.selectedElements.length);
            
          }, true);
          
          // Escuchar tecla ESC
          document.addEventListener('keydown', function(event) {
            console.log('🔑 Key pressed:', event.key);
            if (event.key === 'Escape') {
              console.log('🏁 ESC pressed - finishing selection');
              alert('Selection complete! Processing ' + window.selectedElements.length + ' elements...');
              window.multipleSelectionComplete = true;
            }
          });
          
          console.log('🚀 Multiple selection script loaded successfully');
        `
      });
      
      // Esperar hasta que presione ESC
      console.log(chalk.blue('⏳ Waiting for ESC key... (make multiple clicks then press ESC)'));

      try {
        await page.waitForFunction('window.multipleSelectionComplete', { timeout: 300000 });
        console.log(chalk.green('✅ ESC detected - processing selections...'));
      } catch (error) {
        console.log(chalk.red('⏰ Timeout waiting for ESC - processing current selections...'));
      }
      
      // Obtener todos los elementos seleccionados
      const selectedElements: any[] = await page.evaluate('window.selectedElements');
      
      if (selectedElements.length === 0) {
        console.log(chalk.yellow('⚠️  No elements were selected'));
        await browser.close();
        return;
      }
      
      // Procesar cada elemento
      console.log(chalk.green(`\n🎯 ${selectedElements.length} elements selected!`));
      
      const generator = new SelectorGenerator();
      const formatter = new FrameworkFormatter();
      const results = [];
      
      for (const elementInfo of selectedElements) {
        const selectorResult = generator.generateSelector(elementInfo);
        const formattedCode = formatter.format(selectorResult.selector, framework, language);
        
        results.push({
          order: elementInfo.order,
          tagName: elementInfo.tagName,
          textContent: elementInfo.textContent,
          selector: selectorResult.selector,
          code: formattedCode,
          confidence: selectorResult.confidence
        });
        
        console.log(chalk.blue(`\n📋 Element ${elementInfo.order}:`));
        console.log(chalk.white(`   Tag: ${elementInfo.tagName}`));
        console.log(chalk.white(`   Text: "${elementInfo.textContent.substring(0, 30)}${elementInfo.textContent.length > 30 ? '...' : ''}"`));
        console.log(chalk.yellow(`   Selector: ${selectorResult.selector}`));
        console.log(chalk.cyan(`   Code: ${formattedCode}`));
        console.log(chalk.white(`   Confidence: ${selectorResult.confidence}%`));
      }
      
      // Generar snippet combinado
      console.log(chalk.green('\n✨ Combined test snippet:'));
      const combinedCode = results.map(r => `   ${r.code}`).join('\n');
      console.log(chalk.blue(combinedCode));
      
      // Copiar al portapapeles
      try {
        const clipboardy = await import('clipboardy');
        await clipboardy.default.write(combinedCode);
        console.log(chalk.green('\n📋 All code copied to clipboard!'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not copy to clipboard'));
      }
      
      console.log(chalk.red('\n🔄 Closing browser...'));
      await browser.close();
      
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
    }
  });

// Comando validate - validar selectores existentes
program
  .command('validate <url> <selector>')
  .description('Validate if a selector works on a webpage')
  .option('-t, --timeout <timeout>', 'timeout in milliseconds', '30000')
  .action(async (url: string, selector: string, options: { timeout: string }) => {
    console.log(chalk.blue(`🔍 Validating selector on ${url}...`));
    console.log(chalk.yellow(`🎯 Selector: ${selector}`));
    console.log(chalk.yellow(`⏱️  Timeout: ${options.timeout}ms`));
    
    try {
      // Abrir el navegador
      const browser = await chromium.launch({ 
        headless: false // Para que puedas ver qué está pasando
      });
      
      const page = await browser.newPage();
      
      // Ir a la URL
      console.log(chalk.blue('🌐 Loading page...'));
      await page.goto(url, { timeout: parseInt(options.timeout) });
      
      console.log(chalk.green('✅ Page loaded successfully!'));
      
      // Validar el selector
      const validator = new SelectorValidator();
      const result = await validator.validate(page, selector);
      
      // Mostrar resultados
      validator.displayResult(result, selector);
      
      // Cerrar navegador
      console.log(chalk.blue('\n🔄 Closing browser...'));
      await browser.close();
      
      // Exit code basado en resultado
      if (result.status === 'failed') {
        process.exit(1); // Para CI/CD
      }
      
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Ejecutamos el programa
program.parse();