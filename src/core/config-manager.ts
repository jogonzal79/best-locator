// src/core/config-manager.ts
import fs from 'fs';
import path from 'path';
import { AIConfig, DEFAULT_AI_CONFIG } from './ai-config.js';
import { logger } from '../app/logger.js'; // <-- CORRECCIÓN: Se añade la importación del logger

// La interfaz principal se define aquí, como la fuente original de la verdad.
export interface BestLocatorConfig {
  defaultFramework: 'playwright' | 'cypress' | 'selenium' | 'testcafe';
  defaultLanguage: 'typescript' | 'javascript' | 'python';
  timeouts: {
    pageLoad: number;
    elementSelection: number;
    validation: number;
  };
  projectAttributes: string[];
  browser: {
    headless: boolean;
    viewport: {
      width: number;
      height: number;
    };
    userAgent?: string;
  };
  output: {
    includeConfidence: boolean;
    includeXPath: boolean;
  };
  urls: Record<string, string>;
  ai: AIConfig['ai'];
}

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
  ai: DEFAULT_AI_CONFIG
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
      ai: { ...defaultConfig.ai, ...userConfig.ai }
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
