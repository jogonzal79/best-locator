#!/usr/bin/env node

// Best-Locator CLI - Universal Selector Generator
// Importamos las librerías que necesitamos
import { Command } from 'commander';
import chalk from 'chalk';
import { chromium } from 'playwright';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { SelectorValidator } from '../core/selector-validator.js';
import { ConfigManager } from '../core/config-manager.js';
import { AIEngine } from '../core/ai-engine.js';

// Verificar que estamos ejecutando desde la versión correcta
const packageJson = JSON.parse(
  await import('fs').then(fs => 
    fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  )
);

// Definir tipos para evitar errores en runtime (especialmente en Node)
declare global {
  interface Window {
    elementSelected?: boolean;
    selectedElementInfo?: any;
    selectedElements?: any[];
    multipleSelectionComplete?: boolean;
    toggleSessionComplete?: boolean;
    bestLocatorActiveOverlay?: HTMLElement | null;
    bestLocatorState?: any;
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
  .version(packageJson.version);

program
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method');

// Mostrar información de instalación cuando se ejecuta sin argumentos
if (process.argv.length <= 2) {
  console.log(chalk.green('🧪 Best-Locator - Quick Start'));
  console.log(chalk.white('\nExamples:'));
  console.log(chalk.white('  best-locator pick https://saucedemo.com'));
  console.log(chalk.white('  best-locator pick-multiple https://saucedemo.com'));
  console.log(chalk.white('  best-locator pick-toggle https://saucedemo.com'));
  console.log(chalk.white('\nOptions:'));
  console.log(chalk.white('  --ai          Enable AI selector generation'));
  console.log(chalk.white('  --explain     Explain AI decisions'));
  console.log(chalk.white('  --no-fallback Fail if AI fails instead of traditional fallback'));
  console.log(chalk.blue('\n🌐 Documentation: https://github.com/jogonzal79/best-locator'));
  process.exit(0);
}

// Comando hello (para testing de instalación)
program
  .command('hello')
  .description('Test that Best-Locator is working correctly')
  .action(() => {
    console.log(chalk.green('🎉 Best-Locator v' + packageJson.version + ' is working!'));
    console.log(chalk.blue('✨ Ready to generate awesome selectors!'));
    if (configManager.hasConfigFile()) {
      console.log(chalk.green('⚙️  Configuration file detected!'));
    } else {
      console.log(chalk.yellow('💡 Run "best-locator init" to create a config file'));
    }
  });

// Comando para crear configuración de ejemplo
program
  .command('init')
  .description('Create a sample configuration file')
  .action(() => {
    if (configManager.hasConfigFile()) {
      console.log(chalk.yellow('⚠️  A configuration file already exists.'));
    } else {
      configManager.createSampleConfig();
    }
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
    
    // Validaciones básicas
    const allowedFrameworks = ['playwright', 'cypress', 'selenium'];
    const allowedLanguages = ['typescript', 'javascript', 'python'];
    
    if (!allowedFrameworks.includes(finalFramework)) {
      console.log(chalk.red(`❌ Invalid framework. Allowed: ${allowedFrameworks.join(', ')}`));
      return;
    }
    
    if (!allowedLanguages.includes(finalLanguage)) {
      console.log(chalk.red(`❌ Invalid language. Allowed: ${allowedLanguages.join(', ')}`));
      return;
    }
    
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
        args: ['--disable-blink-features=AutomationControlled']
      });
      
      console.log(chalk.green('✅ Browser launched successfully!'));
      
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
    } catch (loadError: any) {
      console.log(chalk.red('❌ Page load error:'), loadError.message);
      await browser.close();
      return;
    }
      
      // Mostrar instrucciones
      console.log(chalk.blue('\n🖱️  Click any element to generate a selector'));
      console.log(chalk.white('   Press ESC if you want to cancel.'));
      
      // Inyectar script para capturar el elemento seleccionado
      await page.addInitScript(() => {
        window.elementSelected = false;
        window.selectedElementInfo = {};
      });
      
      await page.evaluate(() => {
        document.addEventListener('click', (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          
          const element = event.target as HTMLElement;
          
          if (!element) return;
          
          // Capturar información relevante
          window.selectedElementInfo = {
            tagName: element.tagName.toLowerCase(),
            id: element.id || '',
            className: element.className || '',
            textContent: element.textContent?.trim() || '',
            attributes: {}
          };
          
          // Capturar todos los atributos
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            window.selectedElementInfo.attributes[attr.name] = attr.value;
          }
          
          // Marcar que ya seleccionamos un elemento
          window.elementSelected = true;
        }, true);
      });
      
      // Esperar hasta que el usuario haga click en un elemento (con timeout configurado)
      await page.waitForFunction('window.elementSelected', { 
        timeout: config.timeouts.elementSelection 
      });
      
      console.log(chalk.green('\n🎯 Element selected!'));
      
      // Obtener la información del elemento
      const elementInfo: any = await page.evaluate('window.selectedElementInfo');
      
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
      
      // 🧠 Generar selector inteligente con IA
      console.log(chalk.magenta('\n🧠 Generating smart selector...'));
      const generator = new SelectorGenerator(config);
      let selectorResult;
      const globalOptions = program.opts?.() || {};
      const useAI = globalOptions.ai && config.ai?.enabled;
      
      if (useAI && generator.generateSelectorWithAI) {
        const pageContext = { 
          url: await page.url(), 
          title: await page.title(),
          pageType: 'webapp'
        };
        try {
          selectorResult = await generator.generateSelectorWithAI(elementInfo, pageContext);
        } catch (err) {
          if (globalOptions.noFallback) {
            console.log(chalk.red('❌ AI failed and fallback disabled'));
            throw err;
          }
          console.log(chalk.yellow('⚠️  AI failed, falling back to traditional method'));
          selectorResult = generator.generateSelector(elementInfo);
        }
      } else {
        selectorResult = generator.generateSelector(elementInfo);
      }
      
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

      // 🧠 AI Explanation si está habilitado
      if (globalOptions.ai && globalOptions.explain && config.ai?.enabled) {
        try {
          const aiEngine = new AIEngine(config);
          const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo);
          console.log(chalk.magenta(`\n🧠 AI Explanation: ${explanation}`));
        } catch (error) {
          console.log(chalk.yellow('⚠️  AI explanation not available'));
        }
      }

      // 📋 Copiar al portapapeles
      try {
        const clipboardy = await import('clipboardy');
        await clipboardy.default.write(formattedCode);
        console.log(chalk.green('✅ Copied to clipboard!'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not copy to clipboard'));
      }
      
      console.log(chalk.green('\n✅ Done!'));
      
      // Cerrar el navegador
      await browser.close();
      
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
    }
  });

// Comando pick-multiple - selección múltiple
// Comando pick-multiple - selección múltiple
program
  .command('pick-multiple <url> [framework] [language]')
  .description('Pick multiple elements from a webpage and generate selectors')
  .action(async (url: string, framework?: string, language?: string) => {
    const config = configManager.getConfig();
    const finalFramework = framework || config.defaultFramework;
    const finalLanguage = language || config.defaultLanguage;
    
    const resolvedUrl = configManager.getUrl(url) || url;
    
    console.log(chalk.blue(`🚀 Opening ${resolvedUrl} (multiple mode)...`));
    
    const allowedFrameworks = ['playwright', 'cypress', 'selenium'];
    const allowedLanguages = ['typescript', 'javascript', 'python'];
    
    if (!allowedFrameworks.includes(finalFramework)) {
      console.log(chalk.red(`❌ Invalid framework. Allowed: ${allowedFrameworks.join(', ')}`));
      return;
    }
    
    if (!allowedLanguages.includes(finalLanguage)) {
      console.log(chalk.red(`❌ Invalid language. Allowed: ${allowedLanguages.join(', ')}`));
      return;
    }
    
    const formatter = new FrameworkFormatter();
    try {
      formatter.format('[data-test="test"]', finalFramework, finalLanguage);
    } catch (validationError: any) {
      console.log(chalk.red('❌ Error:'), validationError.message);
      return;
    }
    
    try {
      const browser = await chromium.launch({ 
        headless: config.browser.headless,
        args: ['--disable-blink-features=AutomationControlled']
      });
      
      const page = await browser.newPage();
      page.setDefaultTimeout(0);
      await page.setViewportSize(config.browser.viewport);
      
      try {
        await page.goto(resolvedUrl, { timeout: config.timeouts.pageLoad });
        console.log(chalk.green('✅ Page loaded successfully!'));
      } catch (loadError: any) {
        console.log(chalk.red('❌ Page load error:'), loadError.message);
        await browser.close();
        return;
      }
      
      console.log(chalk.blue('\n🖱️  Click multiple elements to capture them'));
      console.log(chalk.white('   Press ESC when finished.'));
      
      // ✅ SCRIPT MEJORADO CON MEJOR INYECCIÓN (reemplaza addInitScript anterior)
      await page.evaluate(() => {
        // Limpiar estado previo
        (window as any).multipleSelectionComplete = false;
        (window as any).selectedElements = [];
        
        console.log('🚀 Multiple selection script loaded');
        
        // Función para manejar clicks
        function handleClick(event: MouseEvent) {
          event.preventDefault();
          event.stopPropagation();
          
            const element = event.target as HTMLElement;
            if (!element) return;
            
            console.log('🎯 Element clicked:', element.tagName);
            
            const elementInfo = {
              order: (window as any).selectedElements.length + 1,
              tagName: element.tagName.toLowerCase(),
              id: element.id || '',
              className: element.className || '',
              textContent: element.textContent?.trim() || '',
              attributes: {} as any
            };
            
            // Capturar atributos
            for (let i = 0; i < element.attributes.length; i++) {
              const attr = element.attributes[i];
              (elementInfo as any).attributes[attr.name] = attr.value;
            }
            
            (window as any).selectedElements.push(elementInfo);
            
            // Feedback visual inmediato
            element.style.outline = '4px solid #00ff00';
            element.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
            element.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
            
            // Crear badge con número
            const rect = element.getBoundingClientRect();
            const badge = document.createElement('div');
            badge.textContent = String(elementInfo.order);
            badge.style.cssText = `
              position: fixed;
              top: ${rect.top - 10}px;
              left: ${rect.left - 10}px;
              background: #00ff00;
              color: #000;
              width: 25px;
              height: 25px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 12px;
              z-index: 999999;
              box-shadow: 0 0 6px rgba(0,0,0,0.4);
              font-family: system-ui, sans-serif;
              pointer-events: none;
            `;
            document.body.appendChild(badge);
            
            console.log(`✅ Element ${elementInfo.order} captured:`, elementInfo);
            
            // Limpiar después de 3 segundos
            setTimeout(() => {
              element.style.outline = '';
              element.style.backgroundColor = '';
              element.style.boxShadow = '';
              badge.remove();
            }, 3000);
        }
        
        // Función para manejar ESC
        function handleKeyDown(event: KeyboardEvent) {
          console.log('🔑 Key pressed:', event.key);
          if (event.key === 'Escape') {
            console.log('🏁 ESC detected - finishing selection');
            (window as any).multipleSelectionComplete = true;
          }
        }
        
        // Agregar event listeners (capturing = true para interceptar primero)
        document.addEventListener('click', handleClick, true);
        document.addEventListener('keydown', handleKeyDown, true);
        
        console.log('✅ Event listeners attached for multiple selection');
      });
      
      // Esperar hasta que presione ESC
      console.log(chalk.blue('⏳ Waiting for ESC key... (make multiple clicks then press ESC)'));

      try {
        await page.waitForFunction('window.multipleSelectionComplete', { 
          timeout: config.timeouts.elementSelection 
        });
        console.log(chalk.green('✅ ESC detected - processing selections...'));
      } catch (error) {
        console.log(chalk.red('⏰ Timeout waiting for ESC - processing current selections...'));
      }
      
      // ✅ Recuperar elementos
      let selectedElements: any[] = [];
      try {
        selectedElements = await page.evaluate('window.selectedElements') || [];
      } catch (evalError) {
        console.log(chalk.yellow('⚠️  Could not retrieve elements from page'));
        selectedElements = [];
      }
      
      if (selectedElements.length === 0) {
        console.log(chalk.yellow('⚠️  No elements were selected'));
        await browser.close();
        return;
      }
      
      console.log(chalk.green(`\n🎯 ${selectedElements.length} elements selected!`));
      
      const generator = new SelectorGenerator(config);
      const results: any[] = [];
      
      const globalOptions = program.opts?.() || {};
      const useAI = globalOptions.ai && config.ai?.enabled;

      for (const elementInfo of selectedElements) {
        let selectorResult: any;
        if (useAI && (generator as any).generateSelectorWithAI) {
          const pageContext = { 
            url: resolvedUrl, 
            title: await page.title(),
            pageType: 'webapp'
          };
          try {
            selectorResult = await (generator as any).generateSelectorWithAI(elementInfo, pageContext);
          } catch (err) {
            if (globalOptions.noFallback) {
              console.log(chalk.red('❌ AI failed and fallback disabled'));
              throw err;
            }
            console.log(chalk.yellow('⚠️  AI failed on one element, using traditional method for it'));
            selectorResult = generator.generateSelector(elementInfo);
          }
        } else {
          selectorResult = generator.generateSelector(elementInfo);
        }

        const formattedCode = formatter.format(selectorResult.selector, finalFramework, finalLanguage);

        // Explicación IA (opcional)
        if (globalOptions.ai && globalOptions.explain && config.ai?.enabled) {
          try {
            const aiEngine = new AIEngine(config);
            const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo);
            console.log(chalk.magenta(`   🧠 AI Explanation: ${explanation}`));
          } catch (error) {
            console.log(chalk.yellow('   ⚠️  AI explanation not available'));
          }
        }

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
      
      // Resumen
      console.log(chalk.green('\n✅ Completed!'));
      console.log(chalk.blue('📦 Export summary:'));
      console.log(chalk.white(`   Total selectors: ${results.length}`));
      
      await browser.close();
      
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
    }
  });


// Comando pick-toggle - navegación libre con toggle
program
  .command('pick-toggle <url> [framework] [language]')
  .description('Navigate freely and toggle selector capture with CTRL+S/CTRL+D')
  .action(async (url: string, framework?: string, language?: string) => {
    const config = configManager.getConfig();
    const finalFramework = framework || config.defaultFramework;
    const finalLanguage = language || config.defaultLanguage;
    const resolvedUrl = configManager.getUrl(url) || url;
    
    console.log(chalk.blue(`🚀 Opening ${resolvedUrl} (professional toggle mode)...`));
    
    const allowedFrameworks = ['playwright', 'cypress', 'selenium'];
    const allowedLanguages = ['typescript', 'javascript', 'python'];
    
    if (!allowedFrameworks.includes(finalFramework)) {
      console.log(chalk.red(`❌ Invalid framework. Allowed: ${allowedFrameworks.join(', ')}`));
      return;
    }
    
    if (!allowedLanguages.includes(finalLanguage)) {
      console.log(chalk.red(`❌ Invalid language. Allowed: ${allowedLanguages.join(', ')}`));
      return;
    }
    
    const formatter = new FrameworkFormatter();
    try {
      formatter.format('[data-test="test"]', finalFramework, finalLanguage);
    } catch (validationError: any) {
      console.log(chalk.red('❌ Error:'), validationError.message);
      return;
    }
    
    try {
      const browser = await chromium.launch({ 
        headless: config.browser.headless,
        args: ['--disable-blink-features=AutomationControlled']
      });
      
      const page = await browser.newPage();
      page.setDefaultTimeout(0);
      await page.setViewportSize(config.browser.viewport);
      
      try {
        await page.goto(resolvedUrl, { timeout: config.timeouts.pageLoad });
        console.log(chalk.green('✅ Page loaded successfully!'));
      } catch (loadError: any) {
        console.log(chalk.red('❌ Page load error:'), loadError.message);
        await browser.close();
        return;
      }
      
      // ================== BLOQUE REEMPLAZADO SEGÚN SOLICITUD ==================
      console.log(chalk.blue('\n🌐 Professional Toggle Mode Active!'));
      console.log(chalk.white('   1. Navigate freely - login, browse, interact normally'));
      console.log(chalk.green('   2. Press CTRL+S - Turn ON selector capture mode'));
      console.log(chalk.white('   3. Click elements - Capture high-quality selectors'));
      console.log(chalk.red('   4. Press CTRL+D - Turn OFF selector capture mode'));
      console.log(chalk.white('   5. Repeat as needed - navigate to other pages, toggle on/off'));
      console.log(chalk.yellow('   6. Press ESC - Finish and get all selectors'));
      
      // ✅ SCRIPT TOGGLE COMPLETAMENTE REESCRITO
      await page.evaluate(() => {
        console.log('🚀 Toggle mode script starting...');
        
        // Estado global
        (window as any).bestLocatorState = {
          selectionActive: false,
          selectedElements: [],
            overlayElement: null,
            sessionStartTime: Date.now()
        };
        (window as any).toggleSessionComplete = false;
        
        // Crear overlay
        function createOverlay() {
          console.log('📊 Creating overlay...');
          
          // Remover overlay existente
          const existing = document.getElementById('__best_locator_overlay__');
          if (existing) existing.remove();
          
          const overlay = document.createElement('div');
          overlay.id = '__best_locator_overlay__';
          overlay.style.cssText = `
            position: fixed !important;
            top: 25px !important;
            right: 25px !important;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important;
            color: white !important;
            padding: 18px 24px !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            border-radius: 12px !important;
            z-index: 2147483647 !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
            border: 2px solid #00ff88 !important;
            pointer-events: none !important;
            min-width: 280px !important;
            max-width: 320px !important;
          `;
          
          document.body.appendChild(overlay);
          (window as any).bestLocatorState.overlayElement = overlay;
          console.log('✅ Overlay created and attached');
          updateOverlay();
        }
        
        // Actualizar overlay
        function updateOverlay() {
          const overlay = (window as any).bestLocatorState.overlayElement;
          if (!overlay) return;
          
          const state = (window as any).bestLocatorState;
          const sessionTime = Math.floor((Date.now() - state.sessionStartTime) / 1000);
          const minutes = Math.floor(sessionTime / 60);
          const seconds = sessionTime % 60;
          
          const statusColor = state.selectionActive ? '#00ff88' : '#ff6b6b';
          const statusText = state.selectionActive ? 'CAPTURING' : 'NAVIGATING';
          const statusIcon = state.selectionActive ? '🎯' : '🌐';
          
          overlay.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="font-size: 18px; margin-right: 10px;">${statusIcon}</div>
              <div>
                <div style="font-weight: bold; color: ${statusColor}; font-size: 14px;">
                  ${statusText}
                </div>
                <div style="font-size: 11px; opacity: 0.8;">
                  Best-Locator Pro
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 10px;">
              <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">ELEMENTS CAPTURED</div>
              <div style="font-size: 20px; font-weight: bold; color: #00ff88;">
                ${state.selectedElements.length}
              </div>
            </div>
            
            <div style="margin-bottom: 12px;">
              <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">SESSION TIME</div>
              <div style="font-size: 12px; font-weight: 500;">
                ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
              </div>
            </div>
            
            <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
              <div style="font-size: 10px; opacity: 0.6; line-height: 1.4;">
                ${state.selectionActive ? 'CTRL+D to stop' : 'CTRL+S to start'} • ESC to finish
              </div>
            </div>
          `;
          
          overlay.style.borderColor = statusColor;
        }
        
        // Mostrar notificación
        function showNotification(title: string, message: string, color: string) {
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: rgba(0, 0, 0, 0.9) !important;
            color: white !important;
            padding: 20px 30px !important;
            border-radius: 12px !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
            text-align: center !important;
            z-index: 2147483647 !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
            border: 2px solid ${color} !important;
            pointer-events: none !important;
          `;
          
          notification.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${title}</div>
            <div style="font-size: 13px; opacity: 0.9;">${message}</div>
          `;
          
          document.body.appendChild(notification);
          console.log(`📢 Notification shown: ${title}`);
          
          setTimeout(() => {
            notification.remove();
          }, 2000);
        }
        
        // Event listeners
        function handleKeyDown(event: KeyboardEvent) {
          console.log(`🔑 Key combination: ctrl=${event.ctrlKey}, key=${event.key}`);
          
          // CTRL+S = Activar
          if (event.ctrlKey && event.key.toLowerCase() === 's') {
            event.preventDefault();
            if (!(window as any).bestLocatorState.selectionActive) {
              (window as any).bestLocatorState.selectionActive = true;
              updateOverlay();
              showNotification('🎯 Capture Mode ON', 'Click elements to capture selectors', '#00ff88');
              console.log('✅ Capture mode ACTIVATED');
            }
          }
          
          // CTRL+D = Desactivar
          if (event.ctrlKey && event.key.toLowerCase() === 'd') {
            event.preventDefault();
            if ((window as any).bestLocatorState.selectionActive) {
              (window as any).bestLocatorState.selectionActive = false;
              updateOverlay();
              showNotification('🌐 Navigation Mode ON', 'Browse freely, use CTRL+S to capture', '#ff6b6b');
              console.log('✅ Navigation mode ACTIVATED');
            }
          }
          
          // ESC = Finalizar
          if (event.key === 'Escape') {
            event.preventDefault();
            console.log('🏁 ESC pressed - ending session');
            showNotification('🏁 Session Ending', 'Processing captured elements...', '#ffa500');
            (window as any).toggleSessionComplete = true;
          }
        }
        
        // Click handler
        function handleClick(event: MouseEvent) {
          if (!(window as any).bestLocatorState.selectionActive) return;
          
          event.preventDefault();
          event.stopPropagation();
          
          const element = event.target as HTMLElement;
          if (!element || element.closest('#__best_locator_overlay__')) return;
          
          console.log('🎯 Element captured:', element.tagName);
          
          const elementInfo = {
            order: (window as any).bestLocatorState.selectedElements.length + 1,
            tagName: element.tagName.toLowerCase(),
            id: element.id || '',
            className: element.className || '',
            textContent: element.textContent?.trim().substring(0, 100) || '',
            attributes: {} as any,
            pageUrl: location.href,
            pageTitle: document.title,
            timestamp: new Date().toISOString()
          };
          
          // Capturar atributos
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            elementInfo.attributes[attr.name] = attr.value;
          }
          
          (window as any).bestLocatorState.selectedElements.push(elementInfo);
          
          // Efecto visual
          element.style.outline = '3px solid #00ff88';
          element.style.backgroundColor = 'rgba(0, 255, 136, 0.15)';
          
          // Número flotante
          const badge = document.createElement('div');
          badge.textContent = String(elementInfo.order);
          badge.style.cssText = `
            position: fixed !important;
            top: ${event.clientY - 15}px !important;
            left: ${event.clientX - 15}px !important;
            background: #00ff88 !important;
            color: white !important;
            width: 30px !important;
            height: 30px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-weight: bold !important;
            font-size: 14px !important;
            z-index: 2147483647 !important;
            pointer-events: none !important;
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4) !important;
          `;
          
          document.body.appendChild(badge);
          updateOverlay();
          
          setTimeout(() => {
            element.style.outline = '';
            element.style.backgroundColor = '';
            badge.remove();
          }, 2500);
        }
        
        // Agregar event listeners
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('click', handleClick, true);
        
        // Crear overlay después de un delay
        setTimeout(() => {
          createOverlay();
          console.log('✅ Toggle mode script fully loaded');
        }, 500);
        
        // Actualizar timer cada segundo
        setInterval(updateOverlay, 1000);
      });
      // ================== FIN BLOQUE REEMPLAZADO ==================
      
      console.log(chalk.blue('⏳ Professional session running... use controls as shown above'));
      
      try {
        await page.waitForFunction('window.toggleSessionComplete', { 
          timeout: config.timeouts.elementSelection 
        });
        console.log(chalk.green('✅ Session completed - processing captured elements...'));
      } catch (error) {
        console.log(chalk.yellow('⏰ Session timeout - processing captured elements...'));
      }
      
      // Obtener elementos capturados
      let selectedElements: any[] = [];
      try {
        const sessionData = await page.evaluate(() => (window as any).bestLocatorState);
        selectedElements = sessionData?.selectedElements || [];
      } catch (error) {
        console.log(chalk.yellow('⚠️  Unable to retrieve session data'));
        selectedElements = [];
      }
      
      if (selectedElements.length === 0) {
        console.log(chalk.yellow('⚠️  No elements were captured during the session'));
        await browser.close();
        return;
      }
      
      console.log(chalk.green(`\n🎯 Professional session completed! ${selectedElements.length} elements captured`));
      
      const generator = new SelectorGenerator(config);
      const formatter2 = new FrameworkFormatter();
      const results: any[] = [];
      const globalOptions = program.opts?.() || {};
      const useAI = globalOptions.ai && config.ai?.enabled;
      
      // Procesar cada elemento con IA
      for (const elementInfo of selectedElements) {
        let selectorResult;
        if (useAI && (generator as any).generateSelectorWithAI) {
          const pageContext = { 
            url: elementInfo.pageUrl || resolvedUrl, 
            title: elementInfo.pageTitle || await page.title(),
            pageType: 'webapp'
          };
          try {
            selectorResult = await (generator as any).generateSelectorWithAI(elementInfo, pageContext);
          } catch (err) {
            if (globalOptions.noFallback) {
              console.log(chalk.red('❌ AI failed and fallback disabled'));
              throw err;
            }
            console.log(chalk.yellow(`⚠️  AI failed for element ${elementInfo.order}, using traditional method`));
            selectorResult = generator.generateSelector(elementInfo);
          }
        } else {
          selectorResult = generator.generateSelector(elementInfo);
        }
        
        const formattedCode = formatter2.format(selectorResult.selector, finalFramework, finalLanguage);

        // AI Explanation si está habilitado
        if (globalOptions.ai && globalOptions.explain && config.ai?.enabled) {
          try {
            const aiEngine = new AIEngine(config);
            const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo);
            console.log(chalk.magenta(`   🧠 AI Analysis: ${explanation}`));
          } catch (error) {
            // Silencioso si falla la explicación
          }
        }
        
        results.push({
          order: elementInfo.order,
          tagName: elementInfo.tagName,
          textContent: elementInfo.textContent,
          pageUrl: elementInfo.pageUrl,
          pageTitle: elementInfo.pageTitle,
          selector: selectorResult.selector,
          code: formattedCode,
          confidence: selectorResult.confidence,
          timestamp: elementInfo.timestamp
        });
        
        console.log(chalk.blue(`\n📋 Element ${elementInfo.order}:`));
        console.log(chalk.white(`   Page: ${elementInfo.pageTitle}`));
        console.log(chalk.white(`   Tag: ${elementInfo.tagName}`));
        console.log(chalk.white(`   Text: "${elementInfo.textContent.substring(0, 50)}${elementInfo.textContent.length > 50 ? '...' : ''}"`));
        console.log(chalk.yellow(`   Selector: ${selectorResult.selector}`));
        console.log(chalk.cyan(`   Code: ${formattedCode}`));
        if (config.output.includeConfidence) {
          console.log(chalk.white(`   Confidence: ${selectorResult.confidence}%`));
        }
        console.log(chalk.gray(`   Captured: ${new Date(elementInfo.timestamp).toLocaleTimeString()}`));
      }
      
      // Resumen profesional
      console.log(chalk.green('\n🏆 Professional Session Summary:'));
      console.log(chalk.blue(`📊 Total elements captured: ${results.length}`));
      console.log(chalk.blue(`🌐 Pages visited: ${[...new Set(results.map(r => r.pageTitle))].length}`));
      console.log(chalk.blue(`⚡ High-confidence selectors: ${results.filter(r => r.confidence >= 90).length}`));
      
      await browser.close();
      
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
    }
  });

// Comando validate - validar un selector en una URL
program
  .command('validate <url> <selector>')
  .description('Validate a selector on a webpage')
  .action(async (url: string, selector: string) => {
    const config = configManager.getConfig();
    const resolvedUrl = configManager.getUrl(url) || url;
    
    console.log(chalk.blue(`🧪 Validating selector on ${resolvedUrl}...`));
    
    try {
      const browser = await chromium.launch({ headless: config.browser.headless });
      const page = await browser.newPage();
      await page.setViewportSize(config.browser.viewport);
      
      try {
        await page.goto(resolvedUrl, { timeout: config.timeouts.pageLoad });
        console.log(chalk.green('✅ Page loaded successfully!'));
      } catch (loadError: any) {
        console.log(chalk.red('❌ Page load error:'), loadError.message);
        await browser.close();
        return;
      }
      
      const validator = new SelectorValidator();
      
      const start = Date.now();
      const result = await validator.validate(page, selector);
      const duration = Date.now() - start;
      
      if (result.status === 'passed') {
        console.log(chalk.green('\n✅ Selector is valid!'));
        console.log(chalk.white(`   Elements found: ${result.elementCount}`));
      } else {
        console.log(chalk.red('\n❌ Selector validation failed.'));
        console.log(chalk.red(`   Issue: ${result.message || 'Unknown error'}`));
      }
      
      console.log(chalk.blue(`\n⏱️  Validation time: ${duration}ms`));
      
      await browser.close();
      
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
    }
  });

// Comando go - abrir un alias de URL
program
  .command('go <alias>')
  .description('Open a configured URL alias in the browser and pick an element')
  .action(async (alias: string) => {
    const config = configManager.getConfig();
    const resolvedUrl = configManager.getUrl(alias);
    
    if (!resolvedUrl) {
      console.log(chalk.red(`❌ Alias "${alias}" not found in configuration.`));
      return;
    }
    
    console.log(chalk.blue(`🚀 Opening alias "${alias}" → ${resolvedUrl}`));
    
    try {
      const browser = await chromium.launch({ headless: config.browser.headless });
      const page = await browser.newPage();
      page.setDefaultTimeout(0);
      await page.setViewportSize(config.browser.viewport);
      await page.goto(resolvedUrl, { timeout: config.timeouts.pageLoad });
      
      console.log(chalk.blue('\n🖱️  Click an element to generate a selector (alias mode)'));
      
      await page.addInitScript(() => {
        window.elementSelected = false;
        window.selectedElementInfo = {};
      });
      
      await page.evaluate(() => {
        document.addEventListener('click', (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          
          const element = event.target as HTMLElement;
          if (!element) return;
          
          window.selectedElementInfo = {
            tagName: element.tagName.toLowerCase(),
            id: element.id || '',
            className: element.className || '',
            textContent: element.textContent?.trim() || '',
            attributes: {}
          };
          
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            window.selectedElementInfo.attributes[attr.name] = attr.value;
          }
          
          window.elementSelected = true;
        }, true);
      });
      
      await page.waitForFunction('window.elementSelected', { 
        timeout: config.timeouts.elementSelection 
      });
      
      const elementInfo: any = await page.evaluate('window.selectedElementInfo');
      
      console.log(chalk.green('\n🎯 Element selected!'));
      
      const generator = new SelectorGenerator(config);
      let selectorResult;
      const globalOptions = program.opts?.() || {};
      const useAI = globalOptions.ai && config.ai?.enabled;
      
      if (useAI && generator.generateSelectorWithAI) {
        const pageContext = { 
          url: await page.url(), 
          title: await page.title(),
          pageType: 'webapp'
        };
        try {
          selectorResult = await generator.generateSelectorWithAI(elementInfo, pageContext);
        } catch (err) {
          if (globalOptions.noFallback) {
            console.log(chalk.red('❌ AI failed and fallback disabled'));
            throw err;
          }
          console.log(chalk.yellow('⚠️  AI failed, using traditional method'));
          selectorResult = generator.generateSelector(elementInfo);
        }
      } else {
        selectorResult = generator.generateSelector(elementInfo);
      }
      
      console.log(chalk.cyan('🎯 Best Selector:'));
      console.log(chalk.yellow(`   ${selectorResult.selector}`));
      
      const formatter = new FrameworkFormatter();
      const formatted = formatter.format(selectorResult.selector, config.defaultFramework, config.defaultLanguage);
      console.log(chalk.blue(`   ${formatted}`));
      
      // 🧠 AI Explanation si está habilitado
      if (globalOptions.ai && globalOptions.explain && config.ai?.enabled) {
        try {
          const aiEngine = new AIEngine(config);
          const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo);
          console.log(chalk.magenta(`\n🧠 AI Explanation: ${explanation}`));
        } catch (error) {
          console.log(chalk.yellow('⚠️  AI explanation not available'));
        }
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
    
    // 🧠 Mostrar configuración IA
    console.log(chalk.blue('\n🧠 AI Configuration:'));
    if (config.ai?.enabled) {
      console.log(chalk.green(`   Status: Enabled`));
      console.log(chalk.white(`   Model: ${config.ai.ollama.model}`));
      console.log(chalk.white(`   Host: ${config.ai.ollama.host}`));
      console.log(chalk.white(`   Timeout: ${config.ai.ollama.timeout}ms`));
    } else {
      console.log(chalk.yellow('   Status: Disabled'));
      console.log(chalk.cyan('   Run "best-locator ai-setup" to enable AI features'));
    }
    
    if (!configManager.hasConfigFile()) {
      console.log(chalk.yellow('\n💡 No config file found - using defaults'));
      console.log(chalk.cyan('🔧 Run "best-locator init" to create a config file'));
    }
  });

// Comando AI setup
program
  .command('ai-setup')
  .description('Setup and configure AI features')
  .option('--model <model>', 'Ollama model to use', 'llama3.2')
  .action(async (options) => {
    console.log(chalk.blue('🧠 Setting up AI features...'));
    
    try {
      const config = configManager.getConfig();
      const aiEngine = new AIEngine(config);
      const available = await aiEngine.isAvailable();
      
      if (!available) {
        console.log(chalk.red('❌ Ollama not found. Please install Ollama first:'));
        console.log(chalk.yellow('   curl -fsSL https://ollama.ai/install.sh | sh'));
        console.log(chalk.yellow('   ollama serve'));
        console.log(chalk.blue('\n🔗 Or visit: https://ollama.ai'));
        return;
      }
      
      console.log(chalk.green('✅ Ollama is running'));
      
      if (options.model) {
        console.log(chalk.blue(`📥 To use model "${options.model}", run:`));
        console.log(chalk.yellow(`   ollama pull ${options.model}`));
        console.log(chalk.white(`   Then update your config with: "model": "${options.model}"`));
      }
      
      console.log(chalk.green('\n🎯 AI setup complete!'));
      console.log(chalk.white('   Enable AI in your config file:'));
      console.log(chalk.cyan('   "ai": { "enabled": true }'));
      console.log(chalk.white('\n🚀 Usage examples:'));
      console.log(chalk.yellow('   best-locator pick https://example.com --ai'));
      console.log(chalk.yellow('   best-locator pick https://example.com --ai --explain'));
      
    } catch (error: any) {
      console.log(chalk.red('❌ Error setting up AI:'), error.message);
    }
  });

// Comando AI test
program
  .command('ai-test')
  .description('Test AI functionality')
  .action(async () => {
    try {
      const config = configManager.getConfig();
      
      if (!config.ai?.enabled) {
        console.log(chalk.yellow('⚠️  AI is disabled in config'));
        console.log(chalk.cyan('💡 Enable it by setting: "ai": { "enabled": true }'));
        return;
      }
      
      console.log(chalk.blue('🧪 Testing AI connection...'));
      
      const aiEngine = new AIEngine(config);
      const available = await aiEngine.isAvailable();
      
      if (available) {
        console.log(chalk.green('✅ AI is working correctly!'));
        console.log(chalk.blue(`🤖 Model: ${config.ai.ollama.model}`));
        console.log(chalk.blue(`🔗 Host: ${config.ai.ollama.host}`));
        
        // Test básico de generación
        console.log(chalk.blue('\n🔬 Testing selector generation...'));
        const testElement = {
          tagName: 'button',
          id: 'submit-btn',
          className: 'btn btn-primary',
          textContent: 'Submit',
          attributes: { 'data-test': 'submit-button', 'type': 'submit' }
        };
        
        try {
          const testResult = await aiEngine.generateSelector(testElement, { url: 'test', title: 'Test Page', pageType: 'test' });
          console.log(chalk.green('✅ Selector generation test passed!'));
          console.log(chalk.white(`   Generated: ${testResult.selector}`));
        } catch (genError: any) {
          console.log(chalk.red('❌ Selector generation test failed:'), genError.message);
        }
        
      } else {
        console.log(chalk.red('❌ AI connection failed'));
        console.log(chalk.yellow('💡 Make sure Ollama is running: ollama serve'));
        console.log(chalk.yellow('💡 And the model is installed: ollama pull ' + config.ai.ollama.model));
      }
      
    } catch (error: any) {
      console.log(chalk.red('❌ Error testing AI:'), error.message);
    }
  });

// Ejecutamos el programa
program.parse();