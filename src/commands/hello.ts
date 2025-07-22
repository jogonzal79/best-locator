// src/commands/hello.ts
import { ConfigManager } from '../core/config-manager.js';
import { logger } from '../app/logger.js';
// Asegúrate de que package.json está accesible o pasa la versión como argumento
// Por simplicidad, aquí lo hardcodeamos o lo leemos.
// const packageJson = require('../../package.json');

export function handleHelloCommand(version: string): void {
    const configManager = new ConfigManager();
    logger.success(`🎉 Best-Locator v${version} is working!`);
    logger.info('✨ Ready to generate awesome selectors!');

    if (configManager.hasConfigFile()) {
        logger.success('⚙️ Configuration file detected!');
    } else {
        logger.warning('💡 Run "best-locator init" to create a config file');
    }
}