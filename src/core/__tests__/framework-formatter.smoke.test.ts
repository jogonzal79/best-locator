// src/core/__tests__/framework-formatter.smoke.test.ts
import { FrameworkFormatter } from '../framework-formatter.js';

const ff = new FrameworkFormatter();

describe('FrameworkFormatter – smoke', () => {
  test('playwright role TS', () => {
    const out = ff.format({ type: 'role', selector: 'button|Login' } as any, 'playwright', 'typescript');
    expect(out).toContain("await page.getByRole('button'");
    expect(out).toContain("name: 'Login'");
  });

  test('cypress test-id', () => {
    // Cambiado de 'playwright' a 'cypress'
    const out = ff.format({ type: 'test-id', selector: 'login-btn' } as any, 'cypress', 'typescript');
    expect(out).toBe('cy.get(\'[data-testid="login-btn"]\')');
  });

  test('selenium css Java', () => {
    const out = ff.format({ type: 'css', selector: '.card .title' } as any, 'selenium', 'java');
    expect(out).toBe('driver.findElement(By.cssSelector(".card .title"))');
  });

  test('appium mobile android', () => {
    const out = ff.formatMobile({ type: 'test-id', selector: 'login' } as any, 'android', 'typescript');
    expect(out).toContain(`driver.findElement('accessibility id', 'login')`);
  });
  test('testcafe text', () => {
    const out = ff.format({ type: 'text', selector: 'Welcome', tagName: 'h1' } as any, 'testcafe', 'typescript');
    expect(out).toBe("Selector('h1').withText('Welcome')");
  });

  test('webdriverio css', () => {
    const out = ff.format({ type: 'css', selector: '.user-profile' } as any, 'webdriverio', 'typescript');
    expect(out).toBe("await browser.$('.user-profile')");
  });

});