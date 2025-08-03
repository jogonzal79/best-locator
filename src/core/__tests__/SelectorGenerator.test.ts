// src/core/__tests__/SelectorGenerator.test.ts

import { SelectorGenerator } from '../selector-generator.js';
import { ConfigManager } from '../config-manager.js';
import { ElementInfo } from '../../types/index.js';

// Objeto base para las pruebas
const baseElement: ElementInfo = {
  tagName: 'div',
  id: '',
  className: '',
  textContent: '',
  attributes: {},
};

describe('SelectorGenerator', () => {
  let generator: SelectorGenerator;

  beforeAll(async () => {
    // Usamos ConfigManager para obtener la configuración real que usa la app
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();
    generator = new SelectorGenerator(config);
  });

  it('should prioritize a project-specific attribute (data-testid)', () => {
    const element: ElementInfo = {
      ...baseElement,
      tagName: 'button',
      attributes: {
        'data-testid': 'login-button',
        'id': 'other-id'
      },
    };
    const result = generator.generateSelector(element);
    expect(result.type).toBe('test-id');
    expect(result.selector).toBe('login-button');
    expect(result.confidence).toBe(100);
  });

  it('should select ARIA role if no priority attribute is found', () => {
    const element: ElementInfo = {
      ...baseElement,
      tagName: 'button',
      attributes: {
        'role': 'navigation',
      },
      textContent: 'Go to Home'
    };
    const result = generator.generateSelector(element);
    expect(result.type).toBe('css'); // El tuyo lo genera como css
    expect(result.selector).toBe('button[role="navigation"]');
    expect(result.confidence).toBe(85);
  });

  it('should select text content as a fallback', () => {
    const element: ElementInfo = {
      ...baseElement,
      tagName: 'a',
      textContent: '  Click Here  ',
      attributes: {},
    };
    const result = generator.generateSelector(element);
    expect(result.type).toBe('text');
    expect(result.selector).toBe('Click Here');
    expect(result.confidence).toBe(70);
  });

  it('should fall back to the tag name if no other selector is viable', () => {
    const element: ElementInfo = {
      ...baseElement,
      tagName: 'section',
      attributes: {},
    };
    const result = generator.generateSelector(element);
    expect(result.type).toBe('css');
    expect(result.selector).toBe('section');
    expect(result.confidence).toBe(10);
  });
});