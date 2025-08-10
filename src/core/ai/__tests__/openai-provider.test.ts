// src/core/ai/providers/__tests__/openai-provider.test.ts

// Primero intenta con la ruta correcta - ajusta según tu estructura
import { OpenAIProvider } from '../providers/openai-provider';
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

describe('OpenAIProvider', () => {
  const config = {
    apiKey: 'sk-test-key-valid',
    model: 'gpt-4',
    temperature: 0.5,
    timeout: 5000,
  };

  beforeEach(() => {
    mockFetch.mockClear();
    delete process.env.OPENAI_API_KEY;
  });

  it('should throw an error if API key is missing', () => {
    expect(() => new OpenAIProvider({ ...config, apiKey: '' }))
      .toThrow('OpenAI API key is missing or too short.');
  });
  
  it('should throw an error if API key format is invalid', () => {
    expect(() => new OpenAIProvider({ ...config, apiKey: 'invalid-key-format' }))
      .toThrow("Invalid OpenAI API key format. It should start with 'sk-'.");
  });

  it('should generate text successfully on valid response', async () => {
    // Mock de la respuesta exitosa
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Success!' } }],
        }),
      } as Response)
    );

    const provider = new OpenAIProvider(config);
    const result = await provider.generateText('test prompt');

    expect(result).toBe('Success!');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${config.apiKey}`,
        }),
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({
          error: { message: 'Invalid API key' },
        }),
      } as Response)
    );

    const provider = new OpenAIProvider(config);
    await expect(provider.generateText('test prompt'))
      .rejects
      .toThrow('OpenAI API error: Invalid API key');
  });
});