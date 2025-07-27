import { CommandOptions } from '../types/index.js';
import { withBrowserSession } from './shared/browser-utils.js';
import { captureElements } from './shared/element-capture.js';
import { processAndOutput } from './shared/selector-processing.js';

export async function handlePickCommand(
  url: string,
  framework: string | undefined,
  language: string | undefined,
  options: CommandOptions
): Promise<void> {
  
  await withBrowserSession(url, async (session) => {
    // 1. Capturar el elemento
    const elements = await captureElements(session, 'single');

    // 2. Procesarlo y mostrar el resultado
    await processAndOutput(elements, session, options, framework, language);
  });
}