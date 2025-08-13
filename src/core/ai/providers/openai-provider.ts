// src/core/ai/providers/openai-provider.ts
type OpenAIConfig = {
  apiKey?: string | null;
  model?: string;
  temperature?: number;
  timeout?: number;
  project?: string; // opcional si usas claves sk-proj-*
};

function toText(payload: any): string {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;

  // OpenAI chat-completions style
  const choices = payload?.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const ch0 = choices[0];
    if (typeof ch0?.text === 'string') return ch0.text;
    const msg = ch0?.message;
    if (msg) {
      if (typeof msg.content === 'string') return msg.content;
      if (Array.isArray(msg.content)) {
        const t = msg.content.find((p: any) => typeof p?.text === 'string')?.text;
        if (t) return t;
      }
    }
  }

  try { return JSON.stringify(payload); } catch { return String(payload); }
}

export class OpenAIProvider {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private timeout: number;
  private project?: string;

  constructor(cfg: OpenAIConfig = {}) {
    const envKey = process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || '';
    const inputKey = (cfg.apiKey ?? '').toString().trim();

    // Mensaje exacto que esperan algunos tests
    if (!inputKey && !envKey) {
      throw new Error('OpenAI API key is missing or too short.');
    }

    const resolvedKey = inputKey || envKey;

    // Validación de formato (tests esperan prefijo 'sk-')
    if (!resolvedKey.startsWith('sk-')) {
      throw new Error("Invalid OpenAI API key format. It should start with 'sk-'.");
    }

    this.apiKey = resolvedKey;
    this.project = cfg.project || process.env.OPENAI_PROJECT;
    this.model = cfg.model || 'gpt-4o';
    this.temperature = cfg.temperature ?? 0.7;
    this.timeout = cfg.timeout ?? 120_000;
  }

  /** Método estándar esperado por el orquestador/adaptador */
  async ask(prompt: string): Promise<string> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.project ? { 'OpenAI-Project': this.project } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          temperature: this.temperature,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        let body = '';
        try { body = await (res as any).text?.(); } catch {}
        if (!body) {
          try { body = JSON.stringify(await res.json()); } catch {}
        }
        throw new Error(`OpenAI HTTP ${res.status} ${res.statusText}: ${body || '<empty>'}`);
      }

      const json = await res.json();
      const text = toText(json);
      if (!text || !text.trim()) {
        // "empty response" → los tests esperan rechazo
        throw new Error('Empty response from OpenAI.');
      }
      return text.trim();
    } finally {
      clearTimeout(t);
    }
  }
}
