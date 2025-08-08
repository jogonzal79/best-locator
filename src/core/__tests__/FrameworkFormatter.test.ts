// src/core/__tests__/FrameworkFormatter.test.ts - VERSIÓN MEJORADA

import { FrameworkFormatter } from '../framework-formatter.js';
import { SelectorResult } from '../../types/index.js';

describe('FrameworkFormatter', () => {
  let formatter: FrameworkFormatter;

  beforeEach(() => {
    formatter = new FrameworkFormatter();
  });

  // ========== TESTS EXISTENTES (mantener) ==========
  
  describe('Web Formatting', () => {
    it('should format a test-id for Playwright in TypeScript', () => {
      const selectorResult: SelectorResult = {
        selector: 'login-button',
        type: 'test-id',
        confidence: 100,
        reasoning: 'Uses test ID'
      };
      const expected = "await page.getByTestId('login-button')";
      expect(formatter.format(selectorResult, 'playwright', 'typescript')).toBe(expected);
    });

    it('should format a role for Playwright in Python', () => {
      const selectorResult: SelectorResult = {
        selector: 'button|Login',
        type: 'role', 
        confidence: 95,
        reasoning: 'Uses ARIA role'
      };
      const expected = 'page.get_by_role("button", name="Login")';
      expect(formatter.format(selectorResult, 'playwright', 'python')).toBe(expected);
    });

    it('should format text for Cypress', () => {
      const selectorResult: SelectorResult = {
        selector: 'Submit Form',
        type: 'text',
        confidence: 80,
        reasoning: 'Uses text content'
      };
      const expected = "cy.contains('Submit Form')";
      expect(formatter.format(selectorResult, 'cypress', 'javascript')).toBe(expected);
    });

    it('should format CSS for Selenium in Java', () => {
      const selectorResult: SelectorResult = {
        selector: 'button.login-btn',
        type: 'css',
        confidence: 60,
        reasoning: 'Uses stable CSS'
      };
      const expected = 'driver.findElement(By.cssSelector("button.login-btn"))';
      expect(formatter.format(selectorResult, 'selenium', 'java')).toBe(expected);
    });

    // 🆕 NUEVO: Test para link-href strategy
    it('should format link-href for all frameworks', () => {
      const selectorResult: SelectorResult = {
        selector: 'github',
        type: 'link-href',
        confidence: 88,
        reasoning: 'Uses href keyword'
      };
      
      // Playwright
      expect(formatter.format(selectorResult, 'playwright', 'typescript'))
        .toBe("await page.locator('a[href*=\"github\"]')");
      
      // Cypress  
      expect(formatter.format(selectorResult, 'cypress', 'javascript'))
        .toBe("cy.get('a[href*=\"github\"]')");
        
      // Selenium Python
      expect(formatter.format(selectorResult, 'selenium', 'python'))
        .toBe('driver.find_element(By.CSS_SELECTOR, "a[href*=\\"github\\"]")');
    });
  });

  // ========== 🆕 NUEVOS TESTS PARA MOBILE ==========
  
  describe('Mobile Formatting', () => {
    it('should format iOS accessibility-id for Python', () => {
      const selectorResult: SelectorResult = {
        selector: 'login-button',
        type: 'accessibility-id',
        confidence: 95,
        reasoning: 'iOS accessibility identifier'
      };
      const expected = 'driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login-button")';
      expect(formatter.formatMobile(selectorResult, 'ios', 'python')).toBe(expected);
    });

    it('should format Android resource-id for Java', () => {
      const selectorResult: SelectorResult = {
        selector: 'com.app:id/login_btn',
        type: 'resource-id',
        confidence: 95,
        reasoning: 'Android resource ID'
      };
      const expected = 'driver.findElement(AppiumBy.id("com.app:id/login_btn"))';
      expect(formatter.formatMobile(selectorResult, 'android', 'java')).toBe(expected);
    });

    it('should format iOS Predicate String for C#', () => {
      const selectorResult: SelectorResult = {
        selector: "type == 'XCUIElementTypeButton' AND label == 'Login'",
        type: 'ios-predicate',
        confidence: 85,
        reasoning: 'iOS predicate string'
      };
      const expected = 'driver.FindElement(MobileBy.IosNsPredicate("type == \'XCUIElementTypeButton\' AND label == \'Login\'"))';
      expect(formatter.formatMobile(selectorResult, 'ios', 'csharp')).toBe(expected);
    });

    it('should format UiAutomator selector for Android TypeScript', () => {
      const selectorResult: SelectorResult = {
        selector: 'new UiSelector().text("Login").className("android.widget.Button")',
        type: 'uiautomator',
        confidence: 75,
        reasoning: 'UiAutomator selector'
      };
      const expected = 'await driver.findElement(\'android uiautomator\', \'new UiSelector().text("Login").className("android.widget.Button")\')';
      expect(formatter.formatMobile(selectorResult, 'android', 'typescript')).toBe(expected);
    });

    it('should format mobile text for all platforms', () => {
      const selectorResult: SelectorResult = {
        selector: 'Sign In',
        type: 'text',
        confidence: 80,
        reasoning: 'Mobile text content'
      };
      
      // iOS Python
      expect(formatter.formatMobile(selectorResult, 'ios', 'python'))
        .toBe('driver.find_element(AppiumBy.XPATH, "//*[@text=\'Sign In\']")');
      
      // Android Java
      expect(formatter.formatMobile(selectorResult, 'android', 'java'))
        .toBe('driver.findElement(AppiumBy.xpath("//*[@text=\'Sign In\']"))');
    });
  });

  // ========== 🆕 NUEVOS TESTS PARA CHARACTER ESCAPING ==========
  
  describe('Character Escaping', () => {
    it('should escape quotes in Python selectors', () => {
      const selectorResult: SelectorResult = {
        selector: 'button[title="User\'s Profile"]',
        type: 'css',
        confidence: 70,
        reasoning: 'Contains mixed quotes'
      };
      const expected = 'driver.find_element(By.CSS_SELECTOR, "button[title=\\"User\'s Profile\\"]")';
      expect(formatter.format(selectorResult, 'selenium', 'python')).toBe(expected);
    });

    it('should escape quotes in JavaScript selectors', () => {
      const selectorResult: SelectorResult = {
        selector: "John's Account",
        type: 'text',
        confidence: 85,
        reasoning: 'Text with apostrophe'
      };
      const expected = "await page.getByText('John\\'s Account')";
      expect(formatter.format(selectorResult, 'playwright', 'typescript')).toBe(expected);
    });

    it('should handle special characters in mobile selectors', () => {
      const selectorResult: SelectorResult = {
        selector: 'Welcome to "Best App"!',
        type: 'text',
        confidence: 80,
        reasoning: 'Text with quotes and symbols'
      };
      const expected = 'driver.find_element(AppiumBy.XPATH, "//*[@text=\'Welcome to \\"Best App\\"!\']")';
      expect(formatter.formatMobile(selectorResult, 'android', 'python')).toBe(expected);
    });
  });

  // ========== 🆕 NUEVO TEST PARA AI FORMAT CORRECTION ==========
  
  describe('AI Format Correction', () => {
    it('should correct malformed role format from AI', () => {
      const selectorResult: SelectorResult = {
        selector: "button[name='Submit Form']",  // ❌ AI formato incorrecto
        type: 'role',
        confidence: 95,
        reasoning: 'AI generated incorrect format'
      };
      
      // Debería detectar y corregir automáticamente
      const expected = "await page.getByRole('button', { name: 'Submit Form' })";
      expect(formatter.format(selectorResult, 'playwright', 'typescript')).toBe(expected);
    });

    it('should handle various malformed AI role formats', () => {
      const testCases = [
        { input: 'link[name="Home"]', expectedRole: 'link', expectedName: 'Home' },
        { input: "textbox[name='Email Address']", expectedRole: 'textbox', expectedName: 'Email Address' },
        { input: 'button[name="Save Changes"]', expectedRole: 'button', expectedName: 'Save Changes' }
      ];

      testCases.forEach(({ input, expectedRole, expectedName }) => {
        const selectorResult: SelectorResult = {
          selector: input,
          type: 'role',
          confidence: 90,
          reasoning: 'AI malformed format test'
        };
        
        const result = formatter.format(selectorResult, 'playwright', 'typescript');
        expect(result).toBe(`await page.getByRole('${expectedRole}', { name: '${expectedName}' })`);
      });
    });
  });

  // ========== 🆕 TESTS PARA DIFERENTES LENGUAJES ==========
  
  describe('Multi-Language Support', () => {
    const selectorResult: SelectorResult = {
      selector: 'login-btn',
      type: 'test-id',
      confidence: 100,
      reasoning: 'Test ID for language comparison'
    };

    it('should format for all supported languages in Playwright', () => {
      expect(formatter.format(selectorResult, 'playwright', 'javascript'))
        .toBe("await page.getByTestId('login-btn')");
      
      expect(formatter.format(selectorResult, 'playwright', 'typescript'))
        .toBe("await page.getByTestId('login-btn')");
        
      expect(formatter.format(selectorResult, 'playwright', 'python'))
        .toBe('page.get_by_test_id("login-btn")');
        
      expect(formatter.format(selectorResult, 'playwright', 'java'))
        .toBe('page.getByTestId("login-btn")');
        
      expect(formatter.format(selectorResult, 'playwright', 'csharp'))
        .toBe('Page.GetByTestId("login-btn")');
    });

    it('should format mobile selectors for all languages', () => {
      const mobileSelector: SelectorResult = {
        selector: 'submit-btn',
        type: 'accessibility-id',
        confidence: 95,
        reasoning: 'Mobile accessibility ID'
      };

      expect(formatter.formatMobile(mobileSelector, 'ios', 'python'))
        .toBe('driver.find_element(AppiumBy.ACCESSIBILITY_ID, "submit-btn")');
        
      expect(formatter.formatMobile(mobileSelector, 'ios', 'java'))
        .toBe('driver.findElement(AppiumBy.accessibilityId("submit-btn"))');
        
      expect(formatter.formatMobile(mobileSelector, 'ios', 'csharp'))
        .toBe('driver.FindElement(MobileBy.AccessibilityId("submit-btn"))');
    });
  });
});