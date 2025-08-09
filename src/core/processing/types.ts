// src/core/processing/types.ts
import {
  SelectorResult,
  ElementInfo,
  MobileElementInfo,
  PageContext,
} from '../../types/index.js';
import { WebFramework, MobileFramework, Language } from '../formatters/types.js';

// Un tipo que representa cualquier tipo de información de elemento.
export type AnyElementInfo = ElementInfo | MobileElementInfo;

/**
 * Define el contrato para cualquier generador de selectores, ya sea para web o móvil.
 * Un generador debe ser capaz de producir un `SelectorResult` a partir de un elemento.
 */
export interface ISelectorGenerator {
  generateSelector(element: AnyElementInfo): SelectorResult;
  generateSelectorWithAI?(element: AnyElementInfo, context: PageContext): Promise<SelectorResult>;
}

/**
 * Define el contrato para cualquier formateador de frameworks.
 * Un formateador debe ser capaz de convertir un `SelectorResult` en un string de código.
 */
export interface IFormatter {
  format(result: SelectorResult, framework: WebFramework, language: Language): string;
  formatMobile(result: SelectorResult, platform: MobileFramework, language: Language): string;
}