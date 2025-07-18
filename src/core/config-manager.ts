import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { AIConfig, DEFAULT_AI_CONFIG } from './ai-config.js'; // ⭐ (Import agregado)

export interface BestLocatorConfig {
  defaultFramework: 'playwright' | 'cypress' | 'selenium';
  defaultLanguage: 'typescript' | 'javascript' | 'python';
  timeouts: {
    pageLoad: number;
    elementSelection: number;
    validation: number;
  };
  selectorStrategy: {
    testAttributes: number;
    ids: number;
    semanticAttributes: number;
    textContent: number;
    cssClasses: number;
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
    format: 'string' | 'object' | 'json';
    includeConfidence: boolean;
    includeXPath: boolean;
    autoSave?: string;
  };
  urls: Record<string, string>;
  ai: AIConfig['ai']; // ⭐ (Propiedad agregada)
}

const DEFAULT_CONFIG: BestLocatorConfig = {
  defaultFramework: 'playwright',
  defaultLanguage: 'typescript',
  timeouts: {
    pageLoad: 30000,
    elementSelection: 1800000,
    validation: 15000
  },
  selectorStrategy: {
    testAttributes: 1,
    ids: 2,
    semanticAttributes: 3,
    textContent: 4,
    cssClasses: 5
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
    format: 'string',
    includeConfidence: true,
    includeXPath: false
  },
  urls: {},
  ai: DEFAULT_AI_CONFIG // ⭐ (Valor por defecto agregado)
};

export class ConfigManager {
  private config: BestLocatorConfig;
  private configPath: string;

  constructor() {
    this.configPath = this.findConfigFile();
    this.config = this.loadConfig();
  }

  private findConfigFile(): string {
    const possiblePaths = [
      'best-locator.config.js',
      'best-locator.config.json',
      '.best-locatorrc',
      '.best-locatorrc.json'
    ];

    // 🔥 BUSCAR PRIMERO EN EL DIRECTORIO ACTUAL (donde el usuario ejecuta el comando)
    for (const filePath of possiblePaths) {
      const currentDirPath = path.resolve(process.cwd(), filePath);
      if (fs.existsSync(currentDirPath)) {
        console.log(chalk.green(`📂 Config found: ${currentDirPath}`));
        return currentDirPath;
      }
    }

    // 🔍 BUSCAR EN EL HOME DIRECTORY como fallback
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    if (homeDir) {
      for (const filePath of possiblePaths) {
        const homeDirPath = path.resolve(homeDir, filePath);
        if (fs.existsSync(homeDirPath)) {
          console.log(chalk.blue(`🏠 Config found in home: ${homeDirPath}`));
          return homeDirPath;
        }
      }
    }

    return '';
  }

  private loadConfig(): BestLocatorConfig {
    if (!this.configPath) {
      console.log(chalk.yellow('⚠️  No config file found, using defaults'));
      console.log(chalk.blue('📍 Current directory:', process.cwd()));
      console.log(chalk.blue('💡 Create best-locator.config.json in your project directory'));
      return DEFAULT_CONFIG;
    }

    try {
      let userConfig: Partial<BestLocatorConfig>;

      if (this.configPath.endsWith('.js')) {
        // Importar módulo JavaScript
        const fullPath = path.resolve(this.configPath);
        // Limpiar cache para recargar cambios
        delete require.cache[fullPath];
        const moduleExports = require(fullPath);
        userConfig = moduleExports.default || moduleExports;
      } else {
        // Leer archivo JSON
        const configData = fs.readFileSync(this.configPath, 'utf8');
        userConfig = JSON.parse(configData);
      }

      console.log(chalk.green(`✅ Config loaded from: ${this.configPath}`));
      
      // 🔍 Debug viewport configuration
      if (userConfig.browser?.viewport) {
        console.log(chalk.blue(`🖥️  Viewport: ${userConfig.browser.viewport.width}x${userConfig.browser.viewport.height}`));
      }

      // Merge con configuración por defecto
      return this.mergeConfig(DEFAULT_CONFIG, userConfig);
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Error loading config file: ${this.configPath}`));
      console.log(chalk.yellow(`Using default configuration`));
      console.log(chalk.red(`Error details: ${error}`));
      return DEFAULT_CONFIG;
    }
  }

  private mergeConfig(defaultConfig: BestLocatorConfig, userConfig: Partial<BestLocatorConfig>): BestLocatorConfig {
    return {
      ...defaultConfig,
      ...userConfig,
      timeouts: { ...defaultConfig.timeouts, ...userConfig.timeouts },
      selectorStrategy: { ...defaultConfig.selectorStrategy, ...userConfig.selectorStrategy },
      browser: { 
        ...defaultConfig.browser, 
        ...userConfig.browser,
        viewport: { ...defaultConfig.browser.viewport, ...userConfig.browser?.viewport }
      },
      output: { ...defaultConfig.output, ...userConfig.output },
      urls: { ...defaultConfig.urls, ...userConfig.urls },
      ai: { ...defaultConfig.ai, ...userConfig.ai } // ⭐ (Merge agregado)
    };
  }

  public getConfig(): BestLocatorConfig {
    return this.config;
  }

  public getFramework(): string {
    return this.config.defaultFramework;
  }

  public getLanguage(): string {
    return this.config.defaultLanguage;
  }

  public getUrl(alias: string): string | null {
    return this.config.urls[alias] || null;
  }

  public getTimeout(type: keyof BestLocatorConfig['timeouts']): number {
    return this.config.timeouts[type];
  }

  public hasConfigFile(): boolean {
    return !!this.configPath;
  }

  public createSampleConfig(): void {
    const sampleConfig = `// best-locator.config.js
module.exports = {
  // Framework por defecto
  defaultFramework: 'playwright', // 'playwright' | 'cypress' | 'selenium'
  
  // Lenguaje por defecto
  defaultLanguage: 'typescript', // 'typescript' | 'javascript' | 'python'
  
  // Timeouts personalizados (en milisegundos)
  timeouts: {
    pageLoad: 30000,        // Tiempo para cargar página
    elementSelection: 60000, // Tiempo para seleccionar elementos
    validation: 15000       // Tiempo para validar selectores
  },
  
  // Estrategia de selectores (1 = prioridad más alta)
  selectorStrategy: {
    testAttributes: 1,      // data-testid, data-cy, data-test
    ids: 2,                 // #unique-id
    semanticAttributes: 3,  // name, role, aria-label
    textContent: 4,         // text="Button Text"
    cssClasses: 5          // .my-class
  },
  
  // Atributos específicos de tu proyecto
  projectAttributes: [
    'data-testid',
    'data-cy', 
    'data-test',
    'data-qa',              // Agrega tus atributos custom
    'data-automation'
  ],
  
  // Configuración del navegador
  browser: {
    headless: false,        // true para CI/CD
    viewport: {
      width: 1280,          // Ancho personalizado
      height: 720           // Alto personalizado
    },
    userAgent: undefined    // Custom user agent si necesitas
  },
  
  // Configuración de output
  output: {
    format: 'string',       // 'string' | 'object' | 'json'
    includeConfidence: true, // Mostrar porcentaje de confianza
    includeXPath: false,    // Incluir XPath alternativo
    autoSave: undefined     // './selectors' para auto-guardar
  },
  
  // URLs frecuentes del proyecto
  urls: {
    local: 'http://localhost:3000',
    dev: 'https://dev.myapp.com',
    staging: 'https://staging.myapp.com',
    prod: 'https://myapp.com'
  },

  // Configuración de IA (ejemplo)
  ai: {
    enabled: true,
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 500
  }
};`;

    const targetPath = path.resolve(process.cwd(), 'best-locator.config.js');
    fs.writeFileSync(targetPath, sampleConfig);
    console.log(chalk.green(`✅ Sample configuration created: ${targetPath}`));
    console.log(chalk.blue('📝 Edit the file to customize Best-Locator for your project'));
  }
}
