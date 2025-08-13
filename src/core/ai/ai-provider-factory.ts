// src/core/ai/ai-provider-factory.ts
import type { BestLocatorConfig } from '../../types/index.js';
import type { AIProvider } from './ai-orchestrator.js';
import { OpenAIProvider } from './providers/openai-provider.js';
import { OllamaProvider } from './providers/ollama-provider.js';

// Tipos internos mínimos (para normalizar)
type OpenAIConfig = {
  apiKey: string | null | undefined;
  model?: string;
  temperature?: number;
  timeout?: number;
  project?: string;
};

type OllamaConfig = {
  host: string;
  model: string;
  temperature: number;
  timeout: number;
};

function makeOpenAIConfig(cfg: BestLocatorConfig['ai']['openai']): OpenAIConfig {
  return {
    apiKey: cfg?.apiKey ?? null,
    model: cfg?.model ?? 'gpt-4o',
    temperature: cfg?.temperature ?? 0.7,
    timeout: cfg?.timeout ?? 120_000,
    // si trabajas con sk-proj- y necesitas project, puedes mapear OPENAI_PROJECT aquí
  };
}

function makeOllamaConfig(cfg: BestLocatorConfig['ai']['ollama']): OllamaConfig {
  return {
    host: cfg?.host ?? 'http://localhost:11434',
    model: cfg?.model ?? 'llama3.1',
    temperature: cfg?.temperature ?? 0.7,
    timeout: cfg?.timeout ?? 120_000,
  };
}

// Adaptador universal a AIProvider.ask(strings)
type AnyProvider = Record<string, any>;

function findCallableMethod(p: AnyProvider): string | null {
  const names = [
    'ask', 'generateText', 'generate', 'complete', 'chat',
    'createCompletion', 'createChatCompletion', 'invoke', 'run', 'call',
  ];
  return names.find(n => typeof p?.[n] === 'function') ?? null;
}

function adapt(p: AnyProvider): AIProvider {
  const method = findCallableMethod(p);
  return {
    async ask(prompt: string): Promise<string> {
      if (!method) throw new Error('Underlying provider does not implement ask/generate/complete/chat.');
      const out = await p[method](prompt);
      if (typeof out === 'string') return out;
      // normalización sencilla
      try { return JSON.stringify(out); } catch { return String(out); }
    }
  };
}

export function createAIProvider(config: BestLocatorConfig): AIProvider | null {
  const ai = config.ai;
  if (!ai?.enabled || ai.provider === 'disabled') return null;

  if (ai.provider === 'openai') {
    const raw = new OpenAIProvider(makeOpenAIConfig(ai.openai));
    return adapt(raw as unknown as AnyProvider);
  }

  if (ai.provider === 'ollama') {
    const raw = new OllamaProvider(makeOllamaConfig(ai.ollama));
    return adapt(raw as unknown as AnyProvider);
  }

  return null;
}
