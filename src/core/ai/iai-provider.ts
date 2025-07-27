import { ElementInfo } from '../../types/index.js';

export interface IAIProvider {
  generateText(prompt: string): Promise<string>;
  explainSelector?(selector: string, element: ElementInfo): Promise<string>;
  isAvailable(): Promise<boolean>;
}