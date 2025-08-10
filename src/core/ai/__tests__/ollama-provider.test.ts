// src/core/ai/providers/__tests__/ollama-provider.test.ts

// Primero intenta con la ruta correcta - ajusta según tu estructura
import { OllamaProvider } from '../providers/ollama-provider';
import { jest } from '@jest/globals';

// Extender la interfaz global sin redeclarar fetch
declare global {
  namespace NodeJS {
    interface Global {
      fetch: jest.Mock;
    }
  }
}

// Tipado más específico para el mock
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch as any;

describe('OllamaProvider', () => {
  const config = {
    host: 'http://localhost:11434',
    model: 'llama3.1',
    timeout: 5000,
    temperature: 0.5,
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should generate text successfully', async () => {
    // Mock de la respuesta exitosa
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: async () => ({
          response: 'Ollama response',
        }),
      } as Response)
    );

    const provider = new OllamaProvider(config);
    const result = await provider.generateText('test prompt');
    
    expect(result).toBe('Ollama response');
    expect(mockFetch).toHaveBeenCalledWith(
      `${config.host}/api/generate`,
      expect.any(Object)
    );
  });
  
  it('should confirm availability when host is reachable', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({ 
        ok: true 
      } as Response)
    );
    
    const provider = new OllamaProvider(config);
    await expect(provider.isAvailable()).resolves.toBe(true);
  });

  it('deny availability when host is unreachable', async () => {
    mockFetch.mockImplementation(() =>
      Promise.reject(new Error('Network error'))
    );
    
    const provider = new OllamaProvider(config);
    await expect(provider.isAvailable()).resolves.toBe(false);
  });
});