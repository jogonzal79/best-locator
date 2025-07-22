// src/commands/hello.ts
import { ConfigManager } from '../core/config-manager.js';
import { logger } from '../app/logger.js';

export async function handleHelloCommand(version: string): Promise<void> {
    const configManager = new ConfigManager();
    // Esperamos a que la configuración se cargue para comprobar si el archivo existe
    await configManager.getConfig(); 

    logger.success(`🎉 Best-Locator v${version} is working!`);
    logger.info('✨ Ready to generate awesome selectors!');

    if (configManager.hasConfigFile()) {
        logger.success('⚙️ Configuration file detected!');
    } else {
        // ================== INICIO DE LA CORRECCIÓN ==================
        logger.warning('💡 Run "bestlocator init" to create a config file');
        // =================== FIN DE LA CORRECCIÓN ====================
    }
}
