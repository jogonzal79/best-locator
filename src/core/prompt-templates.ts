// src/core/prompt-templates.ts – refined version (escaped backticks)

import { ElementInfo } from '../types/index.js';

/* -------------------------------------------------------------------------- */
/*                              Shared constants                              */
/* -------------------------------------------------------------------------- */

export const VALID_STRATEGIES = [
  'test-id',
  'role',
  'text',
  'placeholder',
  'id',
  'css',
  'link-href',
] as const;

export type Strategy = typeof VALID_STRATEGIES[number];

/* -------------------------------------------------------------------------- */
/*                              Prompt templates                              */
/* -------------------------------------------------------------------------- */

type Framework = 'playwright' | 'selenium' | 'cypress';
type Language  = 'javascript' | 'typescript' | 'python' | 'java' | 'csharp';

export class PromptTemplates {
  /* ----------------------------- Utils helpers ---------------------------- */
  private safeText(text = '', max = 120): string {
    return text.trim().replace(/\s+/g, ' ').slice(0, max);
  }
  private pretty(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
  }

  /* ------------------ UNIVERSAL PROMPT (remote LLMs, GPT) ----------------- */
  public getUniversalLocatorPrompt(element: ElementInfo): string {
    const attrs = this.pretty(
      Object.fromEntries(Object.entries(element.attributes).slice(0, 12)),
    );
    const text           = this.safeText(element.textContent, 50);
    const role           = element.computedRole   || 'none';
    const accessibleName = element.accessibleName || text;

    return `You are an expert test automation engineer. Your goal is to find the MOST ROBUST and MAINTAINABLE locator strategy for this HTML element.

ROBUSTNESS HIERARCHY (prioritize in this exact order):
1. TEST IDs: data-testid, data-test, data-cy (highest priority – always use if available)
2. ARIA ROLE + NAME: Use semantic roles with descriptive accessible names
3. SEMANTIC ATTRIBUTES: aria-label, name (for forms), specific input types
4. MEANINGFUL TEXT: visible, unique, descriptive text (avoid generic words)
5. PLACEHOLDER: for input elements only
6. STABLE IDs: avoid auto-generated UUIDs, numbers-only, or framework IDs
7. STABLE CSS: semantic class names that indicate purpose (NOT styling)

❌ AVOID THESE ANTI-PATTERNS:
- Utility CSS classes: bg-, text-, p-, m-, w-, h-, flex, absolute, hover:, etc.
- Long CSS chains with multiple classes
- Position-based selectors (nth-child, first, last)
- Auto-generated IDs (UUIDs, react-, mui-, numbers-only)
- Generic text like "Click", "Submit", "OK", "Yes", "No"
- Styling-related classes (colors, spacing, layout utilities)

ELEMENT ANALYSIS:
- Tag: ${element.tagName}
- Computed ARIA Role: ${role}
- Accessible Name: "${accessibleName}"
- Text Content: "${text}"
- First attributes (max 12): ${attrs}

DECISION LOGIC:
1. Check for test attributes first (data-testid, data-test, data-cy).
2. If interactive element (button, link, input), prioritize ARIA role + accessible name.
3. For forms, use semantic attributes (name, type).
4. Use meaningful text content if unique and descriptive.
5. Only use CSS if classes are semantic (not utility classes).

OUTPUT FORMAT – return ONLY a valid JSON object between <ANSWER> tags (no \`\`\`json fences):

<ANSWER>
{
  "strategy": "${VALID_STRATEGIES.join(' | ')}",
  "value": "actual-selector-value",
  "reasoning": "brief explanation"
}
</ANSWER>

Focus on LONGEVITY and SEMANTIC MEANING. Choose selectors that will survive UI redesigns.`;
  }

  /* -------------------------- REPAIR PROMPT --------------------------- */
  public getRepairPrompt(badOutput: string, violations: string[]): string {
    return `The previous selector generation failed. Here's what went wrong and how to fix it:

VIOLATIONS DETECTED:
${violations.map(v => `❌ ${v}`).join('\n')}

PREVIOUS PROBLEMATIC OUTPUT:
${badOutput}

COMMON ISSUES TO FIX:
1. 🚫 Avoid Tailwind/utility classes: bg-, text-, p-, m-, w-, h-, flex, absolute, relative, top-, hover:
2. 🚫 Don't chain too many CSS classes together.
3. 🚫 Avoid position-based selectors (nth-child, first, last).
4. 🚫 Skip auto-generated IDs (UUIDs, numbers-only, react-, mui-).
5. 🚫 Remove \`\`\`json fences – return raw JSON only.
6. ✅ Prioritize semantic meaning over visual precision.
7. ✅ Use ARIA roles and accessible names when available.
8. ✅ Choose descriptive, stable identifiers.

REPAIR STRATEGY:
- Look for test attributes (data-testid, data-test, data-cy).
- Use ARIA roles for interactive elements.
- Select meaningful text content.
- Find semantic CSS classes (not styling utilities).
- Choose stable IDs that indicate purpose.

OUTPUT: corrected JSON inside <ANSWER> tags (no markdown fences).`;
  }

  /* ----------------------- EXPLANATION PROMPT ------------------------ */
  public getExplanationPrompt(selector: string, element: ElementInfo): string {
    return `Analyze this selector choice for test automation robustness:

SELECTOR: "${selector}"
ELEMENT: ${element.tagName} with text "${this.safeText(element.textContent, 30)}"

Provide analysis focusing on:
1. ROBUSTNESS: Why this selector will remain stable over time.
2. MAINTENANCE: How easy it is to understand and update.
3. RELIABILITY: What makes this selector unique and findable.
4. RISK FACTORS: What could make this selector break.

Return JSON (no markdown fences):
{
  "robustness_score": "1-10 (10 = most robust)",
  "explanation": "2-3 sentences explaining why this selector was chosen",
  "strengths": "What makes this selector reliable",
  "potential_risks": "What could cause this selector to fail",
  "improvement_suggestions": "How to make it even more robust if needed"
}`;
  }

  /* --------------------- LOCAL PROMPT (Ollama) ------------------------ */
  public getLocalSelectorPrompt(element: ElementInfo): string {
    const attrs = JSON.stringify(element.attributes);
    const text  = this.safeText(element.textContent, 40);

    return `Find the most ROBUST CSS selector strategy. Avoid utility classes and prefer semantic attributes.

PRIORITIES:
1. Test attributes (data-testid, data-test, data-cy)
2. Semantic attributes (aria-label, name, type)
3. Meaningful text content
4. Stable IDs (not auto-generated)
5. Semantic CSS classes (not bg-, text-, p-, m-, etc.)

INPUT:
- Tag: ${element.tagName}
- Text: "${text}"
- Attributes: ${attrs}

Schema:
{
  "strategy": "css",
  "value": "the most robust CSS selector"
}

Avoid: utility classes (bg-, text-, hover:), long chains, position-based selectors.

<ANSWER>`;
  }
}
