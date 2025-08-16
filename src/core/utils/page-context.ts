// src/core/utils/page-context.ts
import { PageContext } from '../../types/index.js';

export async function getPageContext(): Promise<PageContext> {
  return {
    url: 'app://mobile', // puedes personalizar esto si es necesario
    title: 'Mobile App'
  };
}
