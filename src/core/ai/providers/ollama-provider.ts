// src/core/ai/providers/ollama-provider.ts
// Implementación mínima contra la API HTTP de Ollama

export type OllamaConfig = {
  host: string;        // ej. http://localhost:11434
  model: string;       // ej. llama3.1
  temperature: number; // usamos options.temperature
  timeout: number;
};

export class OllamaProvider {
  private cfg: OllamaConfig;

  constructor(cfg: OllamaConfig) {
    this.cfg = cfg;
  }

  public async ask(prompt: string): Promise<string> {
    const base = this.cfg.host.replace(/\/+$/, '');
    const url = `${base}/api/generate`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cfg.timeout);

    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.cfg.model,
          prompt,
          stream: false,
          options: { temperature: this.cfg.temperature },
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Ollama HTTP ${res.status} ${res.statusText}: ${txt}`);
      }

      const data: any = await res.json();
      // Ollama responde típicamente { response: "..." }
      const out = data?.response ?? data?.text ?? '';
      return String(out ?? '').trim();
    } finally {
      clearTimeout(timer);
    }
  }
}
