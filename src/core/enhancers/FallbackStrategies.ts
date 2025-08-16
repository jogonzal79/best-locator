import { ElementInfo, SelectorResult } from '../../types/index.js';
import { StabilityValidator } from './StabilityValidator.js';

export class FallbackStrategies {
  constructor(private validator: StabilityValidator) {}

  tryTextStrategy(element: ElementInfo): SelectorResult | null {
    const text = element.textContent?.trim();
    if (!text || text.length > 50) return null;

    const generic = ['click', 'submit', 'cancel'].some(g => text.toLowerCase().includes(g));
    return {
      selector: text,
      confidence: generic ? 65 : 78,
      type: generic ? 'text-generic' : 'text-specific',
      reasoning: `Uses ${generic ? 'generic' : 'specific'} text content`,
      tagName: element.tagName
    };
  }

  tryStableCssStrategy(element: ElementInfo): SelectorResult | null {
    const classes = this.validator.filterStableClasses(element.className || '');
    if (!classes.length) return null;
    return {
      selector: `${element.tagName}.${classes[0]}`,
      confidence: 65,
      type: 'css-stable',
      reasoning: `Uses stable CSS class '${classes[0]}'`
    };
  }
}
