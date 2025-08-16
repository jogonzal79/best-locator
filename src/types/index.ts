// Archivo: src/types/index.ts

// ✅ Tipos de Appium (tu archivo existente)
import { AppiumConfig } from './mobile.js';

// =========================
// AI / Configuración general
// =========================

export type AIProvider = 'ollama' | 'openai' | 'disabled';

export interface AIOllamaConfig {
  host: string;
  model: string;
  temperature?: number;
  timeout?: number;
}

export interface AIOpenAIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  timeout?: number;
}

export interface AIFeatures {
  smartSelector: boolean;
  explainDecisions: boolean;
}

export interface AIFallback {
  onError: 'traditional' | 'throw';
}

export interface AIConfig {
  enabled: boolean;
  provider: AIProvider;

  /**
   * Modo seguro para i18n:
   * Cuando está activo, el motor prioriza señales no sensibles a idioma
   * (id, data-*, name) por sobre texto/placeholder.
   */
  i18nSafe?: boolean;

  ollama: AIOllamaConfig;
  openai: AIOpenAIConfig;

  features: AIFeatures;
  fallback: AIFallback;
}

// =========================
// Config principal
// =========================

export interface BestLocatorConfig {
  defaultFramework: 'playwright' | 'cypress' | 'selenium' | 'testcafe' | 'webdriverio';
  defaultLanguage: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp';

  timeouts: {
    pageLoad: number;
    elementSelection: number;
    validation: number;
  };

  /**
   * Lista de atributos preferidos del proyecto (prioridad alta).
   * Ej: data-testid, data-cy, etc.
   */
  projectAttributes: string[];

  browser: {
    headless: boolean;
    viewport: { width: number; height: number; };
    userAgent?: string;
  };

  output: {
    includeConfidence: boolean;
    includeXPath: boolean;
  };

  urls: Record<string, string>;

  // 👇 Ahora tipado completo, con i18nSafe opcional
  ai: AIConfig;

  // 👇 Appium integrado
  appium: AppiumConfig;
}

// =========================
// Datos de página / elemento
// =========================

export interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  attributes: { [key: string]: string };
  order?: number;
  computedRole?: string | null;
  accessibleName?: string | null;
  
  // 🔧 AGREGADAS: Propiedades para fallback strategies
  index?: number;        // Índice del elemento entre sus hermanos
  parentTag?: string;    // Tag del elemento padre
}

export interface PageContext {
  url: string;
  title: string;
}

// =========================
/**
 * Resultado de selección.
 * `type` es un union de los tipos que emitimos en los generators/formatters.
 * Si tu pipeline agrega alguno nuevo, puedes extender este union.
 */
// =========================
export type SelectorType =
  | 'css'
  | 'xpath'
  | 'test-id'
  | 'link-href'
  | 'text'
  | 'role'
  | 'id'
  | 'placeholder'
  | 'name'
  | 'relative';

export interface SelectorResult {
  selector: string;
  confidence: number;
  type: SelectorType | string; // mantenemos flexibilidad por retrocompatibilidad
  aiEnhanced?: boolean;
  reasoning?: string;
  code?: string;
  /**
   * hint opcional para algunos formatters (p.ej., Cypress/TestCafe con .withText())
   */
  tagName?: string;
}

// =========================
// Opciones de comandos CLI
// =========================

export interface CommandOptions {
  ai?: boolean;
  explain?: boolean;
  noFallback?: boolean;
  stack?: string;
}

// Re-exportar tipos móviles para fácil acceso en otras partes del proyecto
export * from './mobile.js';