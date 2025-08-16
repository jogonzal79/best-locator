// src/core/generators/factory.ts
import { BestLocatorConfig } from '../../types/index.js';
import {
  ISyncSelectorGenerator,
  IAsyncSelectorGenerator,
} from '../processing/types.js';
import { SelectorGenerator } from '../selector-generator.js';
import { PlaywrightGenerator } from './web/playwright-generator.js';
import { CypressGenerator } from './web/cypress-generator.js';
import { SeleniumGenerator } from './web/selenium-generator.js';
import { TestCafeGenerator } from './web/testcafe-generator.js';
import { WebdriverIOGenerator } from './web/webdriverio-generator.js';

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export class GeneratorFactory {
  private static readonly USE_NEW_GENERATORS = process.env.USE_NEW_GENERATORS || 'false';

  static create(
    framework: string,
    config: BestLocatorConfig,
    document?: Document
  ): ISyncSelectorGenerator | IAsyncSelectorGenerator {
    console.log(`🔍 GeneratorFactory Config:`, {
      USE_NEW_GENERATORS: this.USE_NEW_GENERATORS,
      framework: framework,
      willUseNew: this.USE_NEW_GENERATORS === 'all' || this.USE_NEW_GENERATORS.includes(framework)
    });

    const enabledGenerators = this.USE_NEW_GENERATORS.split(',');
    const useNew = enabledGenerators.includes('all') || enabledGenerators.includes(framework);

    if (useNew) {
      console.log(`🚀 Using NEW ${framework}Generator`);
      switch (framework.toLowerCase()) {
        case 'react':
        case 'vue':
        case 'angular':
        case 'aspnet':
        case 'agnostic':
          return new SelectorGenerator(config, document); // ✅ implementa IAsyncSelectorGenerator
      }
    }

    // Generadores clásicos (sincrónicos)
    console.log('📦 Using ORIGINAL SelectorGenerator');

    switch (framework.toLowerCase()) {
      case 'playwright':
        return new PlaywrightGenerator(config);
      case 'cypress':
        return new CypressGenerator(config);
      case 'selenium':
        return new SeleniumGenerator(config);
      case 'testcafe':
        return new TestCafeGenerator(config);
      case 'webdriverio':
        return new WebdriverIOGenerator(config);
      default:
        console.log(`⚠️ Unknown framework ${framework}, using original`);
        return new SelectorGenerator(config, document);
    }
  }
}
