import { ElementInfo, PageContext } from '../types/index.js';

type Framework = 'playwright' | 'selenium' | 'cypress';
type Language  = 'javascript' | 'typescript' | 'python' | 'java' | 'csharp';

export class PromptTemplates {
  // ---------- Utils ----------
  private safeText(text?: string, max = 120): string {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ').slice(0, max);
  }
  private pretty(obj: any) { return JSON.stringify(obj, null, 2); }

  // ---------- PROMPT PRINCIPAL GPT-4o ----------
  getUniversalLocatorPrompt(
    element: ElementInfo,
    context: PageContext,
    framework: Framework,
    language: Language
  ): string {
    const attrs = this.pretty(element.attributes);
    const visible = this.safeText(element.textContent);

    return `You are an expert UI test engineer. Act as a pure function.

GOAL
Return ONLY one locator call formatted for the requested framework & language.

FRAMEWORK/LANGUAGE SUPPORT
- Playwright: javascript, typescript, python, java, csharp
- Selenium:   javascript, typescript, python, java, csharp
- Cypress:    javascript, typescript

OUTPUT CONTRACT
Return ONLY a JSON object wrapped in <ANSWER>...</ANSWER>. Nothing else.
Schema:
{
  "selector": "pure CSS or role/name/placeholder/id used",
  "api": "get_by_role|get_by_test_id|get_by_placeholder|locator|By.cssSelector|By.id|cy.get|etc.",
  "code": "final single line of code for the chosen framework/language",
  "strategy": "test-id|role|placeholder|id|class|fallback",
  "unique": true
}

PRIORITY (highest → lowest):
1) data-testid / data-test / data-cy
2) role + accessible name (visible text)
3) placeholder (only for inputs/textarea)
4) meaningful id
5) short, stable class
6) fallback: tag + [attr=value] or tag:nth-of-type(n)  (≤2 combinators total)

ABSOLUTE RULES
- No non-standard pseudo-classes (e.g., :contains()).
- No inline styles.
- No state/stateful classes (hover, active, disabled, selected, focus, etc.).
- No auto-generated hashes (css-xyz123, _ngcontent, .jet-button__state-hover, etc.).
- No brittle chains (>2 combinators).
- Selector must be unique in the current document/root.

INTERNAL CHECK (do NOT output)
1. Did you use the highest available priority?
2. Is it unique?
3. Does it meet all ABSOLUTE RULES?
4. Is the API syntax correct for ${framework}/${language}?

ELEMENT
tag: ${element.tagName}
attributes:
${attrs}
visibleText: "${visible}"

REQUEST
framework: ${framework}
language: ${language}

<ANSWER>`;
  }

  // ---------- PROMPT EXPLICACIÓN (opcional) ----------
  getExplanationPrompt(selector: string, element: ElementInfo): string {
    return `Explain briefly why "${selector}" is robust for a ${element.tagName}.

Return ONLY JSON:
{
  "reason": "1-2 concise sentences",
  "priority_used": "test-id|role|placeholder|id|class|fallback"
}`;
  }

  // ---------- PROMPT LOCAL (OLLAMA) ----------
  getLocalSelectorPrompt(element: ElementInfo): string {
    const attrs = JSON.stringify(element.attributes);
    return `Return ONLY one standard CSS selector. Nothing else.

Order: data-* test id > id > role+name > placeholder > stable class > fallback(tag[attr] or tag:nth-of-type).  
No :contains(), no inline styles, no long chains (>2 combinators).

INPUT: tag=${element.tagName} attrs=${attrs}
<ANSWER>`;
  }

  // ---------- PROMPT DE REPARACIÓN (AUTO-RETRY) ----------
  getRepairPrompt(
    badOutput: string,
    violations: string[],
    framework: Framework,
    language: Language
  ): string {
    return `The previous output violated rules.

BAD OUTPUT:
${badOutput}

VIOLATIONS:
- ${violations.join('\n- ')}

FIX IT:
Return a NEW valid JSON (same schema as before) wrapped in <ANSWER>...</ANSWER> that obeys all rules, for:
framework: ${framework}
language: ${language}

<ANSWER>`;
  }
}