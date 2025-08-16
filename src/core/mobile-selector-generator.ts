// Archivo: src/core/mobile-selector-generator.ts

import { SelectorGenerator } from './selector-generator.js';
import { BestLocatorConfig, MobileElementInfo, SelectorResult, PageContext } from '../types/index.js';
import type { AnyElementInfo } from './processing/types.js';

export class MobileSelectorGenerator extends SelectorGenerator {
  private platform: 'ios' | 'android';

  constructor(config: BestLocatorConfig, platform: 'ios' | 'android') {
    super(config);
    this.platform = platform;
  }

  // 🔧 CORREGIDO: Compatible con clase base (async + context)
  public async generateSelector(elementInfo: AnyElementInfo, context: PageContext): Promise<SelectorResult> {
    const mobileElementInfo = elementInfo as MobileElementInfo;
    if (this.platform === 'ios') {
      return this.generateIOSSelector(mobileElementInfo);
    } else {
      return this.generateAndroidSelector(mobileElementInfo);
    }
  }

  private generateIOSSelector(element: MobileElementInfo): SelectorResult {
    const { accessibilityId, text, attributes } = element;
    const isRealText = text && /[a-zA-Z0-9]/.test(text);

    if (accessibilityId && accessibilityId.trim() && accessibilityId !== 'null') {
      return this.mobileResult(accessibilityId, 95, 'accessibility-id', 'Uses iOS accessibility identifier');
    }
    if (isRealText && text.trim().length < 50) {
      return this.mobileResult(text.trim(), 85, 'text', 'Uses visible text content');
    }
    const predicate = this.buildIOSPredicate(element);
    if (predicate) {
      return this.mobileResult(predicate, 75, 'ios-predicate', 'Uses iOS predicate string');
    }
    const xpath = this.buildMobileXPath(element, 'ios');
    return this.mobileResult(xpath, 45, 'xpath', 'Fallback XPath selector');
  }

  private generateAndroidSelector(element: MobileElementInfo): SelectorResult {
    const { resourceId, text, accessibilityId, attributes, className } = element;
    const contentDesc = attributes && attributes['content-desc'];
    const isRealText = text && /[a-zA-Z0-9]/.test(text);

    if (resourceId && resourceId.includes(':id/') && resourceId !== 'null') {
      const idName = resourceId.split(':id/')[1];
      return this.mobileResult(idName, 95, 'resource-id', 'Uses Android resource identifier');
    }
    if (accessibilityId && accessibilityId.trim() && accessibilityId !== 'null') {
      return this.mobileResult(accessibilityId, 90, 'accessibility-id', 'Uses accessibility identifier');
    }
    if (contentDesc && contentDesc.trim() && contentDesc !== 'null') {
      return this.mobileResult(contentDesc, 85, 'accessibility-id', 'Uses content-desc as accessibility id');
    }
    if (isRealText && text.trim().length < 50) {
      return this.mobileResult(text.trim(), 80, 'text', 'Uses visible text content');
    }

    const uiAutomator = this.buildUiAutomatorSelector(element);
    if (uiAutomator && uiAutomator !== `new UiSelector().className("${className}")`) {
      return this.mobileResult(uiAutomator, 70, 'uiautomator', 'Uses UiAutomator selector');
    }

    const xpath = this.buildMobileXPath(element, 'android');
    return this.mobileResult(xpath, 45, 'xpath', 'Fallback XPath selector');
  }

  private buildIOSPredicate(element: MobileElementInfo): string | null {
    const { text, attributes, className } = element;
    const conditions: string[] = [];
    const isRealText = text && /[a-zA-Z0-9]/.test(text);

    if (className && className !== 'null') {
      conditions.push(`type == '${className}'`);
    }
    if (isRealText) {
      conditions.push(`label == '${text.trim()}'`);
    }
    if (attributes && attributes.value && attributes.value !== 'null') {
      conditions.push(`value == '${attributes.value}'`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : null;
  }

  private buildUiAutomatorSelector(element: MobileElementInfo): string | null {
    const { text, resourceId, attributes, className } = element;
    const parts: string[] = [];
    const isRealText = text && /[a-zA-Z0-9]/.test(text);
    const contentDesc = attributes && attributes['content-desc'];

    if (contentDesc && contentDesc !== 'null') {
      parts.push(`description("${contentDesc}")`);
    }
    if (resourceId && resourceId !== 'null') {
      parts.push(`resourceId("${resourceId}")`);
    }
    if (isRealText) {
      parts.push(`text("${text.trim()}")`);
    }
    if (className && className !== 'null') {
      parts.push(`className("${className}")`);
    }

    if (parts.length === 0) return null;
    return `new UiSelector().${parts.join('.')}`;
  }

  private buildMobileXPath(element: MobileElementInfo, platform: 'ios' | 'android'): string {
    const { text, attributes, className, resourceId } = element;
    const tag = (attributes && attributes.class) || className || '*';
    let xpath = `//${tag}`;
    const conditions: string[] = [];
    const textToUse = text && text.trim();
    const contentDesc = attributes && attributes['content-desc'];

    if (platform === 'ios') {
      if (textToUse) conditions.push(`@label='${textToUse}'`);
      if (attributes && attributes.value && attributes.value !== 'null') {
        conditions.push(`@value='${attributes.value}'`);
      }
    } else {
      if (contentDesc && contentDesc !== 'null') {
        conditions.push(`@content-desc='${contentDesc}'`);
      } else if (textToUse) {
        conditions.push(`@text='${textToUse}'`);
      }
      if (resourceId && resourceId !== 'null') {
        conditions.push(`@resource-id='${resourceId}'`);
      }
    }

    if (conditions.length > 0) {
      xpath += `[${conditions.join(' and ')}]`;
    }
    return xpath;
  }

  private mobileResult(selector: string, confidence: number, type: string, reasoning: string): SelectorResult {
    return {
      selector,
      confidence,
      type,
      reasoning,
      aiEnhanced: false
    };
  }
}
