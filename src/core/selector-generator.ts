// src/core/selector-generator.ts - VERSIÓN MEJORADA CON NUEVAS ESTRATEGIAS

import { AIEngine } from './ai-engine.js';
import { BestLocatorConfig, SelectorResult, ElementInfo, PageContext } from '../types/index.js';
import { AriaCalculator } from './ai/aria-calculator.js';
import { logger } from '../app/logger.js';
// +++ INICIO DE CAMBIOS +++
import { ISelectorGenerator, AnyElementInfo } from './processing/types.js';

export class SelectorGenerator implements ISelectorGenerator { // <- AÑADIDO
// --- FIN DE CAMBIOS ---
  private aiEngine?: AIEngine;
  private config: BestLocatorConfig;
  private ariaCalculator: AriaCalculator; // 🆕 NUEVO

  constructor(config: BestLocatorConfig) {
    this.config = config;
    this.ariaCalculator = new AriaCalculator(); // 🆕 NUEVO
    if (config?.ai?.enabled) {
      this.aiEngine = new AIEngine(config);
    }
  }

  public async generateSelectorWithAI(elementInfo: ElementInfo, context: PageContext): Promise<SelectorResult> {
    const priorityResult = this.getPrioritySelector(elementInfo);
    if (priorityResult) {
      return priorityResult;
    }
    
    if (this.aiEngine && await this.aiEngine.isAvailable()) {
      try {
        return await this.aiEngine.generateSelector(elementInfo, context);
      } catch (error) {
         logger.warning('⚠️ AI generation failed, falling back to traditional method.');
      }
    }
    return this.generateSelector(elementInfo);
  }

  // +++ INICIO DE CAMBIOS +++
  public generateSelector(elementInfo: AnyElementInfo): SelectorResult { // <- TIPO MODIFICADO
  // --- FIN DE CAMBIOS ---
    // 🛡️ SANITIZAR DATOS DE ENTRADA (mantenemos la lógica existente)
    const sanitizedElement = this.sanitizeElementInfo(elementInfo as ElementInfo);
    
    // 🆕 MEJORAR CON INFORMACIÓN ARIA
    const enhancedElement = this.enhanceWithAria(sanitizedElement);
    
    // 🆕 NUEVA LÓGICA DE SELECCIÓN MEJORADA
    return this.selectBestSelectorStrategy(enhancedElement);
  }

  // 🆕 NUEVO MÉTODO: Enriquecer elemento con información ARIA
  private enhanceWithAria(element: ElementInfo): ElementInfo {
    return {
      ...element,
      computedRole: element.computedRole || this.ariaCalculator.computeRole(element),
      accessibleName: element.accessibleName || this.ariaCalculator.computeAccessibleName(element)
    };
  }

  // 🆕 NUEVO MÉTODO: Lógica de selección mejorada
  private selectBestSelectorStrategy(element: ElementInfo): SelectorResult {
    const { attributes, tagName, textContent, id, className } = element;

    // ESTRATEGIA 1: Mantener prioridad de test IDs (sin cambios)
    const priorityResult = this.getPrioritySelector(element);
    if (priorityResult) {
      return priorityResult;
    }

    // ESTRATEGIA 2: 🆕 ARIA Role + Accessible Name (NUEVA PRIORIDAD ALTA)
    const roleResult = this.tryAriaRoleStrategy(element);
    if (roleResult && roleResult.confidence >= 85) {
      return roleResult;
    }

    // ESTRATEGIA 3: 🆕 Atributos semánticos específicos (MEJORADO)
    if (attributes['aria-label'] && attributes['aria-label'].trim()) {
      return this.result(`${tagName}[aria-label="${attributes['aria-label']}"]`, 90, 'css', `Uses explicit aria-label.`);
    }

    // ESTRATEGIA 4: 🆕 Atributos semánticos para forms (MEJORADO)
    if (['input', 'select', 'textarea'].includes(tagName)) {
      // name attribute tiene prioridad para elementos de formulario
      if (attributes['name'] && attributes['name'].trim()) {
        return this.result(`${tagName}[name="${attributes['name']}"]`, 88, 'css', `Uses form element name attribute.`);
      }
      
      // type específicos para inputs
      if (tagName === 'input' && attributes['type']) {
        const specificTypes = ['email', 'password', 'search', 'tel', 'url', 'number', 'date'];
        if (specificTypes.includes(attributes['type'])) {
          return this.result(`input[type="${attributes['type']}"]`, 85, 'css', `Uses specific input type '${attributes['type']}'.`);
        }
      }
    }

    // ESTRATEGIA 5: Mantener lógica existente para role genérico
    if (attributes['role']) {
      return this.result(`${tagName}[role="${attributes['role']}"]`, 85, 'css', `Uses ARIA role.`);
    }

    // ESTRATEGIA 6: 🆕 Texto con filtrado mejorado (MEJORADO + CAMBIO CLAVE)
    const textResult = this.tryImprovedTextStrategy(element);
    if (textResult && textResult.confidence >= 70) {
      return textResult;
    }

    // ESTRATEGIA 7: 🆕 Placeholder mejorado
    if (attributes['placeholder'] && attributes['placeholder'].trim() && attributes['placeholder'].length < 50) {
      return this.result(attributes['placeholder'].trim(), 75, 'placeholder', `Uses placeholder text.`);
    }

    // ESTRATEGIA 8: 🆕 ID estable (MEJORADO)
    const stableIdResult = this.tryStableIdStrategy(element);
    if (stableIdResult) {
      return stableIdResult;
    }

    // ESTRATEGIA 9: 🆕 Links por href keywords (NUEVO)
    const linkResult = this.tryLinkHrefStrategy(element);
    if (linkResult) {
      return linkResult;
    }

    // ESTRATEGIA 10: 🆕 CSS estable (MUY MEJORADO)
    const stableCssResult = this.tryStableCssStrategy(element);
    if (stableCssResult) {
      return stableCssResult;
    }

    // ESTRATEGIA 11: Fallback inteligente (mantener existente + mejoras)
    return this.tryIntelligentFallback(element);
  }

  // 🆕 NUEVO: Estrategia ARIA Role mejorada
  private tryAriaRoleStrategy(element: ElementInfo): SelectorResult | null {
    const role = element.computedRole;
    const name = element.accessibleName;
    
    if (!role) return null;

    // Roles específicos con alta confianza
    const highValueRoles = ['button', 'link', 'textbox', 'combobox', 'checkbox', 'radio', 'tab', 'menuitem'];
    
    if (highValueRoles.includes(role)) {
      if (name && name.trim() && name.length > 0 && name.length < 50) {
        // Role + Name combination (formato para FrameworkFormatter)
        return this.result(`${role}|${name.trim()}`, 95, 'role', 
          `Uses ARIA role '${role}' with accessible name.`);
      //} else if (role === 'button' || role === 'link') {
        // Solo role para elementos interactivos importantes
        //return this.result(role, 85, 'role', `Uses ARIA role '${role}'.`);
      }
    }

    return null;
  }

  // 🆕 MEJORADO: Estrategia de texto mejorada CON TAGNAME
  private tryImprovedTextStrategy(element: ElementInfo): SelectorResult | null {
    const cleanText = element.textContent?.trim();
    if (!cleanText || cleanText.length === 0) return null;

    // Filtrar textos muy largos
    if (cleanText.length > 50) return null;
    
    // Detectar textos genéricos y reducir confianza
    const genericTexts = ['click', 'submit', 'cancel', 'ok', 'yes', 'no', 'close', 'open', 'save', 'delete', 'edit'];
    const isGeneric = genericTexts.some(generic => 
      cleanText.toLowerCase() === generic || cleanText.toLowerCase().includes(generic)
    );

    if (isGeneric) {
      // --- CAMBIO CLAVE: Incluir tagName para textos genéricos ---
      return this.result(cleanText, 65, 'text', 'Uses text content (generic).', element.tagName);
    }

    // Texto específico y descriptivo
    if (cleanText.length >= 3) {
      // --- CAMBIO CLAVE: Incluir tagName para textos específicos ---
      return this.result(cleanText, 80, 'text', 'Uses specific text content.', element.tagName);
    }

    return null;
  }

  // 🆕 NUEVO: Estrategia de ID estable
  private tryStableIdStrategy(element: ElementInfo): SelectorResult | null {
    const id = element.id;
    if (!id || !id.trim()) return null;

    // Filtrar IDs inestables
    const unstablePatterns = [
      /^\d+$/, // Solo números
      /^[a-f0-9-]{36}$/, // UUIDs
      /^[a-f0-9]{8,}$/, // Hash largo
      /react-|mui-|auto-|generated-/, // Generados por frameworks
    ];

    if (unstablePatterns.some(pattern => pattern.test(id))) {
      return null; // ID parece generado automáticamente
    }

    if (id.length >= 3) {
      return this.result(id, 78, 'id', `Uses stable ID attribute.`);
    }

    return null;
  }

  // 🆕 NUEVO: Estrategia para links con keywords
  private tryLinkHrefStrategy(element: ElementInfo): SelectorResult | null {
    if (element.tagName !== 'a') return null;
    
    const href = element.attributes['href'];
    if (!href) return null;

    // Keywords significativos en href
    const keywords = ['discord', 'github', 'linkedin', 'twitter', 'facebook', 'youtube', 'instagram', 'telegram', 'reddit', 'medium', 'login', 'signup', 'register', 'dashboard', 'profile', 'settings', 'logout', 'help', 'contact', 'about'];
    
    for (const keyword of keywords) {
      if (href.toLowerCase().includes(keyword)) {
        return this.result(keyword, 88, 'link-href', 
          `Uses link href containing '${keyword}'.`);
      }
    }

    return null;
  }

  // 🆕 NUEVO: Estrategia CSS estable muy mejorada
  private tryStableCssStrategy(element: ElementInfo): SelectorResult | null {
    const { className, tagName } = element;
    
    if (!className || typeof className !== 'string') return null;

    const classes = className.split(' ').filter(c => c.trim());
    
    // 🚫 FILTRAR CLASES INESTABLES
    const stableClasses = classes.filter(cls => {
      // Excluir clases de Tailwind CSS utilities
      const tailwindPatterns = [
        /^(bg-|text-|p-|px-|py-|pt-|pb-|pl-|pr-|m-|mx-|my-|mt-|mb-|ml-|mr-)/, // Spacing & colors
        /^(w-|h-|min-w|min-h|max-w|max-h)/, // Sizing
        /^(flex|grid|block|inline|hidden|visible)$/, // Display
        /^(absolute|relative|fixed|static|sticky)$/, // Position
        /^(top-|bottom-|left-|right-|inset-)/, // Position values
        /^(z-)/, // Z-index
        /^(border-|rounded-|shadow-)/, // Borders & shadows
        /^(hover:|focus:|active:|disabled:)/, // States
        /^(transition-|duration-|ease-)/, // Transitions
      ];
      
      if (tailwindPatterns.some(pattern => pattern.test(cls))) {
        return false;
      }
      
      // Excluir clases de estado genéricas
      if (/^(active|inactive|disabled|hidden|visible|selected|current)$/i.test(cls)) {
        return false;
      }
      
      // Excluir clases muy cortas o con patrones problemáticos
      if (cls.length <= 2 || /^(__|--|\d+$)/i.test(cls)) {
        return false;
      }
      
      return true;
    });

    if (stableClasses.length > 0) {
      // Preferir clases semánticas (más largas y descriptivas)
      const bestClass = stableClasses.sort((a, b) => {
        // Priorizar clases que indican propósito
        const semanticBonus = (cls: string) => {
          if (/button|btn|link|input|form|nav|menu|header|footer|content|main/i.test(cls)) return 10;
          if (/primary|secondary|success|warning|error|info/i.test(cls)) return 5;
          return 0;
        };
        
        return (b.length + semanticBonus(b)) - (a.length + semanticBonus(a));
      })[0];
      
      // Combinar con tagName para mayor especificidad
      const selector = `${tagName}.${bestClass}`;
      return this.result(selector, 60, 'css', 
        `Uses stable CSS class '${bestClass}'.`);
    }

    return null;
  }

  // 🆕 NUEVO: Fallback inteligente mejorado
  private tryIntelligentFallback(element: ElementInfo): SelectorResult {
    const { tagName, attributes } = element;
    
    // Para botones sin mejor opción
    if (tagName === 'button') {
      return this.result('button', 40, 'css', 'Fallback: button tag.');
    }
    
    // Para inputs por tipo
    if (tagName === 'input' && attributes['type']) {
      return this.result(`input[type="${attributes['type']}"]`, 45, 'css', 
        `Fallback: input by type.`);
    }

    // Para enlaces
    if (tagName === 'a') {
      return this.result('a', 35, 'css', 'Fallback: link tag.');
    }

    // Último recurso
    return this.result(tagName, 20, 'css', 'Fallback: tag name only.');
  }

  // MÉTODO MODIFICADO: Ahora acepta tagName opcional
  private result(selector: string, confidence: number, type: string, reasoning: string, tagName?: string): SelectorResult {
    const result: SelectorResult = { selector, confidence, type, reasoning };
    
    // --- CAMBIO CLAVE: Añadir tagName si se proporciona ---
    if (tagName) {
      (result as any).tagName = tagName;
    }
    
    return result;
  }

  private getPrioritySelector(elementInfo: ElementInfo): SelectorResult | null {
    for (const attr of this.config.projectAttributes) {
      if (elementInfo.attributes[attr]) {
        return this.result(elementInfo.attributes[attr], 100, 'test-id', `Selected attribute '${attr}'.`);
      }
    }
    return null;
  }

  /**
   * 🛡️ SANITIZAR ElementInfo para elementos restaurados desde sessionStorage
   */
  private sanitizeElementInfo(elementInfo: ElementInfo): ElementInfo {
    return {
      tagName: String(elementInfo.tagName || 'div').toLowerCase(),
      id: String(elementInfo.id || ''),
      className: typeof elementInfo.className === 'string' ? elementInfo.className : '',
      textContent: String(elementInfo.textContent || ''),
      attributes: elementInfo.attributes && typeof elementInfo.attributes === 'object' ? elementInfo.attributes : {},
      order: elementInfo.order,
      computedRole: elementInfo.computedRole,
      accessibleName: elementInfo.accessibleName,
    };
  }
}