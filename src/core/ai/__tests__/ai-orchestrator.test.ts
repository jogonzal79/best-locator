// src/core/ai/__tests__/ai-orchestrator.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getBestLocatorStrategy } from '../ai-orchestrator.js';
import { IAIProvider } from '../iai-provider.js';
import { ElementInfo } from '../../../types/index.js';

const baseElement: ElementInfo = {
  tagName: 'button',
  id: '',
  className: '',
  textContent: 'Login',
  attributes: { 'data-testid': 'login-btn' },
  computedRole: 'button',
  accessibleName: 'Login',
};

// --- INICIO DE LA CORRECCIÓN FINAL ---
// Esta es la forma canónica de crear un mock de una interfaz completa.
const mockProvider = {
  generateText: jest.fn(),
  isAvailable: jest.fn(),
  explainSelector: jest.fn(),
} as jest.Mocked<IAIProvider>;
// --- FIN DE LA CORRECCIÓN FINAL ---

describe('AI Orchestrator', () => {
  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba
    mockProvider.generateText.mockClear();
  });

  it('should correctly parse a valid JSON response from the AI', async () => {
    const aiResponse = `
      <ANSWER>
      {
        "strategy": "test-id",
        "value": "login-btn"
      }
      </ANSWER>
    `;
    // Configuramos el mock para que devuelva nuestra respuesta simulada
    mockProvider.generateText.mockResolvedValue(aiResponse);

    const result = await getBestLocatorStrategy(mockProvider, baseElement);

    expect(result.strategy).toBe('test-id');
    expect(result.value).toBe('login-btn');
    expect(mockProvider.generateText).toHaveBeenCalledTimes(1);
  });

  it('should throw an error after multiple attempts with invalid JSON', async () => {
    const malformedResponse = '<ANSWER>{"strategy": "css", value: "no-quotes"}</ANSWER>';
    mockProvider.generateText.mockResolvedValue(malformedResponse);

    await expect(getBestLocatorStrategy(mockProvider, baseElement))
      .rejects
      .toThrow('Unable to produce a valid locator strategy after 3 tries.');
      
    expect(mockProvider.generateText).toHaveBeenCalledTimes(3);
  });
});