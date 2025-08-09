// src/commands/pick-mobile-multiple.ts

import { CommandOptions } from '../types/index.js';
import { withDeviceSession } from './shared/device-utils.js';
import { captureMobileElements } from './shared/mobile-element-capture.js';
// +++ INICIO DE CAMBIOS +++
import { processAndOutput } from './shared/selector-processor.js';
import { MobileSelectorGenerator } from '../core/mobile-selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
// --- FIN DE CAMBIOS ---

export async function handlePickMobileMultipleCommand(
  appPath: string,
  platform: 'ios' | 'android' | undefined,
  language: string | undefined,
  options: CommandOptions
): Promise<void> {
  await withDeviceSession(appPath, platform || 'ios', async (session) => {
    // La única diferencia es que aquí pasamos 'multiple'
    const elements = await captureMobileElements(session, 'multiple');
    
    // +++ INICIO DE CAMBIOS +++
    // 2. Crea los "especialistas" para móvil
    const generator = new MobileSelectorGenerator(session.config, session.platform);
    const formatter = new FrameworkFormatter();

    // 3. Llama al orquestador con las herramientas móviles
    await processAndOutput(elements, session, options, generator, formatter, session.platform, language);
    // --- FIN DE CAMBIOS ---
  });
}