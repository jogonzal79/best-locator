// src/commands/ai-test.ts
import { ConfigManager } from '../core/config-manager.js';
import { AIEngine } from '../core/ai-engine.js';
import { logger } from '../app/logger.js';

export async function handleAiTestCommand(): Promise<void> {
  try {
    const configManager = new ConfigManager();
    const config = await configManager.getConfig(); // <-- CORRECCIÓN: Se añade 'await'

    if (!config.ai?.enabled) {
      logger.warning('⚠️  AI is disabled in the configuration file.');
      logger.info('💡 To enable it, set: "ai": { "enabled": true } in your config.');
      return;
    }

    logger.info('🧪 Testing AI connection...');
    const aiEngine = new AIEngine(config); // Ahora 'config' es el objeto correcto
    const isAvailable = await aiEngine.isAvailable();

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
        const testResult = await aiEngine.generateSelector(testElement, testContext);
        logger.success('✅ Selector generation test passed!');
        logger.log(`   Generated: ${testResult.selector}`);
      } catch (genError: any) {
        logger.error('Selector generation test failed:', genError);
      }
    } else {
      logger.error('❌ AI connection failed.');
      logger.warning('💡 Make sure Ollama is running: ollama serve');
      logger.warning(`💡 And the model is installed: ollama pull ${config.ai.ollama.model}`);
    }
  } catch (error: any) {
    logger.error('An error occurred during the AI test:', error);
  }
}
