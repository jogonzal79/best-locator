import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

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
}

const DEFAULT_CONFIG: BestLocatorConfig = {
  defaultFramework: 'playwright',
  defaultLanguage: 'typescript',
  timeouts: {
    pageLoad: 30000,
    elementSelection: 60000,
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
      width: 1920,
      height: 1080
    }
  },
  output: {
    format: 'string',
    includeConfidence: true,
    includeXPath: false
  },
  urls: {}
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

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    return '';
  }

 private loadConfig(): BestLocatorConfig {
   if (!this.configPath) {
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




      // Merge con configuración por defecto
      return this.mergeConfig(DEFAULT_CONFIG, userConfig);
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Error loading config file: ${this.configPath}`));
      console.log(chalk.yellow(`Using default configuration`));
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
      urls: { ...defaultConfig.urls, ...userConfig.urls }
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
      width: 1920,
      height: 1080
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
  }
};`;

    fs.writeFileSync('best-locator.config.js', sampleConfig);
    console.log(chalk.green('✅ Sample configuration created: best-locator.config.js'));
    console.log(chalk.blue('📝 Edit the file to customize Best-Locator for your project'));
  }
}