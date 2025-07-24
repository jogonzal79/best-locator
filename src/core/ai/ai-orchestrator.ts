import { z } from 'zod';
import { IAIProvider } from './iai-provider.js';
import { PromptTemplates } from '../prompt-templates.js';
import { ElementInfo, PageContext } from '../../types/index.js';

// 1. Regex para extraer el bloque
const ANSWER_REGEX = /<ANSWER>([\s\S]*?)<\/ANSWER>/;

// 2. Esquema de validación con Zod
const LocatorSchema = z.object({
  selector: z.string().min(1),
  api: z.string().min(1),
  code: z.string().min(1),
  strategy: z.enum(['test-id', 'role', 'placeholder', 'id', 'class', 'fallback']),
  unique: z.boolean()
});

export type ValidatedLocator = z.infer<typeof LocatorSchema>;

// 3. Reglas de negocio extra
function findViolations(parsed: ValidatedLocator): string[] {
  const v: string[] = [];
  const sel = parsed.selector;

  if (/:contains\(/i.test(sel)) v.push('Uses :contains()');
  if (/style=/.test(sel)) v.push('Uses inline styles');
  if (/(hover|active|disabled|selected|focus)/i.test(sel)) v.push('Uses stateful class');
  if ((sel.match(/>/g) || []).length > 2 || (sel.match(/ /g) || []).length > 2) v.push('Too many combinators');
  if (/css-[0-9a-z]{5,}/i.test(sel)) v.push('Looks like auto-generated class/hash');
  
  return v;
}

// 4. Loop de orquestación
export async function getBestLocator(
    provider: IAIProvider,
    element: ElementInfo,
    context: PageContext,
    framework: any,
    language: any
): Promise<ValidatedLocator> {
  
  const templates = new PromptTemplates();
  let attempt = 0;
  let lastOutput = '';

  // Preparamos la función que construye el prompt de reparación
  const repairPromptBuilder = (badOutput: string, violations: string[]) => {
      return templates.getRepairPrompt(badOutput, violations, framework, language);
  };
  
  // El prompt inicial
  let prompt = templates.getUniversalLocatorPrompt(element, context, framework, language);

  while (attempt < 3) {
    attempt++;
    const raw = await provider.generateText(prompt); // Asumimos que el provider tiene un método `generateText`
    lastOutput = raw;
    const match = ANSWER_REGEX.exec(raw);
    if (!match || !match[1]) {
        prompt = repairPromptBuilder(raw, ['No <ANSWER> block found']);
        continue;
    }

    try {
      const json = JSON.parse(match[1]);
      const parsed = LocatorSchema.parse(json);
      const violations = findViolations(parsed);
      
      if (violations.length === 0) {
        return parsed; // Éxito
      }
      
      // Si hay violaciones, preparamos el reintento
      prompt = repairPromptBuilder(raw, violations);

    } catch (e: any) {
      // Si el JSON es inválido o no cumple el esquema, preparamos el reintento
      const errorMessage = e instanceof z.ZodError ? 'Schema mismatch' : 'Invalid JSON';
      prompt = repairPromptBuilder(raw, [errorMessage, e.message]);
    }
  }

  throw new Error(`Unable to produce a valid locator after 3 tries. Last output:\n${lastOutput}`);
}