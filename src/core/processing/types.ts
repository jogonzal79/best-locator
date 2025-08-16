// src/core/processing/types.ts
import type { SelectorResult, PageContext, ElementInfo } from '../../types/index.js';
import type { WebFramework, MobileFramework, Language } from '../formatters/types.js';

/**
 * Contrato para generadores antiguos SIN contexto ni async.
 */
export interface ISyncSelectorGenerator {
  generateSelector(element: ElementInfo): SelectorResult;
}

/**
 * Contrato para generadores nuevos CON contexto y async.
 */
export interface IAsyncSelectorGenerator {
  generateSelector(element: ElementInfo, context: PageContext): Promise<SelectorResult>;
  generateSelectorWithAI?(
    element: ElementInfo,
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

// 🔧 Tipado que admite elementos web y móviles
export type AnyElementInfo = ElementInfo | import('../../types/mobile.js').MobileElementInfo;
