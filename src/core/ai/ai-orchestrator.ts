// src/core/ai/ai-orchestrator.ts – versión endurecida 🛡️ (logger-agnóstico, sin errores TS)

import { z } from 'zod';
import { IAIProvider } from './iai-provider.js';
import { ElementInfo } from '../../types/index.js';
import { PromptTemplates } from '../prompt-templates.js';
import { logger } from '../../app/logger.js';

/* -------------------------------------------------------------------------- */
/*                         Helper de logging sin dependencias                */
/* -------------------------------------------------------------------------- */
/**
 * Emite mensajes en nivel debug si existe, o degrada a info/console.log.
 * - Evita error TS2339 porque accedemos a las claves mediante indexación.
 * - Evita error TS2556 usando cast a any para el spread de argumentos.
 */
function logDebug(...msg: unknown[]): void {
  if ('debug' in logger && typeof (logger as any)['debug'] === 'function') {
    (logger as any)['debug'](...msg);
  } else if (
    'info' in logger &&
    typeof (logger as any)['info'] === 'function'
  ) {
    (logger as any)['info'](...msg);
  } else {
    // eslint-disable-next-line no-console
    console.log(...msg);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Schemas                                  */
/* -------------------------------------------------------------------------- */

const ANSWER_REGEX = /<ANSWER>([\s\S]*?)<\/ANSWER>/;

const LocatorStrategySchema = z.object({
  strategy: z.enum([
    'test-id',
    'role',
    'text',
    'placeholder',
    'id',
    'css',
    'link-href',
  ]),
  value: z.string().min(1),
  reasoning: z.string().optional(),
});

export type ValidatedStrategy = z.infer<typeof LocatorStrategySchema>;

/* -------------------------------------------------------------------------- */
/*                             Public orchestrator                            */
/* -------------------------------------------------------------------------- */

export async function getBestLocatorStrategy(
  provider: IAIProvider,
  element: ElementInfo,
): Promise<ValidatedStrategy> {
  const templates = new PromptTemplates();

  let prompt = templates.getUniversalLocatorPrompt(element);
  let lastOutput = '';

  for (let attempt = 1; attempt <= 3; attempt++) {
    /* ----------------------------- Llamada a IA ---------------------------- */
    const raw = await provider.generateText(prompt);
    lastOutput = raw;
    logDebug(`AI attempt #${attempt}, raw length: ${raw.length}`);

    /* ----------------------- Extracción + validación ----------------------- */
    const { jsonContent, violations } = extractJsonContent(raw);

    if (!jsonContent) {
      prompt = templates.getRepairPrompt(raw, [
        ...violations,
        'No valid JSON found in response',
      ]);
      await sleep(200 * attempt);
      continue;
    }

    try {
      const obj = JSON.parse(jsonContent);

      // Validación previa opcional de estrategia
      if (
        ![
          'test-id',
          'role',
          'text',
          'placeholder',
          'id',
          'css',
          'link-href',
        ].includes(obj.strategy)
      ) {
        prompt = templates.getRepairPrompt(raw, [
          ...violations,
          `Invalid strategy value: ${obj.strategy}`,
        ]);
        await sleep(200 * attempt);
        continue;
      }

      // 🆕 Validación específica para link-href
      if (obj.strategy === 'link-href' && obj.value.startsWith('http')) {
        prompt = templates.getRepairPrompt(raw, [
          ...violations,
          `Invalid link-href value: should be keyword like "discord", not full URL`,
        ]);
        await sleep(200 * attempt);
        continue;
      }

      const parsed = LocatorStrategySchema.parse(obj);
      if (violations.length) {
        logDebug(
          `Selector válido con violaciones menores: ${violations.join(', ')}`,
        );
      }
      logDebug(`✅ Selector: ${parsed.strategy} → ${parsed.value}`);
      return parsed;
    } catch (e: any) {
      const errMsg =
        e instanceof z.ZodError ? 'Schema validation failed' : 'Invalid JSON';
      logDebug(`❌ Parse error: ${errMsg}: ${e.message}`);

      prompt = templates.getRepairPrompt(raw, [...violations, errMsg]);
      await sleep(200 * attempt);
    }
  }

  throw new Error(
    `Unable to produce a valid locator strategy after 3 attempts.\nLast output:\n${lastOutput}`,
  );
}

/* -------------------------------------------------------------------------- */
/*                           Helper – JSON extraction                         */
/* -------------------------------------------------------------------------- */
function extractJsonContent(
  raw: string,
): { jsonContent: string | null; violations: string[] } {
  const violations: string[] = [];

  let zone = raw;
  const answerMatch = ANSWER_REGEX.exec(raw);
  if (answerMatch?.[1]) {
    zone = answerMatch[1];
  } else {
    violations.push('Missing <ANSWER> wrapper');
  }

  const fenced = zone.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced?.[1]) zone = fenced[1];

  const jsonContent = findBalancedJson(zone);
  if (!jsonContent) violations.push('Unable to find balanced JSON object');

  return { jsonContent, violations };
}

function findBalancedJson(text: string): string | null {
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*                                 Utilities                                  */
/* -------------------------------------------------------------------------- */

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
