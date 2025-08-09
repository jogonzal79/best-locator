// src/commands/shared/selector-processor.ts

import { BrowserSession } from './browser-utils.js';
import { DeviceSession } from './device-utils.js';
import { CommandOptions, SelectorResult, ElementInfo } from '../../types/index.js'; // Asegúrate de que ElementInfo esté aquí
import { logger } from '../../app/logger.js';
import clipboardy from 'clipboardy';
import { ISelectorGenerator, IFormatter, AnyElementInfo } from '../../core/processing/types.js';
import { WebFramework, MobileFramework, Language } from '../../core/formatters/types.js';
import { AIEngine } from '../../core/ai-engine.js';

// Función auxiliar para saber si estamos en una sesión de navegador (web)
function isBrowserSession(session: BrowserSession | DeviceSession): session is BrowserSession {
  return (session as BrowserSession).page !== undefined;
}

/**
 * Orquestador central para procesar elementos, generar selectores, formatear el código y mostrarlo.
 * Es agnóstico a la plataforma (web/móvil) y recibe sus herramientas a través de inyección de dependencias.
 */
export async function processAndOutput(
  elements: AnyElementInfo[],
  session: BrowserSession | DeviceSession,
  options: CommandOptions,
  generator: ISelectorGenerator,
  formatter: IFormatter,
  framework?: string,
  language?: string,
): Promise<void> {

  if (elements.length === 0) {
    logger.warning('\n🚪 Selection cancelled or no elements captured.');
    return;
  }

  const { config } = session;
  const finalFramework = framework || config.defaultFramework;
  const finalLanguage = language || config.defaultLanguage;

  const results: { order: number | undefined; code: string }[] = [];
  let clipboardText = '';

  logger.success(`\n🎯 ${elements.length} element(s) captured! Processing...`);

  for (const elementInfo of elements) {
      let selectorResult: SelectorResult;

      // Genera el selector usando la herramienta inyectada
      if (options.ai && config.ai.enabled && generator.generateSelectorWithAI && isBrowserSession(session)) {
        await session.browserManager.showAwaitingOverlay('🧠 AI Processing...', `Analyzing...`);
        selectorResult = await generator.generateSelectorWithAI(elementInfo, await session.browserManager.getPageContext());
      } else {
        selectorResult = generator.generateSelector(elementInfo);
      }
      
      // Formatea el código usando la herramienta inyectada, distinguiendo entre web y móvil
      const formattedCode = isBrowserSession(session)
        ? formatter.format(selectorResult, finalFramework as WebFramework, finalLanguage as Language)
        : formatter.formatMobile(selectorResult, finalFramework as MobileFramework, finalLanguage as Language);

      results.push({ order: (elementInfo as any).order || (elementInfo as any).index, code: formattedCode });
      clipboardText += `${formattedCode}\n`;

      // Lógica de logging unificada para uno o múltiples elementos
      const displaySelector = selectorResult.selector;
      if (elements.length > 1) {
          logger.nl();
          logger.info(`🔄 Analyzing element ${ (elementInfo as any).order || (elementInfo as any).index || 'N/A'}/${elements.length}...`);
          logger.selector(`   ${displaySelector}`);
          logger.code(`   ${formattedCode}`);
      } else {
          logger.nl();
          logger.info('🎯 Best Selector:');
          logger.selector(displaySelector);

          if (config.output.includeConfidence && selectorResult.confidence) {
              logger.log(`   Confidence: ${selectorResult.confidence}%`);
          }
          
          // +++ INICIO DE LA CORRECCIÓN +++
          // Solo ejecutamos la explicación de la IA si estamos en una sesión web
          if (options.ai && options.explain && selectorResult.aiEnhanced && isBrowserSession(session)) {
            const aiEngine = new AIEngine(config);
            // Hacemos un cast seguro porque isBrowserSession nos garantiza que es ElementInfo
            const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo as ElementInfo); 
            logger.nl();
            logger.info('💡 AI Explanation:');
            logger.log(`   ${explanation}`);
          }
          // --- FIN DE LA CORRECCIÓN ---

          logger.nl();
          logger.info('🧩 Code Snippet:');
          logger.code(formattedCode);
      }
  }

  if (elements.length > 1) {
    logger.nl();
    logger.success('✅ All elements processed successfully!');
    logger.info('📦 Summary of generated code:');
    results.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(r => logger.log(`   [${r.order || 1}] ${r.code}`));
  }

  // Lógica de portapapeles unificada
  try {
      const textToCopy = clipboardText.trim();
      if (textToCopy) {
          if (isBrowserSession(session)) {
              await session.page.evaluate(text => navigator.clipboard.writeText(text), textToCopy);
          } else {
              await clipboardy.write(textToCopy);
          }
          logger.nl();
          logger.success('✅ Copied to clipboard!');
      }
  } catch {
      logger.warning('⚠️ Could not copy to clipboard.');
  }
}