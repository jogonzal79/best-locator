// src/core/ai/__tests__/AriaCalculator.test.ts

import { AriaCalculator } from '../aria-calculator.js';
import { ElementInfo } from '../../../types/index.js';

// Objeto base que cumple con todas las propiedades de ElementInfo
const baseElement: ElementInfo = {
  tagName: 'div',
  id: '',
  className: '',
  textContent: '',
  attributes: {},
};

describe('AriaCalculator', () => {
  let calculator: AriaCalculator;

  beforeEach(() => {
    calculator = new AriaCalculator();
  });

  // Pruebas para computeRole
  describe('computeRole', () => {
    it('should return an explicit role if provided', () => {
      const element: ElementInfo = {
        ...baseElement, // Usamos el objeto base
        tagName: 'div',
        attributes: { role: 'button' },
      };
      expect(calculator.computeRole(element)).toBe('button');
    });

    it('should return "link" for an <a> tag with href', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'a',
        attributes: { href: '#' },
      };
      expect(calculator.computeRole(element)).toBe('link');
    });

    it('should return null for an <a> tag without href', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'a',
        attributes: {},
      };
      expect(calculator.computeRole(element)).toBeNull();
    });
  });

  // Pruebas para computeAccessibleName
  describe('computeAccessibleName', () => {
    it('should prioritize aria-label', () => {
      const element: ElementInfo = {
        ...baseElement,
        textContent: 'Some Text',
        attributes: { 'aria-label': 'Click Me' },
      };
      expect(calculator.computeAccessibleName(element)).toBe('Click Me');
    });

    it('should fall back to textContent if no aria-label', () => {
      const element: ElementInfo = {
        ...baseElement,
        textContent: '  Button Text  ',
        attributes: {},
      };
      expect(calculator.computeAccessibleName(element)).toBe('Button Text');
    });
  });
});