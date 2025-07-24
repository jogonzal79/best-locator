import { ElementInfo, PageContext } from '../types/index.js';

type Framework = 'playwright' | 'selenium' | 'cypress';
type Language  = 'javascript' | 'typescript' | 'python' | 'java' | 'csharp';

export class PromptTemplates {
  // ---------- Utils (sin cambios) ----------
  private safeText(text?: string, max = 120): string {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ').slice(0, max);
  }
  private pretty(obj: any) { return JSON.stringify(obj, null, 2); }

  // ---------- PROMPT UNIVERSAL (GPT-4o) - VERSIÓN FINAL CON ESTRATEGIA SIMPLE ----------
  getUniversalLocatorPrompt(element: ElementInfo): string {
    const attrs = this.pretty(element.attributes);
    const text = this.safeText(element.textContent);

    return `You are an expert test automation engineer. Your goal is to analyze an HTML element and return the best locating strategy as a JSON object.

PRIORITY (from highest to lowest):
1. Test ID: Use the value of 'data-testid', 'data-test', or 'data-cy'.
2. ARIA Role & Name: Use the element's computed role and accessible name.
3. Text Content: Use the element's unique visible text.
4. Placeholder: For input elements.
5. Unique ID.
6. Stable CSS as a last resort.

OUTPUT CONTRACT:
Return ONLY a JSON object inside <ANSWER> tags with this schema:
\`\`\`json
{
  "strategy": "MUST BE one of: 'test-id' | 'role' | 'text' | 'placeholder' | 'id' | 'css'",
  "value": "The value for the strategy (e.g., 'username' for a data-testid, 'button|Login' for a role, 'USDC' for text)"
}
\`\`\`
Example for an input with data-testid="username": { "strategy": "test-id", "value": "username" }
Example for a button with text 'Login': { "strategy": "role", "value": "button|Login" }
For 'role' strategy, combine role and name with a pipe '|'.

ELEMENT INFO:
- Tag: ${element.tagName}
- Computed Role: ${element.computedRole || 'none'}
- Accessible Name: ${element.accessibleName || text}
- Attributes: ${attrs}

<ANSWER>`;
  }

  // ---------- PROMPT EXPLICACIÓN (opcional, sin cambios) ----------
  getExplanationPrompt(selector: string, element: ElementInfo): string {
    return `Explain briefly why "${selector}" is robust for a ${element.tagName}.

Return ONLY JSON:
{
  "reason": "1-2 concise sentences",
  "priority_used": "test-id|role|placeholder|id|class|fallback"
}`;
  }

  // ---------- PROMPT LOCAL (OLLAMA) - ACTUALIZADO A LA ESTRATEGIA SIMPLE ----------
  getLocalSelectorPrompt(element: ElementInfo): string {
    const attrs = JSON.stringify(element.attributes);
    return `Return ONLY a JSON object with the best CSS selector strategy.

Schema:
{
  "strategy": "css",
  "value": "the CSS selector"
}

Order: data-* test id > id > stable class > fallback(tag[attr]).
No :contains(), no inline styles, no long chains (>2 combinators).

INPUT: tag=${element.tagName} attrs=${attrs}
<ANSWER>`;
  }

  // ---------- PROMPT DE REPARACIÓN (AUTO-RETRY) - ACTUALIZADO A LA ESTRATEGIA SIMPLE ----------
  getRepairPrompt(
    badOutput: string,
    violations: string[]
  ): string {
    // El framework y el lenguaje ya no son necesarios aquí
    return `The previous output violated the rules.

BAD OUTPUT:
${badOutput}

VIOLATIONS:
- ${violations.join('\n- ')}

FIX IT:
Return a NEW, valid JSON object wrapped in <ANSWER>...</ANSWER> that obeys the required schema:
\`\`\`json
{
  "strategy": "MUST BE one of: 'test-id' | 'role' | 'text' | 'placeholder' | 'id' | 'css'",
  "value": "The value for the strategy"
}
\`\`\``;
  }
}