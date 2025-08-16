import { AIEngine } from '../../core/ai-engine.js';
import { ElementInfo, PageContext, SelectorResult } from '../../types/index.js';

export class AIEnhancer {
  constructor(private aiEngine?: AIEngine) {}

  async enhance(
    current: SelectorResult | null,
    element: ElementInfo,
    context?: PageContext
  ): Promise<SelectorResult | null> {
    if (current?.confidence >= 80 || !this.aiEngine) return current;

    const fallbackContext: PageContext = context || {
      url: 'unknown',
      title: 'unknown'
    };

    try {
      const aiResult = await this.aiEngine.generateSelector(element, fallbackContext);
      return !current || aiResult.confidence > current.confidence ? aiResult : current;
    } catch {
      console.warn('⚠️ AI fallback failed');
      return current;
    }
  }
}
