// Archivo: src/commands/shared/mobile-element-capture.ts

import { DeviceSession } from './device-utils.js';
import { MobileElementInfo } from '../../types/index.js';
import { logger } from '../../app/logger.js';

export type MobileCaptureType = 'single' | 'multiple';

export async function captureMobileElements(
  session: DeviceSession,
  type: MobileCaptureType
): Promise<MobileElementInfo[]> {

  const { inspector } = session;

  logger.info(`✅ Mobile Inspector started at http://localhost:${session.config.appium.inspector.port}`);
  logger.info('ACTION REQUIRED: Select elements in the web interface...');

  // Esta es la línea clave: la ejecución se pausa aquí hasta que se selecciona algo en la UI.
  const elements = await inspector.waitForSelection(type);

  if (!elements || elements.length === 0) {
    logger.warning('No elements were selected.');
    return [];
  }

  logger.success(`✅ Captured ${elements.length} mobile element(s)!`);
  return elements;
}