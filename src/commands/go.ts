import { CommandOptions } from '../types/index.js';
import { withBrowserSession } from './shared/browser-utils.js';
import { captureElements } from './shared/element-capture.js';
import { processAndOutput } from './shared/selector-processing.js';

export async function handleGoCommand(
  alias: string, 
  options: CommandOptions
): Promise<void> {
  
  await withBrowserSession(alias, async (session) => {
    // 1. Capturar el elemento
    const elements = await captureElements(session, 'single');

    // 2. Procesarlo y mostrar el resultado (usando defaults de la config)
    await processAndOutput(elements, session, options);
  });
}