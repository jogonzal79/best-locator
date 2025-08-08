// src/core/__tests__/SelectorGeneratorAdvanced.test.ts - V13 LIMPIA

import { SelectorGenerator } from '../selector-generator.js';
import { ConfigManager } from '../config-manager.js';
import { ElementInfo } from '../../types/index.js';

const baseElement: ElementInfo = {
  tagName: 'div',
  id: '',
  className: '',
  textContent: '',
  attributes: {},
};

describe('SelectorGenerator - Advanced Strategies', () => {
  let generator: SelectorGenerator;

  beforeAll(async () => {
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();
    generator = new SelectorGenerator(config);
  });

  // ========== 🔗 HREF KEYWORDS DETECTION ==========
  
  describe('Link Href Keywords Detection', () => {
    const linkKeywords = ['discord', 'github', 'linkedin', 'twitter', 'facebook', 'youtube', 'instagram'];
    
    linkKeywords.forEach(keyword => {
      it(`should detect ${keyword} in href and use link-href strategy`, () => {
        const element: ElementInfo = {
          ...baseElement,
          tagName: 'a',
          attributes: {
            href: `https://${keyword}.com/company/page`
          }
        };
        
        const result = generator.generateSelector(element);
        expect(result.type).toBe('link-href');
        expect(result.selector).toBe(keyword);
        expect(result.confidence).toBe(88);
        expect(result.reasoning).toContain(`href containing '${keyword}'`);
      });
    });

    it('should handle mixed case and subdomains in href', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'a',
        attributes: {
          href: 'https://api.GitHub.com/repos/user/project'
        }
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).toBe('link-href');
      expect(result.selector).toBe('github');
      expect(result.confidence).toBe(88);
    });

    it('should not detect href keywords in non-link elements', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'div',
        attributes: {
          href: 'https://github.com/user/repo'
        }
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).not.toBe('link-href');
    });

    it('should fall back to other strategies if no keywords found in href', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'a',
        attributes: {
          href: 'https://unknown-site.com/page'
        },
        textContent: 'Visit Site'
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).toBe('role');
      expect(result.selector).toBe('link|Visit Site');
    });
  });

  // ========== 🎨 CSS STABLE VS UTILITY CLASSES ==========
  
  describe('CSS Class Filtering', () => {
    it('should prefer semantic classes over Tailwind utility classes', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'button',
        className: 'login-button bg-blue-500 p-4 m-2 hover:bg-blue-600 focus:ring-2',
        attributes: {}
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).toBe('css');
      expect(result.selector).toBe('button.login-button');
      expect(result.confidence).toBe(60);
      expect(result.reasoning).toContain('stable CSS class');
    });

    it('should filter out all utility classes and choose best semantic class', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'nav',
        className: 'main-navigation header-nav bg-white shadow-lg flex justify-between p-6 border-b',
        attributes: {}
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).toBe('css');
      expect(result.selector).toBe('nav.main-navigation');
      expect(result.confidence).toBe(60);
    });

    it('should fall back to tag if only utility classes exist', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'div',
        className: 'bg-red-500 p-4 m-2 text-white hover:bg-red-600 transition-colors',
        attributes: {}
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).toBe('css');
      expect(result.selector).toBe('div');
      expect(result.confidence).toBe(20);
    });

    it('should prioritize semantic classes by purpose indicators', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'button',
        className: 'btn primary-button success-btn large-size bg-green-500',
        attributes: {}
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).toBe('css');
      expect(result.selector).toBe('button.primary-button');
      expect(result.confidence).toBe(60);
    });
  });

  // ========== 📝 TEXT CONTENT STRATEGIES ==========
  
  describe('Text Content Analysis', () => {
    it('should detect meaningful descriptive text', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'span',
        textContent: 'Create New Account',
        attributes: {}
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).toBe('text');
      expect(result.selector).toBe('Create New Account');
      expect(result.confidence).toBe(80);
      expect(result.reasoning).toContain('specific text content');
    });

    it('should detect generic text and reduce confidence', () => {
      const genericTexts = ['click', 'submit', 'cancel', 'ok', 'yes', 'no', 'close', 'save'];
      
      genericTexts.forEach(text => {
        const element: ElementInfo = {
          ...baseElement,
          tagName: 'span',
          textContent: text,
          attributes: {}
        };
        
        const result = generator.generateSelector(element);
        expect(result.type).toBe('css');
        expect(result.selector).toBe('span');
        expect(result.confidence).toBe(20);
      });
    });

    it('should handle text with extra whitespace', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'p',
        textContent: '   Welcome to Dashboard   \n\t',
        attributes: {}
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).toBe('text');
      expect(result.selector).toBe('Welcome to Dashboard');
      expect(result.confidence).toBe(80);
    });

    it('should reject very long text content', () => {
      const longText = 'This is a very long text content that exceeds the maximum allowed length for text selectors';
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'p',
        textContent: longText,
        attributes: {}
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).not.toBe('text');
      expect(result.type).toBe('css');
      expect(result.selector).toBe('p');
    });
  });

  // ========== 🆔 ID STABILITY DETECTION ==========
  
  describe('ID Stability Analysis', () => {
    it('should accept stable semantic IDs', () => {
      const stableIds = ['login-form', 'main-navigation', 'user-profile', 'search-results'];
      
      stableIds.forEach(id => {
        const element: ElementInfo = {
          ...baseElement,
          tagName: 'div',
          id: id,
          attributes: {}
        };
        
        const result = generator.generateSelector(element);
        expect(result.type).toBe('id');
        expect(result.selector).toBe(id);
        expect(result.confidence).toBe(78);
        expect(result.reasoning).toContain('stable ID');
      });
    });

    it('should reject auto-generated IDs', () => {
      const unstableIds = [
        '12345',
        'react-id-123',
        'mui-456',
        'auto-generated-789',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      ];
      
      unstableIds.forEach(id => {
        const element: ElementInfo = {
          ...baseElement,
          tagName: 'div',
          id: id,
          attributes: {}
        };
        
        const result = generator.generateSelector(element);
        expect(result.type).not.toBe('id');
      });
    });

    it('should reject very short IDs', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'div',
        id: 'a',
        attributes: {}
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).not.toBe('id');
    });
  });

  // ========== 🤖 ARIA ROLE ENHANCED DETECTION ==========
  
  describe('ARIA Role Enhanced Detection', () => {
    it('should combine role with accessible name when available', () => {
      const element: ElementInfo = {
        ...baseElement,
        tagName: 'button',
        textContent: 'Save Changes',
        computedRole: 'button',
        accessibleName: 'Save Changes'
      };
      
      const result = generator.generateSelector(element);
      expect(result.type).toBe('role');
      expect(result.selector).toBe('button|Save Changes');
      expect(result.confidence).toBe(95);
      expect(result.reasoning).toContain('ARIA role');
      expect(result.reasoning).toContain('accessible name');
    });
  });

  // ========== 🔄 FALLBACK INTELLIGENCE ==========
  
  describe('Intelligent Fallbacks', () => {
    it('should provide appropriate fallbacks for different element types', () => {
      const fallbackTests = [
        { tag: 'button', expectedSelector: 'button', confidence: 40 },
        { tag: 'a', expectedSelector: 'a', confidence: 35 },
        { tag: 'section', expectedSelector: 'section', confidence: 20 }
      ];
      
      fallbackTests.forEach(({ tag, expectedSelector, confidence }) => {
        const element: ElementInfo = {
          ...baseElement,
          tagName: tag,
          attributes: {}
        };
        
        const result = generator.generateSelector(element);
        expect(result.type).toBe('css');
        expect(result.selector).toBe(expectedSelector);
        expect(result.confidence).toBe(confidence);
        expect(result.reasoning).toContain('Fallback');
      });
    });
  });
});