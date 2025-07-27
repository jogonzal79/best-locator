import { CommandOptions } from '../types/index.js';
import { withBrowserSession } from './shared/browser-utils.js';
import { captureElements } from './shared/element-capture.js';
import { processAndOutput } from './shared/selector-processing.js';

export async function handlePickMultipleCommand(
  url: string,
  framework: string | undefined,
  language: string | undefined,
  options: CommandOptions
): Promise<void> {

  await withBrowserSession(url, async (session) => {
    // 1. Capturar los elementos
    const elements = await captureElements(session, 'multiple');

    // 2. Procesarlos y mostrar los resultados
    await processAndOutput(elements, session, options, framework, language);
  });
}