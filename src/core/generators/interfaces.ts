// src/core/generators/interfaces.ts

import { PageContext, SelectorResult } from '../../types/index.js';
import { AnyElementInfo } from '../processing/types.js';

// Generador asíncrono (por ejemplo, AI o generación que usa contexto de página)
export interface IAsyncSelectorGenerator {
  generateSelector(elementInfo: AnyElementInfo, context: PageContext): Promise<SelectorResult>;
  generateSelectorWithAI?(elementInfo: AnyElementInfo, context: PageContext): Promise<SelectorResult>;
}

// Generador síncrono (por ejemplo, estrategias simples sin AI ni contexto)
export interface ISyncSelectorGenerator {
  generateSelector(elementInfo: AnyElementInfo): SelectorResult;
}
