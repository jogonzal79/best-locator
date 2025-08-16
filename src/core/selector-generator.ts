// src/core/selector-generator.ts
import { AIEngine } from './ai-engine.js';
import { AriaCalculator } from './ai/aria-calculator.js';
import { BestLocatorConfig, ElementInfo, PageContext, SelectorResult } from '../types/index.js';
import { ISelectorStrategy } from './strategies/ISelectorStrategy.js';
import { SelectorStrategyResolver } from './strategies/SelectorStrategyResolver.js';
import { ARIAEnhancer } from './enhancers/ARIAEnhancer.js';
import { StabilityValidator } from './enhancers/StabilityValidator.js';
import { FallbackStrategies } from './generators/fallback-strategies.js'; // ✅ nuevo import
import { AIEnhancer } from './enhancers/AIEnhancer.js';
import { IAsyncSelectorGenerator } from './processing/types.js';
import { detectStack } from './utils/stack-detector.js';

export class SelectorGenerator implements IAsyncSelectorGenerator {
  private config: BestLocatorConfig;
  private strategy: ISelectorStrategy;
  private ariaEnhancer: ARIAEnhancer;
  private stabilityValidator: StabilityValidator;
  private fallbackStrategies: FallbackStrategies;
  private aiEnhancer: AIEnhancer;

  constructor(config: BestLocatorConfig, document?: Document) {
    this.config = config;
    this.ariaEnhancer = new ARIAEnhancer(new AriaCalculator());
    this.stabilityValidator = new StabilityValidator();
    this.fallbackStrategies = new FallbackStrategies(); // ✅ ya no requiere argumentos
    this.aiEnhancer = new AIEnhancer(config?.ai?.enabled ? new AIEngine(config) : undefined);

    const stack = document ? detectStack(document) : undefined;
    this.strategy = SelectorStrategyResolver.resolve(stack);
  }

  async generateSelectorWithAI(elementInfo: ElementInfo, context: PageContext): Promise<SelectorResult> {
    const result = await this.generate(elementInfo, context);
    return result || this.createFallback(elementInfo);
  }

  async generate(element: ElementInfo, context?: PageContext): Promise<SelectorResult | null> {
    const sanitizedElement = this.sanitizeElementInfo(element);
    const enrichedElement = this.ariaEnhancer.enhance(sanitizedElement);

    const priorityResult = this.getPrioritySelector(enrichedElement);
    if (priorityResult) return priorityResult;

    const ariaResult = this.ariaEnhancer.tryARIAStrategy(enrichedElement);
    if (ariaResult && ariaResult.confidence >= 85) return ariaResult;

    let result = this.strategy.evaluate(enrichedElement);

    if (result && !this.isResultStable(result, enrichedElement)) {
      result = null;
    }

    if (!result || result.confidence < 70) {
      result = this.tryFallbackStrategies(enrichedElement) || result;
    }

    result = await this.aiEnhancer.enhance(result, enrichedElement, context);

    return result;
  }

  generateSelector(element: ElementInfo, context: PageContext): Promise<SelectorResult | null> {
    return this.generate(element, context);
  }

  private isResultStable(result: SelectorResult, element: ElementInfo): boolean {
    if (result.type === 'id') {
      const id = result.selector.replace('#', '');
      return this.stabilityValidator.isStableId(id);
    }

    if (result.type === 'css-stable') {
      const className = result.selector.split('.').pop();
      return className ? this.stabilityValidator.isStableClass(className) : false;
    }

    return true;
  }

  private tryFallbackStrategies(element: ElementInfo): SelectorResult | null {
    const strategies = [
      () => this.fallbackStrategies.tryLinkStrategy(element),
      () => this.fallbackStrategies.tryDataAttributeStrategy(element),
      () => this.fallbackStrategies.tryNthChildStrategy(element),
    ];

    for (const strategy of strategies) {
      const result = strategy();
      if (result && result.confidence >= 40) return result;
    }

    return null;
  }

  private getPrioritySelector(element: ElementInfo): SelectorResult | null {
    for (const attr of this.config.projectAttributes) {
      if (element.attributes[attr]) {
        return {
          selector: element.attributes[attr],
          confidence: 100,
          type: 'test-id',
          reasoning: `Selected attribute '${attr}'`
        };
      }
    }
    return null;
  }

  private sanitizeElementInfo(element: ElementInfo): ElementInfo {
    return {
      tagName: String(element.tagName || 'div').toLowerCase(),
      id: String(element.id || ''),
      className: typeof element.className === 'string' ? element.className : '',
      textContent: String(element.textContent || ''),
      attributes: element.attributes && typeof element.attributes === 'object' ? element.attributes : {},
      order: element.order,
      computedRole: element.computedRole,
      accessibleName: element.accessibleName,
    };
  }

  private createFallback(element: ElementInfo): SelectorResult {
    return {
      selector: element.tagName,
      confidence: 25,
      type: 'fallback',
      reasoning: 'Ultimate fallback to tag name'
    };
  }

  setStrategy(strategy: ISelectorStrategy) {
    this.strategy = strategy;
  }
}
