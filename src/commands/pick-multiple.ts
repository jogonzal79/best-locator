// src/commands/pick-multiple.ts

import { CommandOptions } from '../types/index.js';
import { withBrowserSession } from './shared/browser-utils.js';
import { captureElements } from './shared/element-capture.js';
// +++ INICIO DE CAMBIOS +++
import { processAndOutput } from './shared/selector-processor.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
// --- FIN DE CAMBIOS ---

export async function handlePickMultipleCommand(
  url: string,
  framework: string | undefined,
  language: string | undefined,
  options: CommandOptions
): Promise<void> {

  await withBrowserSession(url, async (session) => {
    // 1. Capturar los elementos
    const elements = await captureElements(session, 'multiple');

    // +++ INICIO DE CAMBIOS +++
    // 2. Crea los "especialistas" para la web
    const generator = new SelectorGenerator(session.config);
    const formatter = new FrameworkFormatter();

    // 3. Llama al orquestador central con las herramientas web
    await processAndOutput(elements, session, options, generator, formatter, framework, language);
    // --- FIN DE CAMBIOS ---
  });
}