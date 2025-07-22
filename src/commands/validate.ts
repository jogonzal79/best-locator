// src/commands/validate.ts
import { ConfigManager } from '../core/config-manager.js';
import { SelectorValidator } from '../core/selector-validator.js';
import { BrowserManager } from '../app/browser-manager.js';
import { logger } from '../app/logger.js';

export async function handleValidateCommand(url: string, selector: string): Promise<void> {
    const configManager = new ConfigManager();
    const config = configManager.getConfig();
    const resolvedUrl = configManager.getUrl(url) || url;

    const browserManager = new BrowserManager(config);

    try {
        const page = await browserManager.launchAndNavigate(resolvedUrl);
        
        logger.nl();
        logger.info(`🔍 Validating selector on ${resolvedUrl}...`);
        
        const validator = new SelectorValidator();
        const startTime = Date.now();
        const result = await validator.validate(page, selector);
        const duration = Date.now() - startTime;

        // Usamos el método que ya tenías para mostrar resultados
        validator.displayResult(result, selector);
        
        logger.nl();
        logger.info(`⏱️  Validation time: ${duration}ms`);

    } catch (error: any) {
        logger.error('An error occurred during the validate command:', error);
    } finally {
        await browserManager.close();
    }
}