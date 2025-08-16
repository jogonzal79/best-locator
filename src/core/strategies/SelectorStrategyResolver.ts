// src/core/strategies/SelectorStrategyResolver.ts

import { ISelectorStrategy } from './ISelectorStrategy.js';
import { AgnosticSelectorStrategy } from './AgnosticSelectorStrategy.js';
import { ReactSelectorStrategy } from './ReactSelectorStrategy.js';
import { VueSelectorStrategy } from './VueSelectorStrategy.js';
import { AngularSelectorStrategy } from './AngularSelectorStrategy.js';
import { ASPNetSelectorStrategy } from './ASPNetSelectorStrategy.js';
import { DjangoSelectorStrategy } from './DjangoSelectorStrategy.js';
import { TailwindSelectorStrategy } from './TailwindSelectorStrategy.js';

export class SelectorStrategyResolver {
  static resolve(stack?: string): ISelectorStrategy {
    let strategy: ISelectorStrategy;

    switch (stack?.toLowerCase()) {
      case 'react':
        strategy = new ReactSelectorStrategy();
        break;
      case 'vue':
        strategy = new VueSelectorStrategy();
        break;
      case 'angular':
        strategy = new AngularSelectorStrategy();
        break;
      case 'aspnet':
      case 'asp.net':
        strategy = new ASPNetSelectorStrategy();
        break;
      case 'django':
        strategy = new DjangoSelectorStrategy();
        break;
      case 'tailwind':
        strategy = new TailwindSelectorStrategy();
        break;
      case 'next':
      case 'next.js':
        strategy = new ReactSelectorStrategy();
        break;
      case 'nuxt':
      case 'nuxt.js':
        strategy = new VueSelectorStrategy();
        break;
      default:
        console.warn(`⚠️ Stack '${stack}' not recognized. Using agnostic strategy.`);
        strategy = new AgnosticSelectorStrategy();
        break;
    }

    console.log(`🔧 Selector strategy resolved: ${strategy.name}`);
    return strategy;
  }
}
