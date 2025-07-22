// src/commands/init.ts
import { ConfigManager } from '../core/config-manager.js';
import { logger } from '../app/logger.js';

export function handleInitCommand(): void {
  const configManager = new ConfigManager();
  if (configManager.hasConfigFile()) {
    logger.warning('⚠️ A configuration file already exists.');
  } else {
    configManager.createSampleConfig();
  }
}
