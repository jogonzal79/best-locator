export interface AIConfig {
  ai: {
    enabled: boolean;
    provider: 'ollama' | 'openai' | 'disabled';
    
    ollama: {
      host: string;
      model: string;
      timeout: number;
      temperature: number;
    };
    openai: {
      apiKey: string;
      model: string;
      temperature: number;
      timeout: number;
    };

    features: {
      smartSelector: boolean;
      explainDecisions: boolean;
    };
    fallback: {
      onError: 'traditional' | 'fail';
    };
  };
}

export const DEFAULT_AI_CONFIG: AIConfig['ai'] = {
  enabled: false,
  provider: 'ollama',
  ollama: {
    host: 'http://localhost:11434',
    model: 'llama3.1:8b',
    timeout: 30000,
    temperature: 0.1
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o-mini',
    temperature: 0.1,
    timeout: 20000,
  },
  features: {
    smartSelector: true,
    explainDecisions: true,
  },
  fallback: {
    onError: 'traditional'
  }
};