// src/core/processing/types.ts
import type { SelectorResult, PageContext } from '../../types/index.js';
import type { WebFramework, MobileFramework, Language } from '../formatters/types.js';

// Mantén esto agnóstico: cada generador castea internamente al tipo que necesite
export type AnyElementInfo = unknown;

/**
 * Contrato de generadores de selectores (web o móvil).
 * `generateSelectorWithAI` es opcional y solo lo implementan los que soportan AI.
 */
export interface ISelectorGenerator {
  generateSelector(element: AnyElementInfo): SelectorResult;
  generateSelectorWithAI?(
    element: AnyElementInfo,
    context: PageContext
  ): Promise<SelectorResult>;
}

/**
 * Contrato de formatters por framework.
 * Para web es `format`. Para móvil dejamos `formatMobile` como opcional.
 */
export interface IFormatter {
  format(result: SelectorResult, framework: WebFramework, language: Language): string;
  formatMobile?(
    result: SelectorResult,
    platform: MobileFramework,
    language: Language
  ): string;
}
