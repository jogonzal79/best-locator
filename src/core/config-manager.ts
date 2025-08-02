// src/core/config-manager.ts
import fs from 'fs';
import path from 'path';
import { logger } from '../app/logger.js';
import { BestLocatorConfig, AppiumConfig } from '../types/index.js';

// Se define una configuración por defecto específica para Appium.
const DEFAULT_APPIUM_CONFIG: AppiumConfig = {
  enabled: false,
  serverUrl: 'http://localhost:4723',
  capabilities: {
    ios: {
      platformName: 'iOS',
      'appium:platformVersion': '17.0',
      'appium:deviceName': 'iPhone 15',
      'appium:automationName': 'XCUITest'
    },
    android: {
      platformName: 'Android',
      'appium:platformVersion': '14.0',
      'appium:deviceName': 'Pixel_7_API_34',
      'appium:automationName': 'UiAutomator2'
    }
  },
  defaultPlatform: 'ios',
  inspector: {
    enabled: true,
    port: 8100
  }
};

const DEFAULT_CONFIG: BestLocatorConfig = {
  defaultFramework: 'playwright',
  defaultLanguage: 'typescript',
  timeouts: {
    pageLoad: 30000,
    elementSelection: 1800000,
    validation: 15000
  },
  projectAttributes: ['data-testid', 'data-cy', 'data-test'],
  browser: {
    headless: false,
    viewport: {
      width: 1280,
      height: 720
    }
  },
  output: {
    includeConfidence: true,
    includeXPath: false,
  },
  urls: {},
  // CORRECCIÓN FINAL: Se ajusta la estructura de 'features' y 'fallback' según los tipos exactos.
  ai: { 
    enabled: true, 
    provider: 'ollama', 
    ollama: { 
      host: 'http://localhost:11434', 
      model: 'llama3.1',
      temperature: 0.7,
      timeout: 120000
    },
    openai: {
        apiKey: '',
        model: 'gpt-4-turbo',
        temperature: 0.7,
        timeout: 120000
    },
    // --> ESTRUCTURA CORREGIDA
    features: {
        smartSelector: true,
        explainDecisions: false
    },
    // --> ESTRUCTURA CORREGIDA
    fallback: {
        onError: 'traditional'
    }
  },
  appium: DEFAULT_APPIUM_CONFIG
};

export class ConfigManager {
  private config: BestLocatorConfig;
  private configPath: string;

  constructor() {
    this.configPath = this.findConfigFile();
    this.config = DEFAULT_CONFIG;
  }

  public async loadConfig(): Promise<BestLocatorConfig> {
    if (this.configPath) {
        try {
            let userConfig: Partial<BestLocatorConfig>;

            if (this.configPath.endsWith('.js')) {
                const module = await import(`file://${path.resolve(this.configPath)}`);
                userConfig = module.default || module;
            } else {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                userConfig = JSON.parse(configData);
            }

            logger.success(`✅ Config loaded from: ${this.configPath}`);
            this.config = this.mergeConfig(DEFAULT_CONFIG, userConfig);
        } catch (error) {
            logger.error(`⚠️ Error loading config file: ${this.configPath}`, error as any);
            logger.warning(`Using default configuration`);
            this.config = DEFAULT_CONFIG;
        }
    } else {
        logger.warning('⚠️ No config file found, using defaults');
    }
    return this.config;
  }
  
  public async getConfig(): Promise<BestLocatorConfig> {
      if (this.config === DEFAULT_CONFIG && this.hasConfigFile()) {
          await this.loadConfig();
      }
      return this.config;
  }

  private findConfigFile(): string {
    const possiblePaths = ['best-locator.config.js', 'best-locator.config.json'];
    for (const filePath of possiblePaths) {
      const currentDirPath = path.resolve(process.cwd(), filePath);
      if (fs.existsSync(currentDirPath)) { return currentDirPath; }
    }
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    if (homeDir) {
      for (const filePath of possiblePaths) {
        const homeDirPath = path.resolve(homeDir, filePath);
        if (fs.existsSync(homeDirPath)) { return homeDirPath; }
      }
    }
    return '';
  }

  private mergeConfig(defaultConfig: BestLocatorConfig, userConfig: Partial<BestLocatorConfig>): BestLocatorConfig {
    return {
      ...defaultConfig,
      ...userConfig,
      timeouts: { ...defaultConfig.timeouts, ...userConfig.timeouts },
      browser: { 
        ...defaultConfig.browser, 
        ...userConfig.browser,
        viewport: { ...defaultConfig.browser.viewport, ...userConfig.browser?.viewport }
      },
      output: { ...defaultConfig.output, ...userConfig.output },
      urls: { ...defaultConfig.urls, ...userConfig.urls },
      ai: {
        ...defaultConfig.ai,
        ...userConfig.ai,
        ollama: {
          ...defaultConfig.ai.ollama,
          ...userConfig.ai?.ollama,
        },
        openai: {
            ...defaultConfig.ai.openai,
            ...userConfig.ai?.openai,
        }
      },
      appium: {
        ...defaultConfig.appium,
        ...userConfig.appium,
        capabilities: {
          ...defaultConfig.appium.capabilities,
          ...userConfig.appium?.capabilities,
        },
        inspector: {
          ...defaultConfig.appium.inspector,
          ...userConfig.appium?.inspector,
        }
      }
    };
  }
  
  public getUrl(alias: string): string | null {
    return this.config.urls[alias] || null;
  }

  public hasConfigFile(): boolean {
    return !!this.configPath;
  }

  public createSampleConfig(): void {
    const sampleConfig = `// best-locator.config.js
export default {
  defaultFramework: 'playwright',
  defaultLanguage: 'typescript',
  
  projectAttributes: [
    'data-testid',
    'data-cy', 
    'data-test',
    'data-qa'
  ],
  
  urls: {
    local: 'http://localhost:3000',
    dev: 'https://dev.myapp.com',
  },

  ai: {
    enabled: true,
    provider: 'ollama',
    ollama: {
      host: 'http://localhost:11434',
      model: 'llama3.1',
    }
  }
};`;
    const targetPath = path.resolve(process.cwd(), 'best-locator.config.js');
    fs.writeFileSync(targetPath, sampleConfig);
    logger.success(`✅ Sample configuration created: ${targetPath}`);
    logger.info('📝 Edit the file to customize Best-Locator for your project');
  }
}