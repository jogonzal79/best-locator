import { BestLocatorConfig, ElementInfo, PageContext, SelectorResult } from '../types/index.js';
import { createAIProvider } from './ai/ai-provider-factory.js';
import { getBestLocatorStrategy } from './ai/ai-orchestrator.js';
import { logger } from '../app/logger.js';
import { IAIProvider } from './ai/iai-provider.js';

export class AIEngine {
  private provider: IAIProvider | null;
  private config: BestLocatorConfig;

  constructor(config: BestLocatorConfig) {
    this.config = config;
    this.provider = createAIProvider(config);
  }

  async generateSelector(element: ElementInfo, context: PageContext): Promise<SelectorResult> {
    if (!this.provider) {
      throw new Error("AI provider is not available or is disabled.");
    }
    
    logger.info(`✨ Asking ${this.config.ai.provider} for a smart locator strategy...`);
    
    try {
      const strategyResult = await getBestLocatorStrategy(this.provider, element);
      
      return {
        selector: strategyResult.value,
        type: strategyResult.strategy,
        confidence: 99,
        reasoning: `AI Strategy: ${strategyResult.strategy}`,
        aiEnhanced: true,
      };

    } catch (error: any) {
      logger.error(`AI orchestration failed: ${error.message}`);
      throw error;
    }
  }

  async explainSelector(selector: string, element: ElementInfo): Promise<string> {
    if (this.provider?.explainSelector) {
      return this.provider.explainSelector(selector, element);
    }
    return "Explanation not available for this provider.";
  }

  async isAvailable(): Promise<boolean> {
    if (!this.provider) return false;
    return this.provider.isAvailable();
  }
}