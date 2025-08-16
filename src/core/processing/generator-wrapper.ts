import type {
  ISyncSelectorGenerator,
  IAsyncSelectorGenerator,
  AnyElementInfo,
} from './types.js';
import type { SelectorResult, PageContext } from '../../types/index.js';

/**
 * Envuelve un generador síncrono o asíncrono y devuelve una versión asíncrona unificada.
 */
export function wrapGenerator(
  generator: ISyncSelectorGenerator | IAsyncSelectorGenerator
): IAsyncSelectorGenerator {
  const isAsync = 'generateSelector' in generator && generator.generateSelector.length === 2;

  const wrapped: IAsyncSelectorGenerator = {
    async generateSelector(element: AnyElementInfo, context: PageContext): Promise<SelectorResult> {
      const result = (generator as any).generateSelector(element, context);
      return result instanceof Promise ? result : Promise.resolve(result);
    },
  };

  if ('generateSelectorWithAI' in generator) {
    wrapped.generateSelectorWithAI = async (
      element: AnyElementInfo,
      context: PageContext
    ): Promise<SelectorResult> => {
      const result = (generator as any).generateSelectorWithAI?.(element, context);
      return result instanceof Promise ? result : Promise.resolve(result);
    };
  }

  return wrapped;
}
