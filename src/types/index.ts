// Archivo: src/types/index.ts

import { AIConfig } from '../core/ai-config.js';
import { AppiumConfig } from './mobile.js'; // <-- 1. AÑADIR ESTA LÍNEA

export interface BestLocatorConfig {
  defaultFramework: 'playwright' | 'cypress' | 'selenium' | 'testcafe';
  defaultLanguage: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp';
  timeouts: { pageLoad: number; elementSelection: number; validation: number; };
  projectAttributes: string[];
  browser: { headless: boolean; viewport: { width: number; height: number; }; userAgent?: string; };
  output: { includeConfidence: boolean; includeXPath: boolean; };
  urls: Record<string, string>;
  ai: AIConfig['ai'];
  appium: AppiumConfig; // <-- 2. AÑADIR ESTA LÍNEA
}

export interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  attributes: { [key: string]: string };
  order?: number;
  computedRole?: string | null;
  accessibleName?: string | null;
}

export interface PageContext {
  url: string;
  title: string;
}

export interface SelectorResult {
  selector: string;
  confidence: number;
  type: string;
  aiEnhanced?: boolean;
  reasoning?: string;
  code?: string;
}

export interface CommandOptions {
  ai?: boolean;
  explain?: boolean;
  noFallback?: boolean;
}

// Re-exportar tipos móviles para fácil acceso en otras partes del proyecto
export * from './mobile.js'; // <-- 3. AÑADIR ESTA LÍNEA