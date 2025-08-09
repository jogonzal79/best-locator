// src/core/formatters/types.ts

// Usamos el *mismo* SelectorResult del core para evitar colisiones.
import type { SelectorResult as CoreSelectorResult } from '../../types/index.js';

// Reexport del tipo del core (tests) para que todo use el mismo.
export type SelectorResult = CoreSelectorResult;

// ⚠️ No lo importamos del core porque no existe allí.
// Definimos el union aquí para todos los formatters.
export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'csharp';

// Frameworks soportados
export type WebFramework = 'playwright' | 'cypress' | 'selenium';
export type MobileFramework = 'ios' | 'android';
export type Framework = WebFramework | MobileFramework;

// Contratos
export interface IFormatter {
  format(selector: SelectorResult, framework: WebFramework, language: Language): string;
}

export interface IMobileFormatter {
  formatMobile(selector: SelectorResult, platform: MobileFramework, language: Language): string;
}
