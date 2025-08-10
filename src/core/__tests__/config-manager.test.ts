// src/core/__tests__/config-manager.test.ts

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Crear mocks antes de importar el módulo que los usa
const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();

// Mock del módulo fs antes de cualquier import que lo use
await jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

// Importar ConfigManager DESPUÉS de configurar el mock
const { ConfigManager } = await import('../config-manager.js');

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReset();
    mockReadFileSync.mockReset();
  });

  it('should load default config if no config file is found', async () => {
    mockExistsSync.mockReturnValue(false);
    
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();
    
    expect(config.defaultFramework).toBe('playwright');
    expect(config.ai.provider).toBe('ollama');
  });

  it('should load and merge a user-defined JSON config file', async () => {
    const userConfig = {
      defaultFramework: 'cypress',
      ai: { provider: 'openai' },
    };
    
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(userConfig));
    
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();
    
    expect(config.defaultFramework).toBe('cypress');
    expect(config.ai.provider).toBe('openai');
    expect(config.defaultLanguage).toBe('typescript');
  });

  it('should return a URL alias if it exists', async () => {
    const userConfig = {
      urls: {
        local: 'http://localhost:3000'
      }
    };
    
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(userConfig));
    
    const configManager = new ConfigManager();
    await configManager.getConfig();

    expect(configManager.getUrl('local')).toBe('http://localhost:3000');
    expect(configManager.getUrl('nonexistent')).toBeNull();
  });
});