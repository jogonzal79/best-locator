import { ElementInfo, SelectorResult } from '../../types/index.js';

export interface ISelectorStrategy {
  name: string;
  evaluate(element: ElementInfo): SelectorResult | null;
}
