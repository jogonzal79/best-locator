// src/commands/go.ts
import { CommandOptions } from '../types/index.js';
import { withBrowserSession } from './shared/browser-utils.js';
import { captureElements } from './shared/element-capture.js';
import { processAndOutput } from './shared/selector-processor.js';
import { GeneratorFactory } from '../core/generators/factory.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { IAsyncSelectorGenerator } from '../core/generators/interfaces.js';

export async function handleGoCommand(
  alias: string, 
  options: CommandOptions
): Promise<void> {
  
  await withBrowserSession(alias, async (session) => {
    // 1. Capturar el elemento
    const elements = await captureElements(session, 'single');

    // 2. Usar el framework por defecto del config
    const generator = GeneratorFactory.create(
      session.config.defaultFramework,
      session.config
    ) as IAsyncSelectorGenerator; // ✅ CAST EXPLÍCITO

    const formatter = new FrameworkFormatter();

    // 3. Llamar al procesador sin framework explícito
    await processAndOutput(elements, session, options, generator, formatter);
  });
}
