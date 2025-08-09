// src/core/formatters/frameworks/appium-formatter.ts
import { IMobileFormatter, Language, MobileFramework } from '../types.js';
import type { SelectorResult } from '../../../types/index.js';

const qS = (s: string) => `'${String(s).replace(/'/g, `\\'`)}'`;
const qD = (s: string) => `"${String(s).replace(/"/g, `\\"`)}"`;

export class AppiumFormatter implements IMobileFormatter {
  formatMobile(selector: SelectorResult, platform: MobileFramework, language: Language): string {
    const isPython = language === 'python';
    const isJava = language === 'java';
    const isCSharp = language === 'csharp';
    const isTypeScript = language === 'typescript' || language === 'javascript';
    
    // Helper para manejar test-id que debe mapear a accessibility-id en mobile
    const actualType = selector.type === 'test-id' ? 'accessibility-id' : selector.type;
    
    switch (actualType as any) {
      case 'accessibility-id':
        if (isPython) {
          return `driver.find_element(AppiumBy.ACCESSIBILITY_ID, ${qD(selector.selector)})`;
        } else if (isJava) {
          return `driver.findElement(AppiumBy.accessibilityId(${qD(selector.selector)}))`;
        } else if (isCSharp) {
          return `driver.FindElement(MobileBy.AccessibilityId(${qD(selector.selector)}))`;
        } else if (isTypeScript) {
          return `driver.findElement('accessibility id', ${qS(selector.selector)})`;
        }
        return `driver.findElement(MobileBy.AccessibilityId(${qD(selector.selector)}))`;

      case 'resource-id':
        if (isPython) {
          return `driver.find_element(AppiumBy.ID, ${qD(selector.selector)})`;
        } else if (isJava) {
          return `driver.findElement(AppiumBy.id(${qD(selector.selector)}))`;
        } else if (isCSharp) {
          return `driver.FindElement(MobileBy.Id(${qD(selector.selector)}))`;
        } else if (isTypeScript) {
          return `driver.findElement('id', ${qS(selector.selector)})`;
        }
        return `driver.findElement(MobileBy.id(${qD(selector.selector)}))`;

      case 'ios-predicate':
        if (isPython) {
          return `driver.find_element(AppiumBy.IOS_PREDICATE, ${qD(selector.selector)})`;
        } else if (isJava) {
          return `driver.findElement(AppiumBy.iOSNsPredicateString(${qD(selector.selector)}))`;
        } else if (isCSharp) {
          return `driver.FindElement(MobileBy.IosNsPredicate(${qD(selector.selector)}))`;
        } else if (isTypeScript) {
          return `driver.findElement('ios predicate string', ${qS(selector.selector)})`;
        }
        return `driver.findElement(MobileBy.iOSNsPredicateString(${qD(selector.selector)}))`;

      case 'uiautomator':
        if (isPython) {
          return `driver.find_element(AppiumBy.ANDROID_UIAUTOMATOR, ${qD(selector.selector)})`;
        } else if (isJava) {
          return `driver.findElement(AppiumBy.androidUIAutomator(${qD(selector.selector)}))`;
        } else if (isCSharp) {
          return `driver.FindElement(MobileBy.AndroidUIAutomator(${qD(selector.selector)}))`;
        } else if (isTypeScript) {
          return `await driver.findElement('android uiautomator', ${qS(selector.selector)})`;
        }
        return `driver.findElement(MobileBy.AndroidUIAutomator(${qD(selector.selector)}))`;

      case 'text':
        const xpathSelector = `//*[@text=${qS(selector.selector)}]`;
        if (isPython) {
          return `driver.find_element(AppiumBy.XPATH, ${qD(xpathSelector)})`;
        } else if (isJava) {
          return `driver.findElement(AppiumBy.xpath(${qD(xpathSelector)}))`;
        } else if (isCSharp) {
          return `driver.FindElement(MobileBy.XPath(${qD(xpathSelector)}))`;
        } else if (isTypeScript) {
          return `driver.findElement('xpath', ${qS(xpathSelector)})`;
        }
        return `driver.find_element(AppiumBy.XPATH, ${qD(xpathSelector)})`;

      default:
        // Fallback genérico
        const fallbackXpath = `//*[contains(., ${qD(selector.selector)})]`;
        if (isPython) {
          return `driver.find_element(AppiumBy.XPATH, ${qD(fallbackXpath)})`;
        } else if (isJava) {
          return `driver.findElement(AppiumBy.xpath(${qD(fallbackXpath)}))`;
        } else if (isCSharp) {
          return `driver.FindElement(MobileBy.XPath(${qD(fallbackXpath)}))`;
        } else if (isTypeScript) {
          return `driver.findElement('xpath', ${qS(fallbackXpath)})`;
        }
        return `driver.find_element(AppiumBy.XPATH, ${qD(fallbackXpath)})`;
    }
  }
}