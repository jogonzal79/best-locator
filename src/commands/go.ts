// src/commands/go.ts
import { ConfigManager } from '../core/config-manager.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { BrowserManager } from '../app/browser-manager.js';
import { logger } from '../app/logger.js';
import { CommandOptions, ElementInfo, PageContext, SelectorResult, BestLocatorConfig } from '../types/index.js';

// --- Función auxiliar para la lógica de generación (reutilizada) ---
async function generateSelector(
  generator: SelectorGenerator,
  elementInfo: ElementInfo,
  pageContext: PageContext,
  options: CommandOptions,
  config: BestLocatorConfig
): Promise<SelectorResult> {
  const useAI = options.ai && config.ai?.enabled;
  if (useAI) {
    try {
      logger.info('🧠 Running AI analysis...');
      return await generator.generateSelectorWithAI(elementInfo, pageContext, config.defaultFramework);
    } catch (err) {
      if (options.noFallback) {
        logger.error('AI failed and fallback is disabled.');
        throw err;
      }
      logger.warning('⚠️ AI failed, falling back to traditional method.');
    }
  }
  return generator.generateSelector(elementInfo);
}

// --- El manejador del comando con la firma CORRECTA ---
// Nota: La firma es diferente a la de 'pick', ya que solo recibe 'alias' y 'options'.
export async function handleGoCommand(alias: string, options: CommandOptions): Promise<void> {
  const configManager = new ConfigManager();
  const config = configManager.getConfig();
  const resolvedUrl = configManager.getUrl(alias);

  if (!resolvedUrl) {
    logger.error(`❌ Alias "${alias}" not found in configuration.`);
    return;
  }

  logger.info(`🚀 Opening alias "${alias}" → ${resolvedUrl}`);
  const browserManager = new BrowserManager(config);

  try {
    const page = await browserManager.launchAndNavigate(resolvedUrl);

    // Reutilizamos el mismo script que el comando "pick"
    await browserManager.runScriptInPage('single-picker.js');

    logger.nl();
    logger.info('🖱️  Click an element to generate a selector (alias mode).');
    logger.log('   Press ESC to cancel.');

    await page.waitForFunction('window.elementSelected === true', null, { timeout: config.timeouts.elementSelection });

    const elementInfo: ElementInfo | null = await page.evaluate('window.selectedElementInfo');

    if (!elementInfo) {
      logger.warning('\n🚪 Selection cancelled by user.');
      return;
    }

    logger.success('\n🎯 Element selected!');

    if (options.ai) {
        await browserManager.showAwaitingOverlay('🧠 AI Processing...', 'Generating smart selector');
    }

    const generator = new SelectorGenerator(config);
    const pageContext = await browserManager.getPageContext();
    
    const selectorResult = await generateSelector(generator, elementInfo, pageContext, options, config);

    logger.nl();
    logger.info('🎯 Best Selector:');
    logger.selector(selectorResult.selector);

    if (config.output.includeConfidence && selectorResult.confidence !== undefined) {
      logger.log(`   Confidence: ${selectorResult.confidence}%`);
    }

    const formatter = new FrameworkFormatter();
    // En modo 'go', siempre usamos la configuración por defecto del archivo config.
    const formattedCode = formatter.format(selectorResult.selector, config.defaultFramework, config.defaultLanguage);
    
    logger.nl();
    logger.info('🧩 Code Snippet:');
    logger.code(formattedCode);

  } catch (error: any) {
    if (error.name === 'TimeoutError') {
        logger.warning('\n🚪 Selection timed out.');
    } else {
        logger.error('An error occurred during the go command:', error);
        if (error.stack) {
            console.error(error.stack);
        }
    }
  } finally {
    await browserManager.close();
  }
}