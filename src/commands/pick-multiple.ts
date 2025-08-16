// src/commands/pick-multiple.ts

import { CommandOptions } from '../types/index.js';
import { withBrowserSession } from './shared/browser-utils.js';
import { captureElements } from './shared/element-capture.js';
import { processAndOutput } from './shared/selector-processor.js';
import { GeneratorFactory } from '../core/generators/factory.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { IAsyncSelectorGenerator } from '../core/generators/interfaces.js'; // ✅ NUEVO

export async function handlePickMultipleCommand(
  url: string,
  framework: string | undefined,
  language: string | undefined,
  options: CommandOptions
): Promise<void> {
  await withBrowserSession(url, async (session) => {
    // 1. Capturar los elementos
    const elements = await captureElements(session, 'multiple');

    // 2. Crea los "especialistas" para la web
    const generator = GeneratorFactory.create(
      framework || session.config.defaultFramework,
      session.config
    ) as IAsyncSelectorGenerator; // ✅ CASTING

    const formatter = new FrameworkFormatter();

    // 3. Llama al orquestador central con las herramientas web
    await processAndOutput(elements, session, options, generator, formatter, framework, language);
  });
}
