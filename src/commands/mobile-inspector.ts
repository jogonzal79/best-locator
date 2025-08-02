// Archivo: src/commands/mobile-inspector.ts

import { withDeviceSession } from './shared/device-utils.js';
import { logger } from '../app/logger.js';

export async function handleMobileInspectorCommand(
  appPath: string,
  platform: 'ios' | 'android' | undefined,
): Promise<void> {
  await withDeviceSession(appPath, platform || 'ios', async (session) => {
    logger.info('Inspector is running. Press CTRL+C in the terminal to exit.');
    // Mantiene la sesión abierta hasta que el usuario la cierre manualmente.
    await new Promise(resolve => setTimeout(resolve, 3600000)); // 1 hora
  });
}