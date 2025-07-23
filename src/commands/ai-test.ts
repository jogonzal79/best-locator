// src/commands/ai-test.ts
import { ConfigManager } from '../core/config-manager.js';
import { AIEngine } from '../core/ai-engine.js';
import { logger } from '../app/logger.js';

export async function handleAiTestCommand(): Promise<void> {
  try {
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();

    if (!config.ai?.enabled) {
      logger.warning('⚠️  AI is disabled in the configuration file.');
      logger.info('💡 To enable it, set: "ai": { "enabled": true } in your config.');
      return;
    }

    logger.info('🧪 Testing AI connection...');
    const aiEngine = new AIEngine(config);
    const isAvailable = await aiEngine.isAvailable();

    // ================== INICIO DE LA CORRECCIÓN ==================
    if (isAvailable) {
      logger.success('✅ AI is working correctly!');
      logger.info(`🤖 Model: ${config.ai.ollama.model}`);
      logger.info(`🔗 Host: ${config.ai.ollama.host}`);

      logger.nl();
      logger.info('🔬 Testing selector generation...');
      const testElement = {
        tagName: 'button',
        id: 'submit-btn',
        className: 'btn btn-primary',
        textContent: 'Submit',
        attributes: { 'data-test': 'submit-button', type: 'submit' },
      };
      const testContext = { url: 'test', title: 'Test Page', pageType: 'test' };

      try {
        // Usamos el método 'generate' unificado
        const testResult = await aiEngine.generateSelector(testElement, testContext);
        logger.success('✅ Selector generation test passed!');
        logger.log(`   Generated: ${testResult.selector}`);
      } catch (genError: any) {
        logger.error('Selector generation test failed:', genError);
      }
    } else {
      // Esta es la lógica que se ejecutará cuando Ollama no esté disponible
      logger.error('❌ AI connection failed.');
      logger.warning('💡 Make sure Ollama is installed and running.');
      logger.warning('   - On macOS/Windows, check if the Ollama application is open.');
      logger.warning('   - On Linux, run: systemctl status ollama');
      logger.warning(`💡 Ensure the model is installed: ollama pull ${config.ai.ollama.model}`);
    }
    // =================== FIN DE LA CORRECCIÓN ====================

  } catch (error: any) {
    logger.error('An error occurred during the AI test:', error);
  }
}
