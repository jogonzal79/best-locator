import { z } from 'zod';
import { IAIProvider } from './iai-provider.js';
import { ElementInfo } from '../../types/index.js';
import { PromptTemplates } from '../prompt-templates.js';

const ANSWER_REGEX = /<ANSWER>([\s\S]*?)<\/ANSWER>/;

const LocatorStrategySchema = z.object({
  strategy: z.enum(['test-id', 'role', 'text', 'placeholder', 'id', 'css', 'link-href']),
  value: z.string().min(1),
});

export type ValidatedStrategy = z.infer<typeof LocatorStrategySchema>;

export async function getBestLocatorStrategy(
    provider: IAIProvider,
    element: ElementInfo
): Promise<ValidatedStrategy> {

  const templates = new PromptTemplates();
  let attempt = 0;
  let lastOutput = '';
  let prompt = templates.getUniversalLocatorPrompt(element);

  while (attempt < 3) {
    attempt++;
    const raw = await provider.generateText(prompt);
    lastOutput = raw;
    const match = ANSWER_REGEX.exec(raw);

    if (!match || !match[1]) {
      prompt = templates.getRepairPrompt(raw, ['No <ANSWER> block found']);
      continue;
    }

    try {
      let content = match[1].trim();
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        content = jsonMatch[1];
      }
      const json = JSON.parse(content);
      const parsed = LocatorStrategySchema.parse(json);
      return parsed;
    } catch (e: any) {
      const errorMessage = e instanceof z.ZodError ? 'Schema mismatch' : 'Invalid JSON';
      prompt = templates.getRepairPrompt(raw, [errorMessage, e.message]);
    }
  }

  throw new Error(`Unable to produce a valid locator strategy after 3 tries. Last output:\n${lastOutput}`);
}