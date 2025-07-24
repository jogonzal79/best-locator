import { ConfigManager } from '../core/config-manager.js';
import { AIEngine } from '../core/ai-engine.js';
import { logger } from '../app/logger.js';

export async function handleAiTestCommand(): Promise<void> {
  const configManager = new ConfigManager();
  const config = await configManager.getConfig();

  if (!config.ai?.enabled) {
    logger.warning('⚠️  AI is disabled in the configuration file.');
    return;
  }

  const providerName = config.ai.provider;
  logger.info(`🧪 Testing AI provider: ${providerName}...`);
  
  const aiEngine = new AIEngine(config);
  const isAvailable = await aiEngine.isAvailable();

  if (isAvailable) {
    logger.success(`✅ Connection to ${providerName} is successful!`);
    
    // Accede dinámicamente a la configuración del proveedor activo
    const providerConfig = config.ai[providerName];
    
    if (providerConfig && 'model' in providerConfig) {
      logger.info(`🤖 Model: ${providerConfig.model}`);
    }
    if (providerConfig && 'host' in providerConfig) {
      logger.info(`🔗 Host: ${providerConfig.host}`);
    }
  } else {
    logger.error(`❌ AI connection to ${providerName} failed.`);
    if (providerName === 'ollama') {
      logger.warning('💡 Make sure Ollama is installed and running.');
    } else if (providerName === 'openai') {
      logger.warning('💡 Check your internet connection and ensure the OPENAI_API_KEY is correct.');
    }
  }
}