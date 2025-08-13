// src/core/ai-engine.ts
import type { BestLocatorConfig, ElementInfo, SelectorResult, PageContext } from '../types/index.js';
import { getBestLocatorStrategy, type AIProvider } from './ai/ai-orchestrator.js';
// ⬇️ si en tu proyecto el factory se llama distinto, ajusta el import:
import { createAIProvider } from './ai/ai-provider-factory.js';

export class AIEngine {
  private provider: AIProvider | null = null;

  constructor(private config: BestLocatorConfig) {
    try {
      this.provider = createAIProvider(config);
    } catch {
      this.provider = null;
    }
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.config?.ai?.enabled && this.provider);
  }

  /**
   * Prompt que instruye a la IA a preferir el accessibleName real y
   * a mantener salida consistente (aunque el orquestador es tolerante).
   */
  private buildPrompt(element: ElementInfo, context: PageContext): string {
    const accName = element.accessibleName?.trim() || '';
    const role = element.computedRole || '';
    const id = element.id || '';
    const nameAttr = element.attributes?.name || '';
    const placeholder = element.attributes?.placeholder || '';
    const ariaLabel = element.attributes?.['aria-label'] || '';
    const title = element.attributes?.['title'] || '';
    const value = element.attributes?.['value'] || '';

    const hints: string[] = [];
    if (accName) hints.push(`accessibleName=${JSON.stringify(accName)}`);
    if (role) hints.push(`role=${JSON.stringify(role)}`);
    if (id) hints.push(`id=${JSON.stringify(id)}`);
    if (nameAttr) hints.push(`name=${JSON.stringify(nameAttr)}`);
    if (placeholder) hints.push(`placeholder=${JSON.stringify(placeholder)}`);
    if (ariaLabel) hints.push(`aria-label=${JSON.stringify(ariaLabel)}`);
    if (title) hints.push(`title=${JSON.stringify(title)}`);
    if (value) hints.push(`value=${JSON.stringify(value)}`);

    // “Instrucciones” + “Contexto”. El orquestador soporta salidas variadas,
    // pero esto inclina a que proponga role|name correcto con accessibleName.
    return [
      `You are an expert UI testing selector designer.`,
      `Prefer robust, semantic strategies.`,
      `If the element has a role and an accessible name, output role + name.`,
      `Avoid inventing labels. If accessibleName exists, prefer it over ASP.NET control IDs or @name values.`,
      `Valid strategies: role, css, xpath, id, name, text, placeholder, test-id.`,
      `Return a concise JSON object like:`,
      `{ "strategy": "role", "value": "button|Iniciar Sesión", "reasoning": "..." }`,
      `If you use css with [role=...][aria-label=...], it's ok — the system will normalize it.`,
      ``,
      `Page context: url=${context?.url || ''}, title=${context?.title || ''}`,
      `Element hints: ${hints.join(', ')}`,
    ].join('\n');
  }

  /**
   * Genera un SelectorResult usando IA con orquestación tolerante.
   * NO accede a result.value ni result.strategy: ya devolvemos SelectorResult.
   */
  public async generateSelector(element: ElementInfo, context: PageContext): Promise<SelectorResult> {
    const available = await this.isAvailable();
    if (!available || !this.provider) {
      throw new Error('AI is not available.');
    }

    const prompt = this.buildPrompt(element, context);

    // getBestLocatorStrategy(provider, config, element, context, prompt, attempts?)
    const result = await getBestLocatorStrategy(this.provider, this.config, element, context, prompt, 3);

    // result YA ES SelectorResult (selector, type, confidence, aiEnhanced, reasoning).
    // Aquí podrías hacer post-normalización adicional si quisieras.
    return result;
  }

  /**
   * Explicación en lenguaje natural del selector elegido.
   * Si el orquestador/IA fallan, devolvemos una explicación mínima.
   */
  public async explainSelector(selector: string, element: ElementInfo): Promise<string> {
    const available = await this.isAvailable();
    if (!available || !this.provider) {
      return `AI explanation disabled. Chosen selector: ${selector}`;
    }

    const accName = element.accessibleName?.trim();
    const role = element.computedRole;
    const id = element.id;
    const nameAttr = element.attributes?.name;
    const placeholder = element.attributes?.placeholder;
    const ariaLabel = element.attributes?.['aria-label'];

    const prompt = [
      `Explain in JSON (fields: robustness_score[1-10], explanation, strengths, potential_risks, improvement_suggestions)`,
      `why the selector below is a good choice for robust UI testing.`,
      `Consider: accessibility (role/name), stability of attributes (id/name/data-*) vs volatile text/classes,`,
      `and uniqueness. Keep it concise but specific.`,
      ``,
      `Selector: ${JSON.stringify(selector)}`,
      `Element facts: role=${JSON.stringify(role)}, accessibleName=${JSON.stringify(accName)}, id=${JSON.stringify(id)}, name=${JSON.stringify(nameAttr)}, placeholder=${JSON.stringify(placeholder)}, aria-label=${JSON.stringify(ariaLabel)}`,
    ].join('\n');

    try {
      const raw = await this.provider.ask(prompt);
      return raw?.trim() || `Selector: ${selector}`;
    } catch {
      return `Selector: ${selector}`;
    }
  }
}
