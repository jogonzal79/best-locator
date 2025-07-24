// best-locator.config.js

/** @type {import('./dist/types').BestLocatorConfig} */
export default {
  /**
   * Framework de prueba por defecto.
   * Opciones: 'playwright', 'cypress', 'selenium'
   */
  defaultFramework: 'playwright',

  /**
   * Lenguaje de programación por defecto.
   * Opciones: 'typescript', 'javascript', 'python', 'java', 'c#'
   */
  defaultLanguage: 'typescript',

  /**
   * Atributos HTML que tu proyecto utiliza para identificar elementos de prueba.
   * Se buscarán en este orden de prioridad.
   */
  projectAttributes: [
    'data-testid',
    'data-cy',
    'data-test',
    'data-qa'
  ],

  /**
   * Atajos para URLs que usas frecuentemente.
   * Puedes usarlos con el comando `bestlocator go <alias>`.
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
  // SECCIÓN DE INTELIGENCIA ARTIFICIAL (NUEVA ESTRUCTURA)
  // ======================================================
  ai: {
    /**
     * Activa o desactiva globalmente las funciones de IA.
     */
    enabled: true,

    /**
     * Elige el proveedor de IA que quieres usar.
     * Opciones: 'ollama', 'openai'
     */
    provider: 'openai',

    /**
     * Configuración para Ollama (uso local).
     */
    ollama: {
      host: 'http://localhost:11434',
      model: 'llama3.1:8b',
      timeout: 60000,
      temperature: 0.3
    },

    /**
     * Configuración para OpenAI (uso con API Key).
     */
    openai: {
      // Se recomienda usar una variable de entorno: OPENAI_API_KEY
      apiKey: process.env.OPENAI_API_KEY || '', 
      model: 'gpt-4o',
      timeout: 20000,
      temperature: 0.1,
    },

    /**
     * Configuración de características de IA.
     */
    features: {
      smartSelector: true,
      explainDecisions: true,
    },

    /**
     * Define qué hacer si la IA falla.
     * 'traditional' usará el método de fallback. 'fail' detendrá la ejecución.
     */
    fallback: {
      onError: 'traditional'
    }
  }
};