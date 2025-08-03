// src/core/__tests__/FrameworkFormatter.test.ts

import { FrameworkFormatter } from '../framework-formatter.js';
import { SelectorResult } from '../../types/index.js';

describe('FrameworkFormatter', () => {
  let formatter: FrameworkFormatter;

  beforeEach(() => {
    formatter = new FrameworkFormatter();
  });

  // Pruebas para Web
  describe('Web Formatting', () => {
    // ... las pruebas existentes ...

    it('should format a placeholder for Playwright in TypeScript', () => {
      const selectorResult: SelectorResult = {
        selector: 'Enter your username',
        type: 'placeholder',
        confidence: 65,
        reasoning: ''
      };
      const expected = "await page.getByPlaceholder('Enter your username')";
      expect(formatter.format(selectorResult, 'playwright', 'typescript')).toBe(expected);
    });

    it('should format an ID selector for Cypress', () => {
        const selectorResult: SelectorResult = {
          selector: 'main-content',
          type: 'id',
          confidence: 75,
          reasoning: ''
        };
        const expected = "cy.get('#main-content')";
        expect(formatter.format(selectorResult, 'cypress', 'javascript')).toBe(expected);
    });

    it('should correctly escape quotes for Selenium in Python', () => {
        const selectorResult: SelectorResult = {
          selector: "button[name=\"user's login\"]",
          type: 'css',
          confidence: 80,
          reasoning: ''
        };
        const expected = "driver.find_element(By.CSS_SELECTOR, \"button[name=\\\"user's login\\\"]\")";
        expect(formatter.format(selectorResult, 'selenium', 'python')).toBe(expected);
    });
  });

  // Pruebas para Móvil
  describe('Mobile Formatting', () => {
    // ... las pruebas existentes ...

    it('should format a UiAutomator selector for Android in Java', () => {
        const selectorResult: SelectorResult = {
          selector: 'new UiSelector().resourceId("com.app:id/button")',
          type: 'uiautomator',
          confidence: 70,
          reasoning: ''
        };
        const expected = 'driver.findElement(AppiumBy.androidUIAutomator("new UiSelector().resourceId(\\"com.app:id/button\\")"))';
        expect(formatter.formatMobile(selectorResult, 'android', 'java')).toBe(expected);
    });

    it('should format an iOS Predicate String for C#', () => {
        const selectorResult: SelectorResult = {
          selector: "type == 'XCUIElementTypeButton' AND label == 'Next'",
          type: 'ios-predicate',
          confidence: 75,
          reasoning: ''
        };
        const expected = 'driver.FindElement(MobileBy.IosNsPredicate("type == \'XCUIElementTypeButton\' AND label == \'Next\'"))';
        expect(formatter.formatMobile(selectorResult, 'ios', 'csharp')).toBe(expected);
    });
  });
});