// src/commands/shared/selector-processing.ts
import { BrowserSession } from './browser-utils.js';
import { ElementInfo, CommandOptions, SelectorResult } from '../../types/index.js';
import { SelectorGenerator } from '../../core/selector-generator.js';
import { FrameworkFormatter } from '../../core/framework-formatter.js';
import { AriaCalculator } from '../../core/ai/aria-calculator.js';
import { AIEngine } from '../../core/ai-engine.js';
import { logger } from '../../app/logger.js';
import type { Language, WebFramework } from '../../core/formatters/types.js'; // <-- NUEVO

export async function processAndOutput(
  elements: ElementInfo[],
  session: BrowserSession,
  options: CommandOptions,
  framework?: string,
  language?: string,
): Promise<void> {
  
  if (elements.length === 0) {
    logger.warning('\n🚪 Selection cancelled or no elements captured.');
    return;
  }

  const { config, pageContext, page } = session;
  const generator = new SelectorGenerator(config);
  const formatter = new FrameworkFormatter();
  const ariaCalculator = new AriaCalculator();
  const finalFramework = framework || config.defaultFramework;
  const finalLanguage = language || config.defaultLanguage;
  
  const results: { order: number | undefined; code: string }[] = [];
  let clipboardText = '';

  logger.success(`\n🎯 ${elements.length} element(s) captured!`);

  for (const elementInfo of elements) {
    elementInfo.computedRole = ariaCalculator.computeRole(elementInfo);
    elementInfo.accessibleName = ariaCalculator.computeAccessibleName(elementInfo);
    delete elementInfo.attributes.style;

    if (options.ai) {
        await session.browserManager.showAwaitingOverlay('🧠 AI Processing...', `Analyzing...`);
    }

    let selectorResult: SelectorResult;
    if (options.ai && config.ai.enabled) {
        selectorResult = await generator.generateSelectorWithAI(elementInfo, pageContext);
    } else {
        selectorResult = generator.generateSelector(elementInfo);
    }

    const formattedCode = formatter.format(
      selectorResult,
      finalFramework as WebFramework,   // <-- CAST
      finalLanguage as Language         // <-- CAST
    );

    results.push({ order: elementInfo.order, code: formattedCode });
    clipboardText += `${formattedCode}\n`;

    const displaySelector = selectorResult.selector.startsWith('text=') ? selectorResult.selector.substring(5) : selectorResult.selector;
    
    // --- LÓGICA DE VISUALIZACIÓN CORREGIDA ---
    if (elements.length > 1) {
        // Para múltiples elementos, mostrar un resumen simple en el bucle
        logger.nl();
        logger.info(`🔄 Analyzing element ${elementInfo.order || 0}/${elements.length}...`);
        logger.info('   🎯 Selector:');
        logger.selector(`      ${displaySelector}`);
    } else {
        // Para un solo elemento, mostrar toda la información detallada
        logger.nl();
        logger.info('🎯 Best Selector:');
        logger.selector(displaySelector);

        if (config.output.includeConfidence && selectorResult.confidence) {
            logger.log(`   Confidence: ${selectorResult.confidence}%`);
        }

        if (options.ai && options.explain && selectorResult.aiEnhanced) {
            const aiEngine = new AIEngine(config);
            const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo);
            logger.nl();
            logger.info('💡 AI Explanation:');
            logger.log(`   ${explanation}`);
        }

        logger.nl();
        logger.info('🧩 Code Snippet:');
        logger.code(formattedCode);
    }
  }

  // --- LÓGICA DE RESUMEN FINAL PARA MÚLTIPLES ELEMENTOS ---
  if (elements.length > 1) {
    logger.nl();
    logger.success('✅ All elements processed successfully!');
    logger.info('📦 Summary of generated code:');
    results.forEach(r => logger.log(`   [${r.order || 1}] ${r.code}`));
  }
  
  try {
    const textToCopy = elements.length > 1 ? clipboardText.trim() : (results[0]?.code || '');
    if (textToCopy) {
      await page.evaluate(text => navigator.clipboard.writeText(text), textToCopy);
      logger.nl();
      logger.success('✅ Copied to clipboard!');
    }
  } catch {
    logger.warning('⚠️ Could not copy to clipboard.');
  }
}
