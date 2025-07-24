import { ElementInfo } from '../../types/index.js';

export interface IAIProvider {
  // Método genérico para generar texto a partir de un prompt
  generateText(prompt: string): Promise<string>;

  // Métodos que ya teníamos
  explainSelector?(selector: string, element: ElementInfo): Promise<string>;
  isAvailable(): Promise<boolean>;
}