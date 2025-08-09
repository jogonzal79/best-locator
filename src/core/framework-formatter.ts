// src/core/framework-formatter.ts

// Solo importamos SelectorResult del core; Language NO viene del core.
import type { SelectorResult as CoreSelectorResult } from '../types/index.js';

// +++ INICIO DE CAMBIOS +++
import {
  Framework,
  WebFramework,
  MobileFramework,
  IFormatter, // <- AÑADIDO
  IMobileFormatter,
  Language, // usamos el Language definido en formatters/types.ts
} from './formatters/types.js';
// --- FIN DE CAMBIOS ---

import { webFormatters, mobileFormatters } from './formatters/registry.js';

// +++ INICIO DE CAMBIOS +++
export class FrameworkFormatter implements IFormatter { // <- AÑADIDO
// --- FIN DE CAMBIOS ---
  public format(selectorResult: CoreSelectorResult, framework: WebFramework, language: Language): string {
    const formatter: IFormatter | undefined = webFormatters[framework];
    if (!formatter) throw new Error(`No formatter found for web framework: ${framework}`);
    return formatter.format(selectorResult, framework, language);
  }

  public formatMobile(selectorResult: CoreSelectorResult, platform: MobileFramework, language: Language): string {
    const formatter: IMobileFormatter | undefined = mobileFormatters[platform];
    if (!formatter) throw new Error(`No mobile formatter found for platform: ${platform}`);
    return formatter.formatMobile(selectorResult, platform, language);
  }

  public autoFormat(selectorResult: CoreSelectorResult, framework: Framework, language: Language): string {
    if (framework === 'ios' || framework === 'android') {
      return this.formatMobile(selectorResult, framework, language);
    }
    return this.format(selectorResult, framework as WebFramework, language);
  }
}