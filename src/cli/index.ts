#!/usr/bin/env node

// Importamos las librerías que necesitamos
import { Command } from 'commander';
import chalk from 'chalk';
import { chromium } from 'playwright';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { SelectorValidator } from '../core/selector-validator.js';
import { ConfigManager } from '../core/config-manager.js';

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

// Inicializar ConfigManager
const configManager = new ConfigManager();

// Configuramos la información básica del CLI
program
  .name('best-locator')
  .description('🎯 Universal selector generator for UI testing')
  .version('1.0.0');

// Comando hello (para testing)
program
  .command('hello')
  .description('Test that our CLI works')
  .action(() => {
    console.log(chalk.green('🎉 Hello! Best-Locator v1.0 is working!'));
    console.log(chalk.blue('✨ Ready to generate awesome selectors!'));
    if (configManager.hasConfigFile()) {
      console.log(chalk.green('⚙️  Configuration file detected!'));
    }
  });

// Comando para crear configuración de ejemplo
program
  .command('init')
  .description('Create a sample configuration file')
  .action(() => {
    configManager.createSampleConfig();
  });

// Comando pick - nuestro comando principal (modo single)
program
  .command('pick <url> [framework] [language]')
  .description('Pick an element from a webpage and generate selector')
  .action(async (url: string, framework?: string, language?: string) => {
    // Usar configuración por defecto si no se especifica
    const config = configManager.getConfig();
    const finalFramework = framework || config.defaultFramework;
    const finalLanguage = language || config.defaultLanguage;
    
    // Resolver URL si es un alias
    const resolvedUrl = configManager.getUrl(url) || url;
    
    console.log(chalk.blue(`🚀 Opening ${resolvedUrl}...`));
    console.log(chalk.yellow(`📋 Framework: ${finalFramework}`));
    console.log(chalk.yellow(`💬 Language: ${finalLanguage}`));
    if (configManager.hasConfigFile()) {
      console.log(chalk.green(`⚙️  Using config file`));
    }
    if (resolvedUrl !== url) {
      console.log(chalk.blue(`🔗 URL alias '${url}' → ${resolvedUrl}`));
    }
    console.log(chalk.magenta(`🔀 Single mode: ON`));
    
    try {
      // Abrir el navegador con configuración
      const browser = await chromium.launch({ 
        headless: config.browser.headless,
        ...(config.browser.userAgent && { 
          args: [`--user-agent=${config.browser.userAgent}`] 
        })
      });
      
      const page = await browser.newPage();
      
      // Configurar viewport
      await page.setViewportSize(config.browser.viewport);
      
      // Ir a la URL con timeout configurado
      await page.goto(resolvedUrl, { 
        timeout: config.timeouts.pageLoad 
      });
      
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
      
      // Esperar hasta que el usuario haga click en un elemento (con timeout configurado)
      await page.waitForFunction('window.elementSelected', { 
        timeout: config.timeouts.elementSelection 
      });
      
      // Obtener la información del elemento seleccionado
      const elementInfo: any = await page.evaluate('window.selectedElementInfo');
      
      console.log(chalk.green('\n🎯 Element selected!'));
      console.log(chalk.blue('📋 Element information:'));
      console.log(chalk.white(`   Tag: ${elementInfo.tagName}`));
      console.log(chalk.white(`   ID: ${elementInfo.id || '(none)'}`));
      console.log(chalk.white(`   Classes: ${elementInfo.className || '(none)'}`));
      console.log(chalk.white(`   Text: ${elementInfo.textContent.substring(0, 50)}${elementInfo.textContent.length > 50 ? '...' : ''}`));
      
      // Mostrar atributos importantes (usar atributos del proyecto)
      console.log(chalk.blue('🏷️  Attributes:'));
      Object.entries(elementInfo.attributes).forEach(([key, value]) => {
        if (config.projectAttributes.includes(key) || ['role', 'aria-label'].includes(key)) {
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
      if (config.output.includeConfidence) {
        console.log(chalk.white(`   Confidence: ${selectorResult.confidence}%`));
      }
      
      // ✨ Formatear para el framework específico
      console.log(chalk.green(`\n📋 Formatted for ${finalFramework} ${finalLanguage}:`));
      const formatter = new FrameworkFormatter();
      const formattedCode = formatter.format(selectorResult.selector, finalFramework, finalLanguage);
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
  .action(async (url: string, framework?: string, language?: string) => {
    // Usar configuración por defecto si no se especifica
    const config = configManager.getConfig();
    const finalFramework = framework || config.defaultFramework;
    const finalLanguage = language || config.defaultLanguage;
    
    // Resolver URL si es un alias
    const resolvedUrl = configManager.getUrl(url) || url;
    
    console.log(chalk.blue(`🚀 Opening ${resolvedUrl}...`));
    console.log(chalk.yellow(`📋 Framework: ${finalFramework}`));
    console.log(chalk.yellow(`💬 Language: ${finalLanguage}`));
    if (configManager.hasConfigFile()) {
      console.log(chalk.green(`⚙️  Using config file`));
    }
    if (resolvedUrl !== url) {
      console.log(chalk.blue(`🔗 URL alias '${url}' → ${resolvedUrl}`));
    }
    console.log(chalk.magenta(`🔀 Multiple mode: ON`));
    
    try {
      // Abrir el navegador con configuración
      const browser = await chromium.launch({ 
        headless: config.browser.headless,
        ...(config.browser.userAgent && { 
          args: [`--user-agent=${config.browser.userAgent}`] 
        })
      });
      
      const page = await browser.newPage();
      
      // Configurar viewport
      await page.setViewportSize(config.browser.viewport);
      
      // Ir a la URL con timeout configurado
      await page.goto(resolvedUrl, { 
        timeout: config.timeouts.pageLoad 
      });
      
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
      
      // Esperar hasta que presione ESC (con timeout configurado)
      console.log(chalk.blue('⏳ Waiting for ESC key... (make multiple clicks then press ESC)'));

      try {
        await page.waitForFunction('window.multipleSelectionComplete', { 
          timeout: config.timeouts.elementSelection 
        });
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
        const formattedCode = formatter.format(selectorResult.selector, finalFramework, finalLanguage);
        
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
        if (config.output.includeConfidence) {
          console.log(chalk.white(`   Confidence: ${selectorResult.confidence}%`));
        }
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
  .option('-t, --timeout <timeout>', 'timeout in milliseconds')
  .action(async (url: string, selector: string, options: { timeout?: string }) => {
    // Usar configuración para timeout si no se especifica
    const config = configManager.getConfig();
    const timeoutValue = options.timeout ? parseInt(options.timeout) : config.timeouts.validation;
    
    // Resolver URL si es un alias
    const resolvedUrl = configManager.getUrl(url) || url;
    
    console.log(chalk.blue(`🔍 Validating selector on ${resolvedUrl}...`));
    console.log(chalk.yellow(`🎯 Selector: ${selector}`));
    console.log(chalk.yellow(`⏱️  Timeout: ${timeoutValue}ms`));
    if (configManager.hasConfigFile()) {
      console.log(chalk.green(`⚙️  Using config file`));
    }
    if (resolvedUrl !== url) {
      console.log(chalk.blue(`🔗 URL alias '${url}' → ${resolvedUrl}`));
    }
    
    try {
      // Abrir el navegador con configuración
      const browser = await chromium.launch({ 
        headless: config.browser.headless,
        ...(config.browser.userAgent && { 
          args: [`--user-agent=${config.browser.userAgent}`] 
        })
      });
      
      const page = await browser.newPage();
      
      // Configurar viewport
      await page.setViewportSize(config.browser.viewport);
      
      // Ir a la URL
      console.log(chalk.blue('🌐 Loading page...'));
      await page.goto(resolvedUrl, { timeout: config.timeouts.pageLoad });
      
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
// Comandos simplificados con aliases
program
  .command('go <alias>')
  .description('Quick pick using URL alias from config')
  .action(async (alias: string) => {
    const config = configManager.getConfig();
    const url = configManager.getUrl(alias);
    
    if (!url) {
      console.log(chalk.red(`❌ URL alias '${alias}' not found in config`));
      console.log(chalk.yellow('💡 Available aliases:'));
      Object.keys(config.urls).forEach(key => {
        console.log(chalk.blue(`   ${key}: ${config.urls[key]}`));
      });
      console.log(chalk.cyan('\n🔧 Run "npm run dev init" to create a config file'));
      return;
    }
    
    console.log(chalk.green(`🚀 Quick pick mode for '${alias}'`));
    
    // Ejecutar pick con configuración por defecto
    try {
      const browser = await chromium.launch({ 
        headless: config.browser.headless 
      });
      
      const page = await browser.newPage();
      await page.setViewportSize(config.browser.viewport);
      await page.goto(url, { timeout: config.timeouts.pageLoad });
      
      console.log(chalk.green('✅ Page loaded successfully!'));
      console.log(chalk.cyan('👆 Click on any element to select it...'));
      
      // [Mismo código de inyección que el comando pick]
      await page.addScriptTag({
        content: `
          document.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const element = event.target;
            element.style.outline = '3px solid #ff0000';
            element.style.backgroundColor = '#ffff0050';
            
            window.selectedElementInfo = {
              tagName: element.tagName.toLowerCase(),
              id: element.id || '',
              className: element.className || '',
              textContent: element.textContent?.trim() || '',
              attributes: {}
            };
            
            for (let attr of element.attributes) {
              window.selectedElementInfo.attributes[attr.name] = attr.value;
            }
            
            window.elementSelected = true;
          }, true);
        `
      });
      
      await page.waitForFunction('window.elementSelected', { 
        timeout: config.timeouts.elementSelection 
      });
      
      const elementInfo: any = await page.evaluate('window.selectedElementInfo');
      
      console.log(chalk.green('\n🎯 Element selected!'));
      
      const generator = new SelectorGenerator();
      const selectorResult = generator.generateSelector(elementInfo);
      
      console.log(chalk.cyan('🎯 Best Selector:'));
      console.log(chalk.yellow(`   ${selectorResult.selector}`));
      
      const formatter = new FrameworkFormatter();
      const formattedCode = formatter.format(
        selectorResult.selector, 
        config.defaultFramework, 
        config.defaultLanguage
      );
      console.log(chalk.blue(`   ${formattedCode}`));

      try {
        const clipboardy = await import('clipboardy');
        await clipboardy.default.write(formattedCode);
        console.log(chalk.green('✅ Copied to clipboard!'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not copy to clipboard'));
      }
      
      await browser.close();
      
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
    }
  });

// Comando para mostrar configuración actual
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    const config = configManager.getConfig();
    
    console.log(chalk.blue('⚙️  Current Configuration:'));
    console.log(chalk.white(`   Default Framework: ${config.defaultFramework}`));
    console.log(chalk.white(`   Default Language: ${config.defaultLanguage}`));
    console.log(chalk.white(`   Headless Mode: ${config.browser.headless}`));
    console.log(chalk.white(`   Viewport: ${config.browser.viewport.width}x${config.browser.viewport.height}`));
    
    console.log(chalk.blue('\n🔗 URL Aliases:'));
    if (Object.keys(config.urls).length === 0) {
      console.log(chalk.yellow('   No URL aliases configured'));
    } else {
      Object.entries(config.urls).forEach(([key, value]) => {
        console.log(chalk.green(`   ${key}: ${value}`));
      });
    }
    
    console.log(chalk.blue('\n🏷️  Project Attributes:'));
    config.projectAttributes.forEach(attr => {
      console.log(chalk.green(`   ${attr}`));
    });
    
    console.log(chalk.blue('\n⏱️  Timeouts:'));
    console.log(chalk.white(`   Page Load: ${config.timeouts.pageLoad}ms`));
    console.log(chalk.white(`   Element Selection: ${config.timeouts.elementSelection}ms`));
    console.log(chalk.white(`   Validation: ${config.timeouts.validation}ms`));
    
    if (!configManager.hasConfigFile()) {
      console.log(chalk.yellow('\n💡 No config file found - using defaults'));
      console.log(chalk.cyan('🔧 Run "npm run dev init" to create a config file'));
    }
  });
// Ejecutamos el programa
program.parse();