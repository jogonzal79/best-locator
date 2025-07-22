// src/types/index.ts

import { BestLocatorConfig as Config } from '../core/config-manager.js';

// Exportamos la configuración principal para usarla en todo el proyecto
export type BestLocatorConfig = Config;

/** Información básica de un elemento HTML seleccionado por el usuario. */
export interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  attributes: { [key: string]: string };
  depth?: number;
  position?: number;
  order?: number;
}

/** Contexto de la página en el momento de la selección. */
export interface PageContext {
  url: string;
  title: string;
  pageType?: string;
}

/** Resultado de la generación de un selector. */
export interface SelectorResult {
  selector: string;
  confidence: number;
  type: string;
  aiEnhanced?: boolean;
  reasoning?: string;
  framework_optimized?: boolean;
}

/** Opciones comunes pasadas a los manejadores de comandos. */
export interface CommandOptions {
  ai?: boolean;
  explain?: boolean;
  noFallback?: boolean;
  framework?: string;
  language?: string;
}

/** Resultado de una validación de selector. */
export interface ValidationResult {
  status: 'passed' | 'failed' | 'warning';
  elementCount: number;
  message?: string;
  details?: {
    tag?: string;
    text?: string;
    isVisible?: boolean;
    isClickable?: boolean;
    attributes?: { [key: string]: string };
  };
  suggestions?: string[];
}