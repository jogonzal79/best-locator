#!/usr/bin/env node

// Best-Locator CLI - Universal Selector Generator
import { Command } from 'commander';
import chalk from 'chalk';
import { chromium } from 'playwright';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { SelectorValidator } from '../core/selector-validator.js';
import { ConfigManager } from '../core/config-manager.js';
import { AIEngine } from '../core/ai-engine.js';

const packageJson = JSON.parse(
  await (await import('node:fs/promises')).readFile(
    new URL('../../package.json', import.meta.url),
    'utf-8'
  )
);

const program = new Command();
const configManager = new ConfigManager();

program
  .name('best-locator')
  .description('🎯 Universal selector generator for UI testing')
  .version(packageJson.version);

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

program
  .command('init')
  .description('Create a sample configuration file (best-locator.config.json)')
  .action(() => {
    if (configManager.hasConfigFile()) {
      console.log(chalk.yellow('⚠️  A configuration file already exists.'));
    } else {
      configManager.createSampleConfig();
    }
  });

program
  .command('pick <url> [framework] [language]')
  .description('Pick an element from a webpage and generate selector')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(async (url: string, framework?: string, language?: string, options?: any) => {
    const config = configManager.getConfig();
    const finalFramework = framework || config.defaultFramework;
    const finalLanguage = language || config.defaultLanguage;
    const resolvedUrl = configManager.getUrl(url) || url;

    console.log(chalk.blue(`🚀 Opening ${resolvedUrl}...`));

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
      console.log(chalk.green('✅ Browser launched successfully!'));

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

      console.log(chalk.blue('\n🖱️  Click any element to generate a selector'));
      console.log(chalk.white('   Press ESC if you want to cancel.'));

      await page.addInitScript(() => {
        (window as any).elementSelected = false;
        (window as any).selectedElementInfo = {};
      });

      await page.evaluate(() => {
        document.addEventListener('click', (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          const target = event.target as HTMLElement;

          const gatherInfo = (element: HTMLElement) => {
            const attrs: Record<string, string> = {};
            for (const attr of Array.from(element.attributes)) {
              attrs[attr.name] = attr.value;
            }
            return {
              tagName: element.tagName.toLowerCase(),
              id: element.id || '',
              className: element.className || '',
              textContent: (element.textContent || '').trim(),
              attributes: attrs,
              depth: (() => {
                let d = 0; let e: HTMLElement | null = element;
                while (e && e.parentElement) { d++; e = e.parentElement; }
                return d;
              })(),
              position: (() => {
                if (!element.parentElement) return 0;
                return Array.from(element.parentElement.children).indexOf(element);
              })()
            };
          };

          (window as any).selectedElementInfo = gatherInfo(target);
          (window as any).elementSelected = true;
        }, true);

        document.addEventListener('keydown', (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            (window as any).elementSelected = true;
            (window as any).selectedElementInfo = null;
          }
        }, true);
      });

      await page.waitForFunction('window.elementSelected === true', {
        timeout: config.timeouts.elementSelection
      });

      const elementInfo: any = await page.evaluate('window.selectedElementInfo');

      if (!elementInfo) {
        console.log(chalk.yellow('\n🚪 Selection cancelled by user (ESC pressed)'));
        await browser.close();
        return;
      }

      console.log(chalk.green('\n🎯 Element selected!'));
      console.log(chalk.white(`   Tag: ${elementInfo.tagName}`));
      console.log(chalk.white(`   Text: "${elementInfo.textContent.slice(0, 80)}${elementInfo.textContent.length > 80 ? '...' : ''}"`));
      console.log(chalk.white(`   Classes: ${elementInfo.className || '(none)'}`));

      console.log(chalk.blue('\n🧠 Generating smart selector...'));
      const generator = new SelectorGenerator(config);
      let selectorResult;
      const useAI = options?.ai && config.ai?.enabled;

      if (useAI && (generator as any).generateSelectorWithAI) {
        const pageContext = {
          url: await page.url(),
          title: await page.title(),
          pageType: 'webapp'
        };
        try {
          // MODIFICADO: Se agrega finalFramework como tercer parámetro
          selectorResult = await (generator as any).generateSelectorWithAI(elementInfo, pageContext, finalFramework);
        } catch (err) {
          if (options?.noFallback) {
            console.log(chalk.red('❌ AI failed and fallback disabled'));
            throw err;
          }
          console.log(chalk.yellow('⚠️  AI failed, falling back to traditional method'));
          selectorResult = generator.generateSelector(elementInfo);
        }
      } else {
        selectorResult = generator.generateSelector(elementInfo);
      }

      console.log(chalk.cyan('\n🎯 Best Selector:'));
      console.log(chalk.yellow(`   ${selectorResult.selector}`));

      if (config.output.includeConfidence && selectorResult.confidence !== undefined) {
        console.log(chalk.white(`   Confidence: ${selectorResult.confidence}%`));
      }

      console.log(chalk.blue('\n🧩 Code Snippet:'));
      const formattedCode = formatter.format(selectorResult.selector, finalFramework, finalLanguage);
      console.log(chalk.green(formattedCode));

      if (options?.ai && options?.explain && config.ai?.enabled) {
        try {
          const aiEngine = new AIEngine(config);
          const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo);
            console.log(chalk.magenta(`\n🧠 AI Explanation: ${explanation}`));
        } catch {
          console.log(chalk.yellow('⚠️  AI explanation not available'));
        }
      }

      try {
        await page.evaluate(async (text) => {
          try {
            await (navigator as any).clipboard.writeText(text);
          } catch {}
        }, formattedCode);
        console.log(chalk.green('✅ Copied to clipboard!'));
      } catch {
        console.log(chalk.yellow('⚠️  Could not copy to clipboard'));
      }

      console.log(chalk.green('\n✅ Done!'));
      await browser.close();
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
      console.log(chalk.yellow('🔍 Stack trace:'), error.stack); // ← AGREGAR ESTA LÍNEA
    }
  });

program
  .command('pick-multiple <url> [framework] [language]')
  .description('Pick multiple elements from a webpage and generate selectors')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(async (url: string, framework?: string, language?: string, options?: any) => {
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
      console.log(chalk.green('✅ Browser launched successfully!'));

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

      console.log(chalk.blue('\n🔢 Multiple Selection Mode'));
      console.log(chalk.white('   Click elements to add them to the list'));
      console.log(chalk.white('   Press ESC to finish and process selectors'));
      console.log(chalk.white('   Elements are captured in order of selection'));
      console.log(chalk.yellow('🐛 DEBUG: About to inject script...'));

      await page.addInitScript(() => {
        (window as any).multipleSelectionDone = false;
        (window as any).multipleSelectionCancelled = false;
        (window as any).selectedElementsInfo = [];
      });

      await page.evaluate(() => {
        console.log('🚀 [DEBUG] Multiple selection script starting...');
        if (!(window as any).selectedElementsInfo) {
          console.log('⚠️ [DEBUG] selectedElementsInfo not initialized, creating...');
          (window as any).selectedElementsInfo = [];
        }
        console.log('✅ [DEBUG] selectedElementsInfo is ready:', (window as any).selectedElementsInfo);

        const gatherInfo = (element: HTMLElement) => {
          console.log('📋 [DEBUG] Gathering info for:', element.tagName);
          const attrs: Record<string, string> = {};
          for (const attr of Array.from(element.attributes)) {
            attrs[attr.name] = attr.value;
          }
          const info = {
            tagName: element.tagName.toLowerCase(),
            id: element.id || '',
            className: element.className || '',
            textContent: (element.textContent || '').trim().substring(0, 50),
            attributes: attrs,
            order: ((window as any).selectedElementsInfo?.length || 0) + 1
          };
          console.log('📋 [DEBUG] Info gathered:', info);
          return info;
        };

        const clickHandler = (event: MouseEvent) => {
          console.log('🖱️ [DEBUG] CLICK DETECTED on:', (event.target as HTMLElement)?.tagName);
          event.preventDefault();
          event.stopPropagation();
          const target = event.target as HTMLElement;
          if (!target) {
            console.log('❌ [DEBUG] No target element');
            return;
          }
          console.log('🎯 [DEBUG] Processing click on:', target.tagName, target.className);
          const info = gatherInfo(target);
          (window as any).selectedElementsInfo.push(info);
          console.log('✅ [DEBUG] Element added! Total count:', (window as any).selectedElementsInfo.length);
          target.style.outline = '5px solid #ff0000 !important';
          target.style.backgroundColor = 'rgba(255, 0, 0, 0.3) !important';
          target.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8) !important';

          const notification = document.createElement('div');
          notification.textContent = `Element ${info.order} captured!`;
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff0000;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 999999;
            font-weight: bold;
            font-size: 14px;
          `;
          document.body.appendChild(notification);

          setTimeout(() => {
            notification.remove();
            target.style.outline = '';
            target.style.backgroundColor = '';
            target.style.boxShadow = '';
          }, 2000);
        };

        const keyHandler = (event: KeyboardEvent) => {
          console.log('🔑 [DEBUG] Key pressed:', event.key);
          if (event.key === 'Escape') {
            console.log('✅ [DEBUG] ESC - finishing with', (window as any).selectedElementsInfo.length, 'elements');
            (window as any).multipleSelectionDone = true;
          }
        };

        document.removeEventListener('click', clickHandler, true);
        document.removeEventListener('keydown', keyHandler, true);
        document.addEventListener('click', clickHandler, true);
        document.addEventListener('keydown', keyHandler, true);

        console.log('✅ [DEBUG] Event listeners attached successfully');
        console.log('🎯 [DEBUG] Ready for clicks! Try clicking any element...');
        setTimeout(() => {
          console.log('🕐 [DEBUG] 3 seconds have passed. State check:');
          console.log('   - Elements captured:', (window as any).selectedElementsInfo.length);
          console.log('   - Selection done:', (window as any).multipleSelectionDone);
        }, 3000);
      });

      await page.waitForFunction('window.multipleSelectionDone === true', {
        timeout: config.timeouts.elementSelection
      });

      const cancelled = false; // (No se usa pero se mantiene por consistencia)

      const selectedElements: any[] = await page.evaluate('window.selectedElementsInfo');
      if (!selectedElements.length) {
        console.log(chalk.yellow('\n⚠️  No elements were selected'));
        await browser.close();
        return;
      }

      const generator = new SelectorGenerator(config);
      const results: any[] = [];
      const useAI = options?.ai && config.ai?.enabled;

      const pageTitle = await page.title();
      const pageUrl = await page.url();

      console.log(chalk.green(`\n🎯 ${selectedElements.length} element(s) selected!`));
      console.log(chalk.blue(`🧠 Processing elements ${useAI ? 'with AI' : 'traditionally'}...`));

      for (let i = 0; i < selectedElements.length; i++) {
        const elementInfo = selectedElements[i];

        console.log(chalk.blue(`\n🔄 Analyzing element ${i + 1}/${selectedElements.length}...`));
        console.log(chalk.white(`   Tag: ${elementInfo.tagName}`));
        console.log(chalk.white(`   Text: "${elementInfo.textContent?.substring(0, 30)}"`));

        let selectorResult: any;

        if (useAI && (generator as any).generateSelectorWithAI) {
          const pageContext = {
            url: pageUrl,
            title: pageTitle,
            pageType: 'webapp'
          };
          try {
            console.log(chalk.magenta(`   🧠 Running AI analysis...`));
            // MODIFICADO: Se agrega finalFramework como tercer parámetro
            selectorResult = await (generator as any).generateSelectorWithAI(elementInfo, pageContext, finalFramework);
            console.log(chalk.green(`   ✅ AI analysis complete`));
          } catch (err) {
            if (options?.noFallback) {
              console.log(chalk.red('❌ AI failed and fallback disabled'));
              throw err;
            }
            console.log(chalk.yellow(`   ⚠️  AI failed, using traditional method`));
            selectorResult = generator.generateSelector(elementInfo);
          }
        } else {
          selectorResult = generator.generateSelector(elementInfo);
        }

        const formattedCode = formatter.format(selectorResult.selector, finalFramework, finalLanguage);
        console.log(chalk.cyan('   🎯 Selector:'));
        console.log(chalk.yellow(`      ${selectorResult.selector}`));
        console.log(chalk.blue('   🧩 Code:'));
        console.log(chalk.green(`      ${formattedCode}`));
        if (config.output.includeConfidence && selectorResult.confidence !== undefined) {
          console.log(chalk.white(`   📊 Confidence: ${selectorResult.confidence}%`));
        }

        if (options?.ai && options?.explain && config.ai?.enabled) {
          try {
            console.log(chalk.magenta(`   🧠 Getting AI explanation...`));
            const aiEngine = new AIEngine(config);
            const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo);
            console.log(chalk.magenta(`   💡 AI Explanation: ${explanation}`));
          } catch {
            console.log(chalk.yellow('   ⚠️  AI explanation not available'));
          }
        }

        results.push({
          order: elementInfo.order,
          selector: selectorResult.selector,
          code: formattedCode,
          confidence: selectorResult.confidence
        });
      }

      console.log(chalk.green('\n✅ All elements processed successfully!'));
      console.log(chalk.blue('📦 Summary:'));
      results.forEach(r => {
        console.log(chalk.white(`   [${r.order}] ${r.selector}`));
      });

      await browser.close();
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
      console.log(chalk.yellow('🔍 Stack trace:'), error.stack); // ← AGREGAR ESTA LÍNEA
    }
  });

program
  .command('pick-toggle <url> [framework] [language]')
  .description('Navigate freely and toggle selector capture with CTRL+S/CTRL+D')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(async (url: string, framework?: string, language?: string, options?: any) => {
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

    const formatter2 = new FrameworkFormatter();
    try {
      formatter2.format('[data-test="test"]', finalFramework, finalLanguage);
    } catch (validationError: any) {
      console.log(chalk.red('❌ Error:'), validationError.message);
      return;
    }

    try {
      const browser = await chromium.launch({
        headless: config.browser.headless,
        args: ['--disable-blink-features=AutomationControlled']
      });
      console.log(chalk.green('✅ Browser launched successfully!'));

      const page = await browser.newPage();
      page.setDefaultTimeout(0);
      await page.setViewportSize(config.browser.viewport);

      try {
        await page.goto(resolvedUrl, { timeout: config.timeouts.pageLoad });
        console.log(chalk.green('✅ Page loaded successfully!'));
        await page.waitForLoadState('domcontentloaded');
        console.log(chalk.blue('🔧 Page ready for script injection'));
        await page.addInitScript(() => {
          try {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = '';
            document.head.appendChild(meta);
          } catch (e) {
            console.log('CSP override attempt failed (normal)');
          }
        });
      } catch (loadError: any) {
        console.log(chalk.red('❌ Page load error:'), loadError.message);
        await browser.close();
        return;
      }

      console.log(chalk.blue('\n🌐 Professional Toggle Mode Active!'));
      console.log(chalk.white('   1. Navigate freely - login, browse, interact normally'));
      console.log(chalk.green('   2. Press CTRL+S - Turn ON selector capture mode'));
      console.log(chalk.white('   3. Click elements - Capture high-quality selectors'));
      console.log(chalk.red('   4. Press CTRL+D - Turn OFF selector capture mode'));
      console.log(chalk.white('   5. Repeat as needed - navigate to other pages, toggle on/off'));
      console.log(chalk.yellow('   6. Press ESC - Finish and get all selectors'));

      await page.addInitScript(() => {
        console.log('🚀 [TOGGLE] Init script loaded');
        (window as any).bestLocatorState = {
          selectionActive: false,
          selectedElements: [],
          captureMode: false,
          overlayCreated: false
        };
      });

      await page.evaluate(() => {
        console.log('🚀 [TOGGLE] Script injection starting...');
        if (!(window as any).bestLocatorToggleInitialized) {
          console.log('🔧 [TOGGLE] Initializing toggle system...');
          (window as any).bestLocatorState = {
            captureMode: false,
            selectedElements: [],
            sessionActive: true
          };
          const overlay = document.createElement('div');
          overlay.id = 'bl-toggle-overlay';
          overlay.innerHTML = `
            <div style="font-weight: bold; color: #ff6b6b;">🌐 NAVIGATION</div>
            <div style="font-size: 10px; margin-top: 4px;">
              CTRL+S: Capture ON<br>
              CTRL+D: Capture OFF<br>
              ESC: Finish
            </div>
            <div style="margin-top: 6px; font-size: 10px;">
              Captured: <span id="bl-count">0</span>
            </div>
          `;
          overlay.setAttribute('style', [
            'position: fixed',
            'top: 20px',
            'right: 20px',
            'background: rgba(30, 60, 114, 0.95)',
            'color: white',
            'padding: 12px 16px',
            'font-family: monospace',
            'font-size: 11px',
            'border-radius: 6px',
            'z-index: 999999',
            'box-shadow: 0 4px 12px rgba(0,0,0,0.4)',
            'border: 2px solid #ff6b6b',
            'pointer-events: none',
            'min-width: 140px'
          ].join(' !important; ') + ' !important');
          document.body.appendChild(overlay);
          console.log('✅ [TOGGLE] Overlay created');

          document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 's') {
              e.preventDefault();
              (window as any).bestLocatorState.captureMode = true;
              overlay.style.borderColor = '#00ff88';
              overlay.querySelector('div')!.innerHTML = '🎯 CAPTURING';
              console.log('✅ Capture mode ON');
            } else if (e.ctrlKey && e.key.toLowerCase() === 'd') {
              e.preventDefault();
              (window as any).bestLocatorState.captureMode = false;
              overlay.style.borderColor = '#ff6b6b';
              overlay.querySelector('div')!.innerHTML = '🌐 NAVIGATION';
              console.log('✅ Capture mode OFF');
            } else if (e.key === 'Escape') {
              e.preventDefault();
              (window as any).bestLocatorState.sessionActive = false;
              console.log('🏁 Session ending...');
            }
          }, true);

          document.addEventListener('click', (e) => {
            if (!(window as any).bestLocatorState.captureMode) return;
            e.preventDefault();
            e.stopPropagation();
            const target = e.target as HTMLElement;
            const count = (window as any).bestLocatorState.selectedElements.length + 1;
            (window as any).bestLocatorState.selectedElements.push({
              order: count,
              tagName: target.tagName.toLowerCase(),
              id: target.id || '',
              className: target.className || '',
              textContent: (target.textContent || '').trim().substring(0, 50),
              attributes: Object.fromEntries(
                Array.from(target.attributes).map(attr => [attr.name, attr.value])
              )
            });
            const countEl = document.getElementById('bl-count');
            if (countEl) countEl.textContent = String(count);
            target.style.outline = '3px solid #00ff88';
            setTimeout(() => target.style.outline = '', 2000);
            console.log(`📋 Element ${count} captured:`, target.tagName);
          }, true);

          (window as any).bestLocatorToggleInitialized = true;
          console.log('✅ [TOGGLE] System ready');
        }
      });

      console.log(chalk.blue('⏳ Toggle session active - look for overlay in top-right corner'));
      console.log(chalk.yellow('💡 Use CTRL+S to start capturing, CTRL+D to stop, ESC to finish'));

      await page.waitForFunction('window.bestLocatorState && window.bestLocatorState.sessionActive === false', {
        timeout: config.timeouts.elementSelection
      }).catch(() => {});

      const selectedElements: any[] = await page.evaluate('window.bestLocatorState?.selectedElements || []');

      if (!selectedElements.length) {
        console.log(chalk.yellow('\n⚠️  No elements captured in toggle mode'));
        await browser.close();
        return;
      }

      const pageTitle = 'Toggle Session';
      const pageUrl = resolvedUrl;

      console.log(chalk.green(`\n🎯 ${selectedElements.length} element(s) captured!`));

      const generator = new SelectorGenerator(config);
      const results: any[] = [];
      const useAI = options?.ai && config.ai?.enabled;

      for (let i = 0; i < selectedElements.length; i++) {
        const elementInfo = selectedElements[i];
        console.log(chalk.blue(`\n🧠 Processing element ${i + 1}...`));

        let selectorResult;
        if (useAI && (generator as any).generateSelectorWithAI) {
          const pageContext = {
            url: pageUrl,
            title: pageTitle,
            pageType: 'webapp'
          };
          try {
            // MODIFICADO: Se agrega finalFramework como tercer parámetro
            selectorResult = await (generator as any).generateSelectorWithAI(elementInfo, pageContext, finalFramework);
          } catch (err) {
            if (options?.noFallback) {
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

        console.log(chalk.cyan('🎯 Selector:'));
        console.log(chalk.yellow(`   ${selectorResult.selector}`));
        console.log(chalk.blue('🧩 Code:'));
        console.log(chalk.green(`   ${formattedCode}`));
        if (config.output.includeConfidence && selectorResult.confidence !== undefined) {
          console.log(chalk.white(`   Confidence: ${selectorResult.confidence}%`));
        }

        results.push({
          order: elementInfo.order,
          selector: selectorResult.selector,
          code: formattedCode,
          confidence: selectorResult.confidence
        });
      }

      console.log(chalk.green('\n✅ Toggle session complete!'));
      console.log(chalk.blue('📦 Summary:'));
      results.forEach(r => {
        console.log(chalk.white(`   [${r.order}] ${r.selector}`));
      });

      await browser.close();
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
      console.log(chalk.yellow('🔍 Stack trace:'), error.stack); // ← AGREGAR ESTA LÍNEA
    }
  });

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

program
  .command('validate <url> <selector>')
  .description('Validate a selector on a given URL')
  .action(async (url: string, selector: string) => {
    const config = configManager.getConfig();
    const resolvedUrl = configManager.getUrl(url) || url;

    console.log(chalk.blue(`🚀 Opening ${resolvedUrl} to validate selector...`));

    try {
      const browser = await chromium.launch({ headless: config.browser.headless });
      const page = await browser.newPage();
      page.setDefaultTimeout(0);
      await page.setViewportSize(config.browser.viewport);
      await page.goto(resolvedUrl, { timeout: config.timeouts.pageLoad });

      console.log(chalk.blue('\n🔍 Validating selector...'));
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
      console.log(chalk.yellow('🔍 Stack trace:'), error.stack); // ← AGREGAR ESTA LÍNEA
    }
  });

program
  .command('go <alias>')
  .description('Open a configured URL alias in the browser and pick an element')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(async (alias: string, options?: any) => {
    const config = configManager.getConfig();
    const resolvedUrl = configManager.getUrl(alias);
    if (!resolvedUrl) {
      console.log(chalk.red(`❌ Alias "${alias}" not found in configuration.`));
      return;
    }

    console.log(chalk.blue(`🚀 Opening alias "${alias}" → ${resolvedUrl}`));

    try {
      const browser = await chromium.launch({
        headless: config.browser.headless
      });
      const page = await browser.newPage();
      page.setDefaultTimeout(0);
      await page.setViewportSize(config.browser.viewport);
      await page.goto(resolvedUrl, { timeout: config.timeouts.pageLoad });

      console.log(chalk.blue('\n🖱️  Click an element to generate a selector (alias mode)'));

      await page.addInitScript(() => {
        (window as any).elementSelected = false;
        (window as any).selectedElementInfo = {};
      });

      await page.evaluate(() => {
        document.addEventListener('click', (event: MouseEvent) => {
          event.preventDefault();
            event.stopPropagation();
          const target = event.target as HTMLElement;

          const attrs: Record<string, string> = {};
          for (const attr of Array.from(target.attributes)) {
            attrs[attr.name] = attr.value;
          }

          (window as any).selectedElementInfo = {
            tagName: target.tagName.toLowerCase(),
            id: target.id || '',
            className: target.className || '',
            textContent: (target.textContent || '').trim(),
            attributes: attrs,
            depth: (() => {
              let d = 0; let e: HTMLElement | null = target;
              while (e && e.parentElement) { d++; e = e.parentElement; }
              return d;
            })(),
            position: (() => {
              if (!target.parentElement) return 0;
              return Array.from(target.parentElement.children).indexOf(target);
            })()
          };

          (window as any).elementSelected = true;
        }, true);
      });

      await page.waitForFunction('window.elementSelected', {
        timeout: config.timeouts.elementSelection
      });

      const elementInfo: any = await page.evaluate('window.selectedElementInfo');

      console.log(chalk.green('\n🎯 Element selected!'));

      const generator = new SelectorGenerator(config);
      let selectorResult;
      const useAI = options?.ai && config.ai?.enabled;

      if (useAI && (generator as any).generateSelectorWithAI) {
        const pageContext = {
          url: await page.url(),
          title: await page.title(),
          pageType: 'webapp'
        };
        try {
          // MODIFICADO: Se agrega finalFramework como tercer parámetro
          selectorResult = await (generator as any).generateSelectorWithAI(elementInfo, pageContext, config.defaultFramework);
        } catch (err) {
          if (options?.noFallback) {
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

      if (options?.ai && options?.explain && config.ai?.enabled) {
        try {
          const aiEngine = new AIEngine(config);
          const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo);
          console.log(chalk.magenta(`\n🧠 AI Explanation: ${explanation}`));
        } catch {
          console.log(chalk.yellow('⚠️  AI explanation not available'));
        }
      }

      await browser.close();
    } catch (error: any) {
      console.log(chalk.red('❌ Error:'), error.message);
      console.log(chalk.yellow('🔍 Stack trace:'), error.stack); // ← AGREGAR ESTA LÍNEA
    }
  });

program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    const config = configManager.getConfig();

    console.log(chalk.blue('\n⚙️  Current Configuration:'));
    console.log(chalk.white(`   Default Framework: ${config.defaultFramework}`));
    console.log(chalk.white(`   Default Language:  ${config.defaultLanguage}`));

    console.log(chalk.blue('\n🧪 Output:'));
    console.log(chalk.white(`   Include Confidence: ${config.output.includeConfidence ? 'Yes' : 'No'}`));
    console.log(chalk.white(`   Include XPath:      ${config.output.includeXPath ? 'Yes' : 'No'}`));

    console.log(chalk.blue('\n🌐 Browser:'));
    console.log(chalk.white(`   Headless: ${config.browser.headless ? 'Yes' : 'No'}`));
    console.log(chalk.white(`   Viewport: ${config.browser.viewport.width}x${config.browser.viewport.height}`));

    console.log(chalk.blue('\n🔗 URLs:'));
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
    console.log(chalk.white(`   Page Load:         ${config.timeouts.pageLoad}ms`));
    console.log(chalk.white(`   Element Selection: ${config.timeouts.elementSelection}ms`));
    console.log(chalk.white(`   Validation:        ${config.timeouts.validation}ms`));
  });

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

program.parse(process.argv);
