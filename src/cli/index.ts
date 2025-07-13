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
    
    // ✨ VALIDAR COMBINACIÓN ANTES DE ABRIR NAVEGADOR
    const formatter = new FrameworkFormatter();
    try {
      // Test rápido para validar la combinación
      formatter.format('[data-test="test"]', finalFramework, finalLanguage);
    } catch (validationError: any) {
      console.log(chalk.red('❌ Error:'), validationError.message);
      return; // Salir sin abrir navegador
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
      
      // Configurar timeout infinito para la página
      page.setDefaultTimeout(0);

      // Configurar viewport
      await page.setViewportSize(config.browser.viewport);
      
    // Ir a la URL con timeout configurado
    try {
      await page.goto(resolvedUrl, { 
        timeout: config.timeouts.pageLoad 
      });
      console.log(chalk.green('✅ Page loaded successfully!'));
    } catch (error: any) {
      console.log(chalk.red('❌ Error loading page:'), error.message);
      console.log(chalk.yellow('💡 Possible causes:'));
      console.log(chalk.yellow('   - URL is unreachable or very slow'));
      console.log(chalk.yellow('   - Network connectivity issues'));
      console.log(chalk.yellow('   - Page requires longer load time'));
      console.log(chalk.blue('🔧 Try: increase pageLoad timeout in config or check URL'));
      
      // Cerrar navegador y salir limpiamente
      await browser.close();
      return;
    }
      
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
    
    // ✨ VALIDAR COMBINACIÓN ANTES DE ABRIR NAVEGADOR
    const formatter = new FrameworkFormatter();
    try {
      // Test rápido para validar la combinación
      formatter.format('[data-test="test"]', finalFramework, finalLanguage);
    } catch (validationError: any) {
      console.log(chalk.red('❌ Error:'), validationError.message);
      return; // Salir sin abrir navegador
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
      
    // Ir a la URL con timeout configurado
    try {
      await page.goto(resolvedUrl, { 
        timeout: config.timeouts.pageLoad 
      });
      console.log(chalk.green('✅ Page loaded successfully!'));
    } catch (error: any) {
      console.log(chalk.red('❌ Error loading page:'), error.message);
      console.log(chalk.yellow('💡 Possible causes:'));
      console.log(chalk.yellow('   - URL is unreachable or very slow'));
      console.log(chalk.yellow('   - Network connectivity issues'));
      console.log(chalk.yellow('   - Page requires longer load time'));
      console.log(chalk.blue('🔧 Try: increase pageLoad timeout in config or check URL'));
      
      // Cerrar navegador y salir limpiamente
      await browser.close();
      return;
    }
      
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
            
            // Capturar TODOS los atributos del elemento
            for (let attr of element.attributes) {
              elementInfo.attributes[attr.name] = attr.value;
            }
            
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

// Comando pick-toggle - navegación libre con toggle
program
  .command('pick-toggle <url> [framework] [language]')
  .description('Pick elements with toggle mode - navigate freely and turn selector mode on/off')
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
    console.log(chalk.magenta(`🎛️ Toggle mode: ON`));
    
    // ✨ VALIDAR COMBINACIÓN ANTES DE ABRIR NAVEGADOR
    const formatter = new FrameworkFormatter();
    try {
      // Test rápido para validar la combinación
      formatter.format('[data-test="test"]', finalFramework, finalLanguage);
    } catch (validationError: any) {
      console.log(chalk.red('❌ Error:'), validationError.message);
      return; // Salir sin abrir navegador
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
      
      // Configurar timeout infinito para la página
      page.setDefaultTimeout(0);

      // Configurar viewport
      await page.setViewportSize(config.browser.viewport);
      
    // Ir a la URL con timeout configurado
    try {
      await page.goto(resolvedUrl, { 
        timeout: config.timeouts.pageLoad 
      });
      console.log(chalk.green('✅ Page loaded successfully!'));
    } catch (error: any) {
      console.log(chalk.red('❌ Error loading page:'), error.message);
      console.log(chalk.yellow('💡 Possible causes:'));
      console.log(chalk.yellow('   - URL is unreachable or very slow'));
      console.log(chalk.yellow('   - Network connectivity issues'));
      console.log(chalk.yellow('   - Page requires longer load time'));
      console.log(chalk.blue('🔧 Try: increase pageLoad timeout in config or check URL'));
      
      // Cerrar navegador y salir limpiamente
      await browser.close();
      return;
    }
      
      console.log(chalk.green('✅ Page loaded successfully!'));
      console.log(chalk.cyan('🎛️ Toggle mode enabled!'));
      console.log(chalk.red('🔴 SELECTOR MODE: OFF - Navigate freely'));
      console.log(chalk.blue('💡 Press CTRL+S to turn ON selector mode'));
      console.log(chalk.blue('💡 Press CTRL+D to turn OFF selector mode'));
      console.log(chalk.yellow('💡 Press ESC to finish and get results'));
      
      // Inyectar JavaScript para modo toggle
      await page.addScriptTag({
        content: `
          // Estado global
          window.bestLocatorState = {
            selectorMode: false,
            selectedElements: [],
            elementCounter: 0
          };
          
          // Crear indicador visual
          const indicator = document.createElement('div');
          indicator.id = 'best-locator-indicator';
          indicator.style.cssText = \`
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            font-weight: bold;
            z-index: 99999;
            pointer-events: none;
            background: #ff4444;
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          \`;
          indicator.textContent = '🔴 SELECTOR: OFF';
          document.body.appendChild(indicator);
          
          // Función para actualizar indicador
          function updateIndicator() {
            const indicator = document.getElementById('best-locator-indicator');
            if (window.bestLocatorState.selectorMode) {
              indicator.textContent = '🟢 SELECTOR: ON';
              indicator.style.background = '#44ff44';
              indicator.style.color = 'black';
            } else {
              indicator.textContent = '🔴 SELECTOR: OFF';
              indicator.style.background = '#ff4444';
              indicator.style.color = 'white';
            }
          }
          
          // Función para mostrar notificación
          function showNotification(message) {
            const notification = document.createElement('div');
            notification.style.cssText = \`
              position: fixed;
              top: 60px;
              right: 10px;
              padding: 12px 16px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 14px;
              font-weight: bold;
              z-index: 99999;
              background: #333;
              color: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            \`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 2000);
          }
          
          // Toggle selector mode
          function toggleSelectorMode(enable) {
            window.bestLocatorState.selectorMode = enable;
            updateIndicator();
            
            if (enable) {
              showNotification('🎯 SELECTOR MODE: ON - Click elements to capture!');
            } else {
              showNotification('🌐 SELECTOR MODE: OFF - Navigate freely!');
            }
          }
          
          // Escuchar teclas de control
          document.addEventListener('keydown', function(event) {
            if (event.ctrlKey && event.key === 's') {
              event.preventDefault();
              toggleSelectorMode(true);
            } else if (event.ctrlKey && event.key === 'd') {
              event.preventDefault();
              toggleSelectorMode(false);
            } else if (event.key === 'Escape') {
              window.toggleSessionComplete = true;
            }
          });
          
          // Escuchar clicks
          document.addEventListener('click', function(event) {
            if (window.bestLocatorState.selectorMode) {
              // MODO ON - Capturar selector
              event.preventDefault();
              event.stopPropagation();
              
              const element = event.target;
              window.bestLocatorState.elementCounter++;
              
              // Highlight del elemento
              element.style.outline = '3px solid #ff0000';
              element.style.backgroundColor = '#ffff0050';
              
              // Guardar información del elemento
              const elementInfo = {
                order: window.bestLocatorState.elementCounter,
                tagName: element.tagName.toLowerCase(),
                id: element.id || '',
                className: element.className || '',
                textContent: element.textContent?.trim() || '',
                pageUrl: window.location.href,
                attributes: {}
              };
              
              // Capturar TODOS los atributos del elemento
              for (let attr of element.attributes) {
                elementInfo.attributes[attr.name] = attr.value;
              }
              
              window.bestLocatorState.selectedElements.push(elementInfo);
              console.log('✅ Element captured:', window.bestLocatorState.elementCounter, elementInfo.tagName);
              
              // Mostrar notificación
              showNotification(\`✅ Element \${window.bestLocatorState.elementCounter} captured! (\${window.bestLocatorState.selectedElements.length} total)\`);
              
            } else {
              // MODO OFF - Navegación libre (no hacer nada especial)
              console.log('🌐 Free navigation - click ignored for selection');
            }
          }, true);
          
          console.log('🎛️ Toggle mode script loaded successfully');
        `
      });

      // ✨ DETECTAR CIERRE DEL NAVEGADOR
      page.on('close', () => {
      console.log(chalk.yellow('\n🚪 Browser closed by user - processing captured elements...'));
      });

      browser.on('disconnected', () => {
      console.log(chalk.yellow('\n🔌 Browser disconnected - finishing session...'));
      });

      
      // Esperar hasta que presione ESC (con timeout configurado)
      console.log(chalk.blue('⏳ Use CTRL+S/CTRL+D to toggle selector mode, ESC to finish...'));
      console.log(chalk.yellow('⏰ Session expires in 10 minutes if no activity'));

      try {
        await page.waitForFunction('window.toggleSessionComplete', { timeout: 600000 });  // 10 minutos
        console.log(chalk.green('✅ ESC detected - processing session...'));
      } catch (error) {
        console.log(chalk.yellow('⏰ 10 minute session expired - processing captured elements...'));
      }

      
      // Obtener todos los elementos seleccionados
      let selectedElements = [];
      try {
        const sessionData: any = await page.evaluate('window.bestLocatorState');
        selectedElements = sessionData.selectedElements || [];
      } catch (error) {
        // Si la página se cerró, no podemos obtener elementos
        console.log(chalk.yellow('⚠️  Unable to retrieve elements - browser was closed before processing'));
        selectedElements = [];
}
      
      if (selectedElements.length === 0) {
        console.log(chalk.yellow('⚠️  No elements were captured'));
        await browser.close();
        return;
      }
      
      // Procesar cada elemento
      console.log(chalk.green(`\n🎯 Session completed! ${selectedElements.length} elements captured:`));
      
      const generator = new SelectorGenerator();
      const results = [];
      
      for (const elementInfo of selectedElements) {
        const selectorResult = generator.generateSelector(elementInfo);
        const formattedCode = formatter.format(selectorResult.selector, finalFramework, finalLanguage);
        
        results.push({
          order: elementInfo.order,
          tagName: elementInfo.tagName,
          textContent: elementInfo.textContent,
          pageUrl: elementInfo.pageUrl,
          selector: selectorResult.selector,
          code: formattedCode,
          confidence: selectorResult.confidence
        });
        
        console.log(chalk.blue(`\n📋 Element ${elementInfo.order}:`));
        console.log(chalk.white(`   Tag: ${elementInfo.tagName}`));
        console.log(chalk.white(`   Page: ${elementInfo.pageUrl}`));
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