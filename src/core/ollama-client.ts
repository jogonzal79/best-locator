// src/core/ollama-client.ts
export interface OllamaConfig {
  host: string;
  model: string;
  timeout: number;
  temperature: number;
}

export interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
}

export class OllamaClient {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
  }

// En ollama-client.ts, reemplaza el método generate:

async generate(prompt: string): Promise<OllamaResponse> {
  console.log('🔥 [DEBUG] OllamaClient.generate called');

  // Aumentar timeout a 120 segundos para prompts complejos
  const AI_TIMEOUT = 120000; // 120 segundos

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('🔥 [DEBUG] Request timeout triggered after 120s');
    controller.abort();
  }, AI_TIMEOUT);

  try {
    console.log('🔥 [DEBUG] Making fetch request to:', `${this.config.host}/api/generate`);
    
    const requestBody = {
      model: this.config.model,
      prompt: prompt,
      temperature: 0.1,
      stream: false,
      options: {
        num_predict: 40,     // ← Muy corto para evitar explicaciones
        stop: ["\n\n", "Example", "Note", "Because"],  // ← Parar en explicaciones
        temperature: 0.1
      }
    };
    
    const response = await fetch(`${this.config.host}/api/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log('🔥 [DEBUG] Response received, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as OllamaResponse;
    console.log('🔥 [DEBUG] AI response successful');
    return result;
    
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.log('🔥 [DEBUG] Error in generate:', error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('Ollama request timeout - AI took too long to respond');
    }
    
    throw new Error(`Ollama connection failed: ${error.message}`);
  }
}

// También actualiza tu best-locator.config.json para aumentar el timeout:
// "timeout": 60000  // en lugar de 30000

  async ping(): Promise<boolean> {
    try {
      console.log('🔥 [DEBUG] Pinging Ollama...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.config.host}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('🔥 [DEBUG] Ping response status:', response.status);
      return response.ok;
      
    } catch (error) {
      console.log('🔥 [DEBUG] Ping failed:', error);
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.host}/api/tags`);
      const data = await response.json() as { models: { name: string }[] };
      return data.models.map(m => m.name);
    } catch {
      return [];
    }
  }
}