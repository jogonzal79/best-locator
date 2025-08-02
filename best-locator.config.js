// best-locator.config.js

/** @type {import('./dist/types').BestLocatorConfig} */
export default {
  /**
   * Framework de prueba por defecto.
   */
  defaultFramework: 'playwright',

  /**
   * Lenguaje de programación por defecto.
   */
  defaultLanguage: 'typescript',

  /**
   * Atributos HTML que tu proyecto utiliza para identificar elementos de prueba.
   */
  projectAttributes: [
    'data-testid',
    'data-cy',
    'data-test',
    'data-qa'
  ],

  /**
   * Atajos para URLs que usas frecuentemente.
   */
  urls: {
    local: 'http://localhost:3000',
    google: 'https://www.google.com',
    github: 'https://github.com',
    staging: 'https://staging.myapp.com'
  },

  /**
   * Configuración del navegador controlado por Playwright.
   */
  browser: {
    headless: false,
    viewport: {
      width: 1280,
      height: 720
    }
  },

  /**
   * Configuración de la salida en la consola.
   */
  output: {
    includeConfidence: true,
    includeXPath: false
  },

  /**
   * Tiempos de espera para diferentes operaciones.
   */
  timeouts: {
    pageLoad: 30000,
    elementSelection: 60000,
    validation: 15000
  },

  // ======================================================
  // SECCIÓN DE APPIUM (CORREGIDA)
  // ======================================================
  appium: {
    enabled: true,
    capabilities: {
      android: {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        // Pega el número de serie de tu teléfono aquí
        'appium:udid': 'Power51280021852',
        // IMPORTANTE: Asegúrate de que esta versión coincida con la de tu teléfono real
        'appium:platformVersion': '11', // O la versión que tenga tu teléfono
        'appium:newCommandTimeout': 600, // Tiempo en segundos (10 minutos)
        'appium:appActivity': 'com.duckduckgo.app.browser.BrowserActivity'
      }
    }
  },

  // ======================================================
  // SECCIÓN DE INTELIGENCIA ARTIFICIAL
  // ======================================================
  ai: {
    enabled: true,
    provider: 'openai',
    ollama: {
      host: 'http://localhost:11434',
      model: 'llama3.1:8b',
      timeout: 60000,
      temperature: 0.3
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '', 
      model: 'gpt-4o',
      timeout: 20000,
      temperature: 0.1,
    },
    features: {
      smartSelector: true,
      explainDecisions: true,
    },
    fallback: {
      onError: 'traditional'
    }
  }
};