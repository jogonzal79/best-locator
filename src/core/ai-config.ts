export interface AIConfig {
  ai: {
    enabled: boolean;
    provider: 'ollama' | 'openai' | 'claude' | 'disabled';
    ollama: {
      host: string;
      model: string;
      timeout: number;
      temperature: number;
    };
    features: {
      smartSelector: boolean;
      contextAnalysis: boolean;
      explainDecisions: boolean;
      suggestAlternatives: boolean;
    };
    fallback: {
      onTimeout: 'traditional' | 'fail';
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
    temperature: 0.3
  },
  features: {
    smartSelector: true,
    contextAnalysis: true,
    explainDecisions: true,
    suggestAlternatives: true
  },
  fallback: {
    onTimeout: 'traditional',
    onError: 'traditional'
  }
};

export class AIConfigManager {
  static validateConfig(config: AIConfig['ai']): boolean {
    if (!config.ollama.host || !config.ollama.model) return false;
    if (config.ollama.timeout < 1000) return false;
    if (config.ollama.temperature < 0 || config.ollama.temperature > 1) return false;
    return true;
  }

  static getRecommendedModels(): string[] {
    return [
      'llama3.1:8b',
      'llama3.1:7b',
      'codellama:7b',
      'phi3:mini'
    ];
  }
}