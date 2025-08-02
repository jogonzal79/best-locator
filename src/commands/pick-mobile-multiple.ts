// Archivo: src/commands/pick-mobile-multiple.ts

import { CommandOptions } from '../types/index.js';
import { withDeviceSession } from './shared/device-utils.js';
import { captureMobileElements } from './shared/mobile-element-capture.js';
import { processMobileAndOutput } from './shared/mobile-selector-processing.js';

export async function handlePickMobileMultipleCommand(
  appPath: string,
  platform: 'ios' | 'android' | undefined,
  language: string | undefined,
  options: CommandOptions
): Promise<void> {
  await withDeviceSession(appPath, platform || 'ios', async (session) => {
    // La única diferencia es que aquí pasamos 'multiple'
    const elements = await captureMobileElements(session, 'multiple');
    await processMobileAndOutput(elements, session, options, language);
  });
}