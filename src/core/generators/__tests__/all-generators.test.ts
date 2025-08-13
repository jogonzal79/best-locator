// src/core/generators/__tests__/all-generators.test.ts

import { GeneratorFactory } from '../factory.js';
import { ConfigManager } from '../../config-manager.js';
import { ElementInfo, BestLocatorConfig } from '../../../types/index.js';

describe('All Generators - Common Cases', () => {
  let config: BestLocatorConfig;
  
  beforeAll(async () => {
    // Activar los nuevos generadores para el test
    process.env.USE_NEW_GENERATORS = 'all';
    const configManager = new ConfigManager();
    config = await configManager.getConfig();
  });

  describe('ASP.NET style IDs', () => {
    const aspNetElement: ElementInfo = {
      tagName: 'input',
      id: 'cphW_txtUsuario',
      className: 'form-control',
      textContent: '',
      attributes: { 
        type: 'text', 
        name: 'ctl00$cphW$txtUsuario',
        id: 'cphW_txtUsuario'
      }
    };

    it('Selenium should use By.id()', () => {
      const generator = GeneratorFactory.create('selenium', config);
      const result = generator.generateSelector(aspNetElement);
      
      expect(result.type).toBe('id');
      expect(result.selector).toBe('cphW_txtUsuario');
      expect(result.confidence).toBeGreaterThanOrEqual(88);
    });

    it('Cypress should use CSS #id', () => {
      const generator = GeneratorFactory.create('cypress', config);
      const result = generator.generateSelector(aspNetElement);
      
      expect(result.type).toBe('css');
      expect(result.selector).toBe('#cphW_txtUsuario');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('TestCafe should use id selector', () => {
      const generator = GeneratorFactory.create('testcafe', config);
      const result = generator.generateSelector(aspNetElement);
      
      expect(['css', 'id']).toContain(result.type);
      if (result.type === 'css') {
        expect(result.selector).toContain('cphW_txtUsuario');
      } else {
        expect(result.selector).toBe('cphW_txtUsuario');
      }
    });

    it('WebdriverIO should use #id', () => {
      const generator = GeneratorFactory.create('webdriverio', config);
      const result = generator.generateSelector(aspNetElement);
      
      expect(result.type).toBe('css');
      expect(result.selector).toBe('#cphW_txtUsuario');
    });

    it('Playwright might use role or name', () => {
      const generator = GeneratorFactory.create('playwright', config);
      const result = generator.generateSelector(aspNetElement);
      
      // Playwright podría usar role, name, o id
      expect(['role', 'css', 'id']).toContain(result.type);
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Generic form-control class', () => {
    const genericElement: ElementInfo = {
      tagName: 'input',
      id: '',
      className: 'form-control',
      textContent: '',
      attributes: { 
        type: 'email',
        placeholder: 'Enter your email'
      }
    };

    it('Should NOT generate non-unique .form-control selector', () => {
      const frameworks = ['selenium', 'cypress', 'testcafe', 'webdriverio', 'playwright'];
      
      frameworks.forEach(framework => {
        const generator = GeneratorFactory.create(framework, config);
        const result = generator.generateSelector(genericElement);
        
        // No debería generar solo .form-control
        if (result.type === 'css' && result.selector === 'input.form-control') {
          // Si genera esto, la confidence debe ser baja
          expect(result.confidence).toBeLessThanOrEqual(50);
        } else {
          // Debería usar placeholder, type, o algo más específico
          const acceptableSelectors = [
            'placeholder', // Uses placeholder
            result.selector.includes('email'), // Uses type=email
            result.selector.includes('Enter your email') // Uses text/placeholder
          ];
          
          expect(acceptableSelectors.some(check => {
            if (typeof check === 'boolean') return check;
            return result.type === check;
          })).toBeTruthy();
        }
      });
    });
  });

  describe('Button with multiple identifying attributes', () => {
    const buttonElement: ElementInfo = {
      tagName: 'input',
      id: 'cphW_btnLogin',
      className: 'btn btn-primary',
      textContent: 'Iniciar Sesión',
      attributes: {
        type: 'submit',
        name: 'ctl00$cphW$btnLogin',
        value: 'Iniciar Sesión',
        id: 'cphW_btnLogin'
      }
    };

    it('Each framework should generate appropriate selector', () => {
      const expectations = {
        selenium: (result: any) => {
          expect(result.type).toBe('id');
          expect(result.selector).toBe('cphW_btnLogin');
        },
        cypress: (result: any) => {
          expect(result.type).toBe('css');
          expect(result.selector).toContain('cphW_btnLogin');
        },
        playwright: (result: any) => {
          // Playwright podría usar role button o el name
          expect(['role', 'css', 'text']).toContain(result.type);
        },
        testcafe: (result: any) => {
          expect(result.selector).toContain('cphW_btnLogin');
        },
        webdriverio: (result: any) => {
          expect(result.selector).toContain('cphW_btnLogin');
        }
      };

      Object.entries(expectations).forEach(([framework, expectation]) => {
        const generator = GeneratorFactory.create(framework, config);
        const result = generator.generateSelector(buttonElement);
        expectation(result);
      });
    });
  });

  describe('Password input field', () => {
    const passwordElement: ElementInfo = {
      tagName: 'input',
      id: 'cphW_txtPassword',
      className: 'form-control',
      textContent: '',
      attributes: {
        type: 'password',
        name: 'ctl00$cphW$txtPassword',
        placeholder: 'Contraseña',
        id: 'cphW_txtPassword'
      }
    };

    it('Should prioritize ID over generic class', () => {
      const frameworks = ['selenium', 'cypress', 'testcafe', 'webdriverio'];
      
      frameworks.forEach(framework => {
        const generator = GeneratorFactory.create(framework, config);
        const result = generator.generateSelector(passwordElement);
        
        // Debe contener el ID, no solo form-control
        expect(result.selector).toContain('cphW_txtPassword');
        expect(result.confidence).toBeGreaterThanOrEqual(75);
      });
    });

    it('Playwright might use placeholder or type=password', () => {
      const generator = GeneratorFactory.create('playwright', config);
      const result = generator.generateSelector(passwordElement);
      
      const validSelectors = [
        result.selector.includes('Contraseña'),
        result.selector.includes('password'),
        result.selector.includes('cphW_txtPassword')
      ];
      
      expect(validSelectors.some(v => v)).toBeTruthy();
    });
  });
});