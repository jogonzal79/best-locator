// src/commands/pick.ts

import { CommandOptions } from '../types/index.js';
import { withBrowserSession } from './shared/browser-utils.js';
import { captureElements } from './shared/element-capture.js';
// +++ INICIO DE CAMBIOS +++
import { processAndOutput } from './shared/selector-processor.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { GeneratorFactory } from '../core/generators/factory.js';
// NUEVO:
import { SelectorStrategyResolver } from '../core/strategies/SelectorStrategyResolver.js';
import { ISelectorStrategy } from '../core/strategies/ISelectorStrategy.js';
import { wrapGenerator } from '../core/processing/generator-wrapper.js'; // 👈 Nueva importación
// --- FIN DE CAMBIOS ---

export async function handlePickCommand(
  url: string,
  framework: string | undefined,
  language: string | undefined,
  options: CommandOptions
): Promise<void> {
  await withBrowserSession(url, async (session) => {
    const elements = await captureElements(session, 'single');

    // +++ INICIO DE CAMBIOS +++
    // 1. Obtener el documento solo si no se forzó el stack
    const document = options.stack
      ? undefined
      : await session.page.evaluateHandle(() => document).then(h => h.jsonValue());

    // 2. Crear el generador con documento (para auto-detección) o sin él
    const generator = GeneratorFactory.create(
      framework || session.config.defaultFramework,
      session.config,
      document // 👈 nuevo argumento opcional
    );
    console.log('🧪 Using Generator:', generator.constructor.name); // REVISANDO DEBUGGING
    // 3. Forzar estrategia si se usó --stack
    if (options.stack && generator instanceof SelectorGenerator) {
      const forcedStrategy: ISelectorStrategy = SelectorStrategyResolver.resolve(options.stack);
      generator.setStrategy(forcedStrategy);
    }

    const formatter = new FrameworkFormatter();
    await processAndOutput(
      elements, 
      session, 
      options, 
      wrapGenerator(generator), // 👈 Ahora envuelto como asíncrono seguro
      formatter, 
      framework, 
      language
    );
    // --- FIN DE CAMBIOS ---
  });
}