// src/core/ai/ai-orchestrator.ts
import type { SelectorResult, ElementInfo, PageContext } from '../../types/index.js';
import type { BestLocatorConfig } from '../../types/index.js';

// Interfaz mínima esperada del provider (ajústala si tu provider difiere)
export interface AIProvider {
  ask(prompt: string): Promise<string>;
}

type RawAISuggestion = {
  strategy?: string;
  value?: string;
  reasoning?: string;
};

// ----------------- Utils -----------------

const STRATEGY_ALIASES: Record<string, 'role' | 'css' | 'xpath' | 'id' | 'name' | 'text' | 'placeholder' | 'test-id'> = {
  'role': 'role',
  'aria role': 'role',
  'aria-role': 'role',
  'ariarole': 'role',
  'aria': 'role',
  'css': 'css',
  'selector': 'css',
  'xpath': 'xpath',
  'id': 'id',
  'name': 'name',
  'text': 'text',
  'innertext': 'text',
  'placeholder': 'placeholder',
  'test-id': 'test-id',
  'data-test': 'test-id',
  'data-testid': 'test-id',
  'data-cy': 'test-id',
  'data-qa': 'test-id',
};

function normalizeStrategyName(s?: string): keyof typeof STRATEGY_ALIASES | undefined {
  if (!s) return undefined;
  const k = s.toLowerCase().replace(/\s+/g, ''); // "aria role" -> "ariarole"
  // probar exacto
  if (STRATEGY_ALIASES[s.toLowerCase()]) return s.toLowerCase() as any;
  // probar compactado
  const compact = s.toLowerCase().replace(/\s+/g, ' ');
  if (STRATEGY_ALIASES[compact]) return compact as any;
  // probar sin espacios
  if (STRATEGY_ALIASES[k]) return k as any;
  return undefined;
}

function toCanonicalType(s?: string): SelectorResult['type'] | undefined {
  const norm = normalizeStrategyName(s);
  return norm ? STRATEGY_ALIASES[norm] : undefined;
}

// role|name
const RE_ROLE_PIPE = /^(\w+)\|(.+)$/;
// role[name='...']
const RE_ROLE_NAME = /^(\w+)\[name=['"]([^'"]+)['"]\]$/;
// CSS [role='button'][aria-label='X'] o [role="button"][name="X"] o [role][title]
const RE_CSS_ROLE_ARIA = /\[role=['"]([^'"]+)['"]\][^\[]*(?:\[(?:aria-label|name|title)=['"]([^'"]+)['"]\])/i;
// getByRole('button', { name: 'X' })
const RE_PLAYWRIGHT_ROLE = /getByRole\(\s*['"]([^'"]+)['"]\s*,\s*\{\s*name\s*:\s*['"]([^'"]+)['"]\s*\}\s*\)/i;

function trimQuotes(s: string): string {
  return String(s).replace(/^['"]|['"]$/g, '');
}

function parseRoleish(value: string): { role?: string; name?: string } | null {
  const v = String(value).trim();

  let m = v.match(RE_ROLE_PIPE);
  if (m) return { role: m[1], name: m[2] };

  m = v.match(RE_ROLE_NAME);
  if (m) return { role: m[1], name: m[2] };

  m = v.match(RE_CSS_ROLE_ARIA);
  if (m) return { role: m[1], name: m[2] };

  m = v.match(RE_PLAYWRIGHT_ROLE);
  if (m) return { role: m[1], name: m[2] };

  // casos como "button[aria-label='X']" sin [role=...] explícito
  const cssRole = v.match(/^([a-z]+)\s*\[\s*(?:aria-label|name|title)\s*=\s*['"]([^'"]+)['"]\s*\]$/i);
  if (cssRole) return { role: cssRole[1], name: cssRole[2] };

  return null;
}

// Preferir accessibleName si el "name" parece ID ASP.NET o coincide con @name
function preferAccessibleName(candidateName: string | undefined, el: ElementInfo): string | undefined {
  if (!candidateName) return candidateName;
  const acc = el.accessibleName?.trim();
  const equalsDomName = el.attributes?.name && el.attributes.name === candidateName;
  const looksAspNet = candidateName.includes('$');
  if (acc && (equalsDomName || looksAspNet) && acc !== candidateName) {
    return acc;
  }
  return candidateName;
}

function makeRoleResult(role: string, name: string, baseConfidence = 95, reasoning?: string): SelectorResult {
  return {
    selector: `${role}|${name}`,
    type: 'role',
    confidence: baseConfidence,
    aiEnhanced: true,
    reasoning,
  };
}

function salvageFromElement(el: ElementInfo, reasoning: string): SelectorResult {
  // Orden de salvage: accessibleName (role?), id estable, name attr, placeholder, texto, tag
  const acc = el.accessibleName?.trim();
  const role = el.computedRole?.trim();
  if (acc && role) {
    return makeRoleResult(role, acc, 94, `(salvaged) ${reasoning}`);
  }
  if (el.id) {
    return { selector: el.id, type: 'id', confidence: 92, aiEnhanced: true, reasoning: `(salvaged) ${reasoning}` };
  }
  if (el.attributes?.name) {
    return { selector: `[name="${el.attributes.name}"]`, type: 'css', confidence: 90, aiEnhanced: true, reasoning: `(salvaged) ${reasoning}` };
  }
  if (el.attributes?.placeholder) {
    return { selector: el.attributes.placeholder, type: 'placeholder', confidence: 88, aiEnhanced: true, reasoning: `(salvaged) ${reasoning}` };
  }
  if (el.textContent?.trim()) {
    return { selector: el.textContent.trim(), type: 'text', confidence: 80, aiEnhanced: true, reasoning: `(salvaged) ${reasoning}` };
  }
  return { selector: el.tagName || 'div', type: 'css', confidence: 50, aiEnhanced: true, reasoning: `(salvaged) ${reasoning}` };
}

function tryParseJSONBlock(raw: string): RawAISuggestion | null {
  // intenta JSON puro
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === 'object') return j as RawAISuggestion;
  } catch {}
  // intenta extraer entre <ANSWER> ... </ANSWER>
  const m = raw.match(/<ANSWER>\s*([\s\S]*?)\s*<\/ANSWER>/i);
  if (m) {
    try {
      const j = JSON.parse(m[1]);
      if (j && typeof j === 'object') return j as RawAISuggestion;
    } catch {}
  }
  return null;
}

// ----------------- Orchestrator principal -----------------

export async function getBestLocatorStrategy(
  provider: AIProvider,
  config: BestLocatorConfig,
  element: ElementInfo,
  _context: PageContext,
  prompt: string,
  attempts = 3
): Promise<SelectorResult> {
  let lastRaw = '';
  for (let i = 0; i < attempts; i++) {
    lastRaw = await provider.ask(prompt);

    // 1) Intentar parseo JSON estructurado
    const parsed = tryParseJSONBlock(lastRaw);
    if (parsed?.value) {
      const t = toCanonicalType(parsed.strategy);
      // 1.a) rol canónico (o deducido desde value)
      if (t === 'role') {
        const roleish = parseRoleish(parsed.value);
        if (roleish?.role && roleish.name) {
          const fixedName = preferAccessibleName(roleish.name, element);
          return makeRoleResult(roleish.role, fixedName!, 96, parsed.reasoning);
        }
      }

      // 1.b) Si el strategy no es role pero el value PARECE role=> convertir
      const asRole = parseRoleish(parsed.value);
      if (asRole?.role && asRole.name) {
        const fixedName = preferAccessibleName(asRole.name, element);
        return makeRoleResult(asRole.role, fixedName!, 95, parsed.reasoning);
      }

      // 1.c) Otras estrategias: cubrirlas todas
      if (t === 'id') {
        return { selector: trimQuotes(parsed.value), type: 'id', confidence: 94, aiEnhanced: true, reasoning: parsed.reasoning };
      }
      if (t === 'name') {
        const v = trimQuotes(parsed.value);
        return { selector: `[name="${v}"]`, type: 'css', confidence: 92, aiEnhanced: true, reasoning: parsed.reasoning };
      }
      if (t === 'placeholder') {
        return { selector: trimQuotes(parsed.value), type: 'placeholder', confidence: 90, aiEnhanced: true, reasoning: parsed.reasoning };
      }
      if (t === 'text') {
        let v = trimQuotes(parsed.value);
        // Normalizar si “texto” parece ASP.NET name o coincide con @name → usar accessibleName
        const acc = preferAccessibleName(v, element);
        if (acc && acc !== v) v = acc;
        return { selector: v, type: 'text', confidence: 90, aiEnhanced: true, reasoning: parsed.reasoning };
      }
      if (t === 'css') {
        // si es CSS con role/aria-label -> convertir a role|name
        const roleish2 = parseRoleish(parsed.value);
        if (roleish2?.role && roleish2.name) {
          const fixedName = preferAccessibleName(roleish2.name, element);
          return makeRoleResult(roleish2.role, fixedName!, 95, parsed.reasoning);
        }
        return { selector: String(parsed.value), type: 'css', confidence: 88, aiEnhanced: true, reasoning: parsed.reasoning };
      }
      if (t === 'xpath') {
        return { selector: String(parsed.value), type: 'xpath', confidence: 88, aiEnhanced: true, reasoning: parsed.reasoning };
      }

      // 1.d) Si el strategy es desconocido, intentar deducir desde value
      const roleish3 = parseRoleish(parsed.value);
      if (roleish3?.role && roleish3.name) {
        const fixedName = preferAccessibleName(roleish3.name, element);
        return makeRoleResult(roleish3.role, fixedName!, 95, parsed.reasoning);
      }
      // si se ve como #id
      if (/^#[-A-Za-z0-9_:.\u00A0-\uFFFF]+$/.test(parsed.value)) {
        return { selector: parsed.value.replace(/^#/, ''), type: 'id', confidence: 93, aiEnhanced: true, reasoning: parsed.reasoning };
      }
      // name=...
      const nameMatch = parsed.value.match(/^\[?name=['"]([^'"]+)['"]\]?$/i);
      if (nameMatch) {
        return { selector: `[name="${nameMatch[1]}"]`, type: 'css', confidence: 92, aiEnhanced: true, reasoning: parsed.reasoning };
      }
    }

    // 2) Si no se pudo parsear JSON, intentar deducir desde el raw
    const roleishRaw = parseRoleish(lastRaw);
    if (roleishRaw?.role && roleishRaw.name) {
      const fixedName = preferAccessibleName(roleishRaw.name, element);
      return makeRoleResult(roleishRaw.role, fixedName!, 95, 'Recovered from raw output');
    }
  }

  // 3) Nunca devolver error: salvamos algo coherente
  return salvageFromElement(element, 'AI output not strictly valid, salvaged.');
}
