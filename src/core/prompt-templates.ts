import { ElementInfo, PageContext } from './ai-engine.js';

export class PromptTemplates {
  
  getSelectorPrompt(element: ElementInfo, context: PageContext): string {
    return `You are a CSS selector expert for test automation. Generate the most stable CSS selector for this element.

ELEMENT:
- Tag: ${element.tagName}
- ID: ${element.id || 'none'}
- Classes: ${element.className || 'none'}
- Text: ${element.textContent.substring(0, 100)}
- Attributes: ${JSON.stringify(element.attributes)}

CONTEXT:
- URL: ${context.url}
- Page Type: ${context.pageType || 'unknown'}
- Page Title: ${context.title}

PRIORITY (highest to lowest):
1. data-test, data-testid, data-cy
2. aria-label, role
3. name attribute
4. ID (if stable)
5. text content (if unique)
6. CSS classes (if semantic)

Return JSON only:
{
  "selector": "best_css_selector",
  "type": "selector_type",
  "confidence": 95,
  "explanation": "why this selector is optimal",
  "alternatives": ["alternative1", "alternative2"],
  "stabilityScore": 0.95,
  "suggestions": ["improvement suggestion"]
}`;
  }

  getAnalysisPrompt(element: ElementInfo, context: PageContext): string {
    return `Analyze this web element for test automation context.

ELEMENT: ${element.tagName}#${element.id || 'no-id'}.${element.className || 'no-class'}
TEXT: "${element.textContent.substring(0, 50)}"
ATTRIBUTES: ${JSON.stringify(element.attributes)}
PAGE: ${context.url}

Return JSON:
{
  "explanation": "what this element does",
  "pageContext": "login form | checkout | navigation | etc",
  "alternatives": ["selector1", "selector2"],
  "stabilityScore": 0.85,
  "suggestions": ["add data-test attribute"],
  "confidence": 0.9
}`;
  }

  getExplanationPrompt(selector: string, element: ElementInfo): string {
    return `Explain why this CSS selector is good/bad for test automation:

SELECTOR: ${selector}
ELEMENT: ${element.tagName} with text "${element.textContent.substring(0, 50)}"

Explain in 1-2 sentences why this selector is stable or unstable for testing.`;
  }

  getPageAnalysisPrompt(context: PageContext): string {
    return `Analyze this webpage for test automation:

URL: ${context.url}
TITLE: ${context.title}

Detect page type (login, checkout, dashboard, etc.) and return JSON:
{
  "pageType": "login_page",
  "testingStrategy": "focus on form validation",
  "keyElements": ["username", "password", "submit"],
  "confidence": 0.9
}`;
  }
}