// src/commands/go.ts

import { CommandOptions } from '../types/index.js';
import { withBrowserSession } from './shared/browser-utils.js';
import { captureElements } from './shared/element-capture.js';
// +++ INICIO DE CAMBIOS +++
import { processAndOutput } from './shared/selector-processor.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
// --- FIN DE CAMBIOS ---

export async function handleGoCommand(
  alias: string, 
  options: CommandOptions
): Promise<void> {
  
  await withBrowserSession(alias, async (session) => {
    // 1. Capturar el elemento
    const elements = await captureElements(session, 'single');

    // +++ INICIO DE CAMBIOS +++
    // 2. Crea los "especialistas" para la web
    const generator = new SelectorGenerator(session.config);
    const formatter = new FrameworkFormatter();

    // 3. Llama al orquestador central (sin framework y language explícitos, usa defaults)
    await processAndOutput(elements, session, options, generator, formatter);
    // --- FIN DE CAMBIOS ---
  });
}