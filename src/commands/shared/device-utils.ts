// Archivo: src/commands/shared/device-utils.ts

import { DeviceManager } from '../../app/device-manager.js';
import { MobileInspector } from '../../app/mobile-inspector.js';
import { logger } from '../../app/logger.js';
import { BestLocatorConfig } from '../../types/index.js';
import { ConfigManager } from '../../core/config-manager.js';

export interface DeviceSession {
  driver: any;
  config: BestLocatorConfig;
  platform: 'ios' | 'android';
  deviceManager: DeviceManager;
  inspector: MobileInspector;
}

export async function withDeviceSession<T>(
  appPath: string,
  platform: 'ios' | 'android',
  operation: (session: DeviceSession) => Promise<T>
): Promise<T | undefined> {
  
  const configManager = new ConfigManager();
  const config = await configManager.getConfig();

  if (!config.appium.enabled) {
    logger.error('Appium is not enabled in your configuration.');
    return undefined;
  }

  const deviceManager = new DeviceManager(config, platform);
  let inspector: MobileInspector | null = null;

  try {
    const driver = await deviceManager.connectAndLaunch(appPath);
    
    // Ahora pasamos config y platform al inspector
    inspector = new MobileInspector(deviceManager, config, platform, config.appium.inspector.port);
    
    await inspector.start();

    const session: DeviceSession = {
      driver,
      config,
      platform,
      deviceManager,
      inspector
    };
    
    return await operation(session);

  } catch (error: any) {
    logger.error('An error occurred during the mobile session:', error);
    return undefined;
  } finally {
    logger.info('Closing mobile session...');
    if (inspector) {
      await inspector.stop();
    }
    await deviceManager.close();
    logger.success('Session closed cleanly.');
  }
}