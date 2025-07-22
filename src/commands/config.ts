// src/commands/config.ts
import { ConfigManager } from '../core/config-manager.js';
import { logger } from '../app/logger.js';

export function handleConfigCommand(): void {
  const configManager = new ConfigManager();
  const config = configManager.getConfig();

  logger.nl();
  logger.info('⚙️  Current Configuration:');
  logger.log(`   Default Framework: ${config.defaultFramework}`);
  logger.log(`   Default Language:  ${config.defaultLanguage}`);

  logger.nl();
  logger.info('🧪 Output:');
  logger.log(`   Include Confidence: ${config.output.includeConfidence ? 'Yes' : 'No'}`);
  logger.log(`   Include XPath:      ${config.output.includeXPath ? 'Yes' : 'No'}`);

  logger.nl();
  logger.info('🌐 Browser:');
  logger.log(`   Headless: ${config.browser.headless ? 'Yes' : 'No'}`);
  logger.log(`   Viewport: ${config.browser.viewport.width}x${config.browser.viewport.height}`);

  logger.nl();
  logger.info('🔗 URLs:');
  if (Object.keys(config.urls).length === 0) {
    logger.warning('   No URL aliases configured');
  } else {
    Object.entries(config.urls).forEach(([key, value]) => {
      logger.success(`   ${key}: ${value}`);
    });
  }

  logger.nl();
  logger.info('🏷️  Project Attributes:');
  config.projectAttributes.forEach(attr => {
    logger.success(`   ${attr}`);
  });

  logger.nl();
  logger.info('⏱️  Timeouts:');
  logger.log(`   Page Load:         ${config.timeouts.pageLoad}ms`);
  logger.log(`   Element Selection: ${config.timeouts.elementSelection}ms`);
  logger.log(`   Validation:        ${config.timeouts.validation}ms`);
}