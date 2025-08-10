// src/core/formatters/registry.ts

import { IFormatter, IMobileFormatter, WebFramework, MobileFramework } from './types.js';
import { PlaywrightFormatter } from './frameworks/playwright-formatter.js';
import { CypressFormatter } from './frameworks/cypress-formatter.js';
import { SeleniumFormatter } from './frameworks/selenium-formatter.js';
import { AppiumFormatter } from './frameworks/appium-formatter.js';
import { TestCafeFormatter } from './frameworks/testcafe-formatter.js';
import { WebdriverIOFormatter } from './frameworks/webdriverio-formatter.js';

export const webFormatters: Record<WebFramework, IFormatter> = {
  playwright: new PlaywrightFormatter(),
  cypress: new CypressFormatter(),
  selenium: new SeleniumFormatter(),
  testcafe: new TestCafeFormatter(),
  webdriverio: new WebdriverIOFormatter(),
};

export const mobileFormatters: Record<MobileFramework, IMobileFormatter> = {
  ios: new AppiumFormatter(),
  android: new AppiumFormatter(),
};
