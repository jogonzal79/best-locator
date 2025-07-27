import { BestLocatorConfig } from '../../types/index.js';
import { IAIProvider } from './iai-provider.js';
import { OllamaProvider } from './providers/ollama-provider.js';
import { OpenAIProvider } from './providers/openai-provider.js';
import { logger } from '../../app/logger.js';

export function createAIProvider(config: BestLocatorConfig): IAIProvider | null {
  if (!config.ai.enabled || config.ai.provider === 'disabled') {
    return null;
  }

  switch (config.ai.provider) {
    case 'ollama':
      return new OllamaProvider(config.ai.ollama);
    case 'openai':
      try {
        return new OpenAIProvider(config.ai.openai);
      } catch (e: any) {
        logger.error(`Failed to initialize OpenAI provider: ${e.message}`);
        return null;
      }
    default:
      logger.warning(`Unknown AI provider "${config.ai.provider}". AI will be disabled.`);
      return null;
  }
}