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

// Esta es la forma canónica de crear un mock de una interfaz completa.
const mockProvider = {
  generateText: jest.fn(),
  isAvailable: jest.fn(),
  explainSelector: jest.fn(),
} as jest.Mocked<IAIProvider>;

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
      // ✅ CORREGIDO: Cambiar "tries" por "attempts" según el nuevo mensaje
      .toThrow('Unable to produce a valid locator strategy after 3 attempts.');
      
    expect(mockProvider.generateText).toHaveBeenCalledTimes(3);
  });

  // ✅ NUEVO TEST: Verificar que el AI maneja role correctamente
  it('should correctly parse role strategy with pipe format', async () => {
    const aiResponse = `
      <ANSWER>
      {
        "strategy": "role",
        "value": "button|Login"
      }
      </ANSWER>
    `;
    mockProvider.generateText.mockResolvedValue(aiResponse);

    const result = await getBestLocatorStrategy(mockProvider, baseElement);

    expect(result.strategy).toBe('role');
    expect(result.value).toBe('button|Login');
    expect(mockProvider.generateText).toHaveBeenCalledTimes(1);
  });

  // ✅ NUEVO TEST: Verificar manejo de link-href strategy
  it('should correctly parse link-href strategy', async () => {
    const aiResponse = `
      <ANSWER>
      {
        "strategy": "link-href",
        "value": "github"
      }
      </ANSWER>
    `;
    mockProvider.generateText.mockResolvedValue(aiResponse);

    const result = await getBestLocatorStrategy(mockProvider, baseElement);

    expect(result.strategy).toBe('link-href');
    expect(result.value).toBe('github');
    expect(mockProvider.generateText).toHaveBeenCalledTimes(1);
  });

  // ✅ NUEVO TEST: Verificar que rechaza URLs completas en link-href
  it('should reject full URLs in link-href strategy and retry', async () => {
    const badResponse = `
      <ANSWER>
      {
        "strategy": "link-href",
        "value": "https://github.com/user/repo"
      }
      </ANSWER>
    `;
    const goodResponse = `
      <ANSWER>
      {
        "strategy": "link-href",
        "value": "github"
      }
      </ANSWER>
    `;
    
    // Primera llamada retorna URL completa (malo), segunda llamada retorna keyword (bueno)
    mockProvider.generateText
      .mockResolvedValueOnce(badResponse)
      .mockResolvedValueOnce(goodResponse);

    const result = await getBestLocatorStrategy(mockProvider, baseElement);

    expect(result.strategy).toBe('link-href');
    expect(result.value).toBe('github');
    expect(mockProvider.generateText).toHaveBeenCalledTimes(2);
  });

  // ✅ NUEVO TEST: Verificar parsing con reasoning opcional
  it('should correctly parse response with reasoning field', async () => {
    const aiResponse = `
      <ANSWER>
      {
        "strategy": "text",
        "value": "Create Account",
        "reasoning": "Unique descriptive text unlikely to change"
      }
      </ANSWER>
    `;
    mockProvider.generateText.mockResolvedValue(aiResponse);

    const result = await getBestLocatorStrategy(mockProvider, baseElement);

    expect(result.strategy).toBe('text');
    expect(result.value).toBe('Create Account');
    expect(result.reasoning).toBe('Unique descriptive text unlikely to change');
    expect(mockProvider.generateText).toHaveBeenCalledTimes(1);
  });
});