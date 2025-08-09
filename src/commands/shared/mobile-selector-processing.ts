// Archivo: src/commands/shared/mobile-selector-processing.ts

import { DeviceSession } from './device-utils.js';
import { MobileElementInfo, CommandOptions, SelectorResult } from '../../types/index.js';
import { MobileSelectorGenerator } from '../../core/mobile-selector-generator.js';
import { FrameworkFormatter } from '../../core/framework-formatter.js';
import { logger } from '../../app/logger.js';
import clipboardy from 'clipboardy'; // <-- 1. IMPORTAR LA NUEVA LIBRERÍA
import type { Language, MobileFramework } from '../../core/formatters/types.js'; // <-- NUEVO

export async function processMobileAndOutput(
  elements: MobileElementInfo[],
  session: DeviceSession,
  options: CommandOptions,
  language?: string,
): Promise<void> {

  if (!elements || elements.length === 0) {
    logger.warning("\nSelection cancelled or no elements captured.");
    return;
  }

  const { config, platform } = session;
  const generator = new MobileSelectorGenerator(config, platform);
  const formatter = new FrameworkFormatter();
  const finalLanguage = language || config.defaultLanguage;
  const results: { order: number; code: string; selector: string }[] = [];
  
  logger.success(`\nProcessing ${elements.length} mobile element(s)...`);

  for (const elementInfo of elements) {
    let selectorResult: SelectorResult;
    
    if (options.ai && config.ai.enabled) {
      // TODO: Implementar Al para móvil en fase avanzada
      selectorResult = generator.generateMobileSelector(elementInfo);
    } else {
      selectorResult = generator.generateMobileSelector(elementInfo);
    }
    
    const formattedCode = formatter.formatMobile(
      selectorResult,
      platform as MobileFramework,            // <-- CAST
      finalLanguage as Language               // <-- CAST
    );

    results.push({
      order: elementInfo.index || 0,
      code: formattedCode,
      selector: selectorResult.selector
    });

    if (elements.length === 1) {
      logger.nl();
      logger.info('Best Mobile Selector:');
      logger.selector(selectorResult.selector);
      if (config.output.includeConfidence && selectorResult.confidence) {
        logger.log(`Confidence: ${selectorResult.confidence}%`);
      }
      logger.nl();
      logger.info('Mobile Code:');
      logger.code(formattedCode);
    }
  }

  if (elements.length > 1) {
    logger.nl();
    logger.success('All mobile elements processed');
    logger.info('Generated mobile code:');
    results.sort((a, b) => a.order - b.order).forEach(r => logger.log(`[${r.order}] ${r.code}`));
  }

  // --- 2. LÓGICA PARA COPIAR AL PORTAPAPELES ---
  try {
    const clipboardText = results.map(r => r.code).join('\n');
    await clipboardy.write(clipboardText);
    logger.success('✅ Results copied to clipboard!');
  } catch (error) {
    logger.warning('⚠️ Could not copy to clipboard. Please copy the results manually.');
  }
  // ---------------------------------------------

  logger.nl();
  logger.success('Mobile selectors generated successfully!');
  logger.info('Copy the code above to use in your mobile tests.');
}
