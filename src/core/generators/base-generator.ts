// src/core/generators/base-generator.ts
import { BestLocatorConfig, ElementInfo, SelectorResult } from '../../types/index.js';
import { ISelectorGenerator, AnyElementInfo } from '../processing/types.js';
import { AriaCalculator } from '../ai/aria-calculator.js';
import { AIEngine } from '../ai-engine.js';

export abstract class BaseWebGenerator implements ISelectorGenerator {
  protected ariaCalculator: AriaCalculator;
  protected aiEngine?: AIEngine;

  constructor(protected config: BestLocatorConfig) {
    this.ariaCalculator = new AriaCalculator();
    if (this.config?.ai?.enabled) {
      this.aiEngine = new AIEngine(this.config);
    }
  }

  // Métodos abstractos que cada framework debe implementar
  abstract getPriorityOrder(): string[];
  abstract getMinConfidenceThreshold(): number;
  abstract optimizeForFramework(result: SelectorResult): SelectorResult;

  // Método principal "tradicional" (sin IA) con pipeline saneado+ARIA
  public generateSelector(elementInfo: AnyElementInfo): SelectorResult {
    const element = this.enhanceWithAria(this.sanitizeElementInfo(elementInfo as ElementInfo));

    for (const strategy of this.getPriorityOrder()) {
      const result = this.executeStrategy(strategy, element);
      if (result && result.confidence >= this.getMinConfidenceThreshold()) {
        return this.optimizeForFramework(result);
      }
    }
    return this.tryFallbackStrategy(element);
  }

  // Método principal con IA (mantiene compatibilidad con --ai / --explain)
  public async generateSelectorWithAI(
    elementInfo: AnyElementInfo,
    context: { url?: string; title?: string } // PageContext simplificado para no romper imports
  ): Promise<SelectorResult> {
    const element = this.enhanceWithAria(this.sanitizeElementInfo(elementInfo as ElementInfo));

    // 1) Intento rápido con señales prioritarias absolutas
    const priorityResult = this.tryPriorityAttributes(element);
    if (priorityResult && priorityResult.confidence >= 100) {
      return this.optimizeForFramework(priorityResult);
    }

    // 2) IA si está disponible
    if (this.aiEngine && (await this.aiEngine.isAvailable())) {
      try {
        const aiRaw = await this.aiEngine.generateSelector(element, context as any);
        const aiNormalized = this.normalizeAIResult(element, aiRaw);
        return this.optimizeForFramework(aiNormalized);
      } catch (err) {
        console.warn('⚠️ AI generation failed, falling back to traditional method.', err);
      }
    }

    // 3) Fallback al método tradicional
    return this.optimizeForFramework(this.generateSelector(element));
  }

  // Dispatcher de estrategias
  protected executeStrategy(strategy: string, element: ElementInfo): SelectorResult | null {
    switch (strategy) {
      case 'test-id': return this.tryPriorityAttributes(element);
      case 'aria-role': return this.tryAriaRoleStrategy(element);
      case 'semantic-attrs': return this.trySemanticAttributesStrategy(element);
      case 'form-attrs': return this.tryFormAttributesStrategy(element);
      case 'text': return this.tryTextStrategy(element);
      case 'placeholder': return this.tryPlaceholderStrategy(element);
      case 'stable-id': return this.tryStableIdStrategy(element);
      case 'link-href': return this.tryLinkHrefStrategy(element);
      case 'stable-css': return this.tryStableCssStrategy(element);
      default: return null;
    }
  }

  // ========== Normalización IA (Ajuste PRO: preferir accessibleName) ==========
  /**
   * Normaliza la salida de IA para:
   * - Priorizar el accessibleName cuando la IA confunde "name" de ASP.NET con el nombre accesible.
   * - Corregir el caso 'text' cuando coincide con attributes.name o contiene '$'.
   */
  protected normalizeAIResult(element: ElementInfo, ai: SelectorResult): SelectorResult {
    if (!ai || !ai.selector) return ai;

    const sel = String(ai.selector).trim();

    // Helper local: preferir accessibleName en role|name/candidatos
    function preferAccName(
      role: string,
      candidate: string,
      el: ElementInfo,
      base: SelectorResult,
      note: string
    ): SelectorResult {
      const acc = el.accessibleName?.trim();
      const isAspNetName = !!candidate && candidate.includes('$');
      const equalsDomName = !!candidate && el.attributes?.name === candidate;

      if (acc && (isAspNetName || equalsDomName) && acc !== candidate) {
        return {
          selector: `${role}|${acc}`,
          confidence: Math.max(base.confidence ?? 90, 90),
          type: 'role',
          aiEnhanced: true,
          reasoning: (base.reasoning ? base.reasoning + ' ' : '') + note,
        };
      }
      return {
        selector: `${role}|${candidate}`,
        confidence: Math.max(base.confidence ?? 90, 90),
        type: 'role',
        aiEnhanced: true,
        reasoning: base.reasoning,
      };
    }

    // 1) role|name (estándar nuestro)
    const roleName1 = sel.match(/^(\w+)\|(.+)$/);
    if (ai.type === 'role' && roleName1) {
      return preferAccName(roleName1[1], roleName1[2].trim(), element, ai, '(normalized to accessibleName)');
    }

    // 2) role[name="..."] (variante común de la IA)
    const roleName2 = sel.match(/^(\w+)\[name=['"]([^'"]+)['"]\]$/);
    if (ai.type === 'role' && roleName2) {
      return preferAccName(roleName2[1], roleName2[2].trim(), element, ai, '(normalized to accessibleName)');
    }

    // 3) [role="button"][aria-label="..."] o button[aria-label="..."] (convertimos a role|name y normalizamos)
    const roleAria1 = sel.match(/^\[role=['"]([^'"]+)['"]\]\[aria-label=['"]([^'"]+)['"]\]$/);
    if (ai.type === 'role' && roleAria1) {
      return preferAccName(roleAria1[1], roleAria1[2].trim(), element, ai, '(normalized to accessibleName)');
    }
    const roleAria2 = sel.match(/^(\w+)\[aria-label=['"]([^'"]+)['"]\]$/);
    if (ai.type === 'role' && roleAria2) {
      return preferAccName(roleAria2[1], roleAria2[2].trim(), element, ai, '(normalized to accessibleName)');
    }

    // 4) Malformados tipo: [role="button[name='Iniciar Sesión']"] => extraemos role y name si es posible
    const malformed = sel.match(/^\[role=['"](\w+)\[name=['"]([^'"]+)['"]\]['"]\]$/);
    if (ai.type === 'role' && malformed) {
      return preferAccName(malformed[1], malformed[2].trim(), element, ai, '(normalized malformed to accessibleName)');
    }

    // 5) Si la IA devolvió un 'text' igual al attributes.name o que contiene '$', usar accessibleName si lo hay
    if (ai.type === 'text') {
      const acc = element.accessibleName?.trim();
      if (
        acc &&
        (sel === element.attributes?.name || sel.includes('$'))
      ) {
        return { ...ai, selector: acc, aiEnhanced: true };
      }
    }

    // 6) Si la IA dijo 'role' pero no matcheó nada, y tenemos accessibleName+role calculados, proponemos role|accessibleName
    if (ai.type === 'role' && element.computedRole && element.accessibleName) {
      return {
        selector: `${element.computedRole}|${element.accessibleName.trim()}`,
        confidence: Math.max(ai.confidence ?? 85, 85),
        type: 'role',
        aiEnhanced: true,
        reasoning: (ai.reasoning ? ai.reasoning + ' ' : '') + '(fallback to computed accessible name)',
      };
    }

    // Sin cambios
    return ai;
  }

  // ========== HELPERS COMUNES ==========

  protected sanitizeElementInfo(elementInfo: ElementInfo): ElementInfo {
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

  protected enhanceWithAria(element: ElementInfo): ElementInfo {
    return {
      ...element,
      computedRole: element.computedRole || this.ariaCalculator.computeRole(element),
      accessibleName: element.accessibleName || this.ariaCalculator.computeAccessibleName(element)
    };
  }

  protected isStableId(id: string): boolean {
    const unstablePatterns = [
      /^\d+$/, /^[a-f0-9-]{36}$/, /^[a-f0-9]{8,}$/, /react-|mui-|auto-|generated-/
    ];
    return !unstablePatterns.some(p => p.test(id));
  }

  protected isStableClass(className: string): boolean {
    const utilityPatterns = [
      /^(xs|sm|md|lg|xl|xxl)-/, /^(col|row|container)-/, /^(bg|text|border|rounded)-/,
      /^(p|m|px|py|mx|my|mt|mb|ml|mr|pt|pb|pl|pr)-[0-9]/,
      /^(w|h|min-w|min-h|max-w|max-h)-/, /^(flex|grid|block|inline|hidden|visible)$/,
      /^(absolute|relative|fixed|static|sticky)$/, /^(z|opacity|cursor|transition|duration|ease)-/,
      /^hover:/, /^focus:/, /^active:/, /^disabled:/, /^group-/, /^peer-/
    ];
    return !utilityPatterns.some(p => p.test(className));
  }

  // ========== ESTRATEGIAS ==========

  protected tryPriorityAttributes(element: ElementInfo): SelectorResult | null {
    for (const attr of this.config.projectAttributes) {
      if (element.attributes[attr]) {
        return this.result(element.attributes[attr], 100, 'test-id', `Selected attribute '${attr}'.`);
      }
    }
    return null;
  }

  protected tryAriaRoleStrategy(element: ElementInfo): SelectorResult | null {
    const role = element.computedRole;
    const name = element.accessibleName;

    if (!role) return null;
    const highValueRoles = ['button', 'link', 'textbox', 'combobox', 'checkbox', 'radio', 'tab', 'menuitem'];

    if (highValueRoles.includes(role)) {
      if (name && name.trim() && name.length > 0 && name.length < 50) {
        return this.result(`${role}|${name.trim()}`, 95, 'role', `Uses ARIA role '${role}' with accessible name.`);
      }
    }
    return null;
  }

  protected trySemanticAttributesStrategy(element: ElementInfo): SelectorResult | null {
    const { attributes, tagName } = element;

    if (attributes['aria-label'] && attributes['aria-label'].trim()) {
      return this.result(`${tagName}[aria-label="${attributes['aria-label']}"]`, 90, 'css', `Uses explicit aria-label.`);
    }

    if (['input', 'select', 'textarea'].includes(tagName)) {
      if (attributes['name'] && attributes['name'].trim()) {
        return this.result(`${tagName}[name="${attributes['name']}"]`, 88, 'css', `Uses form element name attribute.`);
      }

      if (tagName === 'input' && attributes['type']) {
        const specificTypes = ['email', 'password', 'search', 'tel', 'url', 'number', 'date'];
        if (specificTypes.includes(attributes['type'])) {
          return this.result(`input[type="${attributes['type']}"]`, 85, 'css', `Uses specific input type '${attributes['type']}'.`);
        }
      }
    }

    if (attributes['role']) {
      return this.result(`${tagName}[role="${attributes['role']}"]`, 85, 'css', `Uses ARIA role.`);
    }

    return null;
  }

  protected tryFormAttributesStrategy(element: ElementInfo): SelectorResult | null {
    const { attributes, tagName } = element;

    if (tagName === 'label' && attributes['for']) {
      return this.result(`label[for="${attributes['for']}"]`, 88, 'css', `Label with for attribute.`);
    }

    if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
      if (attributes['name']) {
        return this.result(`${tagName}[name="${attributes['name']}"]`, 85, 'css', `Form element with name.`);
      }
    }

    return null;
  }

  protected tryTextStrategy(element: ElementInfo): SelectorResult | null {
    const cleanText = element.textContent?.trim();
    if (!cleanText || cleanText.length === 0 || cleanText.length > 50) return null;

    const genericTexts = ['click', 'submit', 'cancel', 'ok', 'yes', 'no', 'close', 'open', 'save', 'delete', 'edit'];
    const isGeneric = genericTexts.some(generic => cleanText.toLowerCase() === generic);

    if (isGeneric) {
      return this.result(cleanText, 65, 'text', 'Uses text content (generic).', element.tagName);
    }

    if (cleanText.length >= 3) {
      return this.result(cleanText, 80, 'text', 'Uses specific text content.', element.tagName);
    }

    return null;
  }

  protected tryPlaceholderStrategy(element: ElementInfo): SelectorResult | null {
    const { attributes } = element;
    if (attributes['placeholder'] && attributes['placeholder'].trim() && attributes['placeholder'].length < 50) {
      return this.result(attributes['placeholder'].trim(), 75, 'placeholder', `Uses placeholder text.`);
    }
    return null;
  }

  protected tryStableIdStrategy(element: ElementInfo): SelectorResult | null {
    const id = element.id;
    if (!id || !id.trim()) return null;

    // IDs de ASP.NET (contienen _ pero no $) son habitualmente estables para CSS/DOM
    if (id.includes('_') && !id.includes('$')) {
      return this.result(id, 92, 'id', `Uses ASP.NET style stable ID.`);
    }

    const uiKeywords = ['btn', 'button', 'input', 'txt', 'text', 'password', 'email',
      'user', 'login', 'submit', 'form', 'field', 'control'];
    const idLower = id.toLowerCase();
    if (uiKeywords.some(keyword => idLower.includes(keyword))) {
      return this.result(id, 88, 'id', `Uses descriptive UI ID.`);
    }

    if (!this.isStableId(id)) return null;

    if (id.length >= 3) {
      return this.result(id, 78, 'id', `Uses stable ID attribute.`);
    }
    return null;
  }

  protected tryLinkHrefStrategy(element: ElementInfo): SelectorResult | null {
    if (element.tagName !== 'a') return null;

    const href = element.attributes['href'];
    if (!href) return null;

    const keywords = ['discord', 'github', 'linkedin', 'twitter', 'facebook', 'youtube', 'instagram', 'login', 'signup'];

    for (const keyword of keywords) {
      if (href.toLowerCase().includes(keyword)) {
        return this.result(keyword, 88, 'link-href', `Uses link href containing '${keyword}'.`);
      }
    }
    return null;
  }

  protected tryStableCssStrategy(element: ElementInfo): SelectorResult | null {
    const { className, tagName, id } = element;

    if (id && this.isStableId(id)) {
      return this.result(`#${id}`, 85, 'css', `Uses ID as CSS selector.`);
    }

    if (!className || typeof className !== 'string') return null;

    const classes = className.split(' ').filter(c => c.trim());
    const stableClasses = classes.filter(cls => this.isStableClass(cls));

    const genericClasses = ['form-control', 'btn', 'input', 'button', 'field', 'control'];
    const meaningfulClasses = stableClasses.filter(cls =>
      !genericClasses.includes(cls.toLowerCase())
    );

    if (meaningfulClasses.length > 0) {
      const bestClass = meaningfulClasses[0];
      return this.result(`${tagName}.${bestClass}`, 60, 'css', `Uses meaningful CSS class.`);
    }

    if (stableClasses.length > 0 && element.attributes) {
      if (element.attributes['type']) {
        return this.result(
          `${tagName}[type="${element.attributes['type']}"].${stableClasses[0]}`,
          55,
          'css',
          `Uses CSS with type attribute.`
        );
      }
      if (element.attributes['name']) {
        return this.result(
          `${tagName}[name="${element.attributes['name']}"]`,
          65,
          'css',
          `Uses name attribute as CSS.`
        );
      }
    }

    if (stableClasses.length > 0) {
      return this.result(
        `${tagName}.${stableClasses[0]}`,
        40,
        'css',
        `Uses generic CSS class (low confidence).`
      );
    }
    return null;
  }

  protected tryFallbackStrategy(element: ElementInfo): SelectorResult {
    const { tagName, attributes } = element;

    if (tagName === 'button') {
      return this.result('button', 40, 'css', 'Fallback: button tag.');
    }

    if (tagName === 'input' && attributes['type']) {
      return this.result(`input[type="${attributes['type']}"]`, 45, 'css', `Fallback: input by type.`);
    }

    if (tagName === 'a') {
      return this.result('a', 35, 'css', 'Fallback: link tag.');
    }

    return this.result(tagName, 20, 'css', 'Fallback: tag name only.');
  }

  protected result(selector: string, confidence: number, type: string, reasoning: string, tagName?: string): SelectorResult {
    const result: SelectorResult = { selector, confidence, type, reasoning };
    if (tagName) (result as any).tagName = tagName;
    return result;
  }
}
