// Archivo: src/commands/pick-mobile.ts

import { CommandOptions } from '../types/index.js';
import { withDeviceSession } from './shared/device-utils.js';
import { captureMobileElements } from './shared/mobile-element-capture.js';
import { processMobileAndOutput } from './shared/mobile-selector-processing.js';

export async function handlePickMobileCommand(
  appPath: string,
  platform: 'ios' | 'android' | undefined,
  language: string | undefined,
  options: CommandOptions
): Promise<void> {
  await withDeviceSession(appPath, platform || 'ios', async (session) => {
    // 1. Capturar el elemento usando el inspector móvil
    const elements = await captureMobileElements(session, 'single');

    // 2. Procesarlo y mostrar el resultado
    await processMobileAndOutput(elements, session, options, language);
  });
}