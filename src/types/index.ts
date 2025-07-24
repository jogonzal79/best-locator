export interface BestLocatorConfig {
  defaultFramework: 'playwright' | 'cypress' | 'selenium' | 'testcafe';
  defaultLanguage: 'typescript' | 'javascript' | 'python' | 'java' | 'c#';
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
  ai: any;
}

export interface CommandOptions {
  ai?: boolean;
  explain?: boolean;
  noFallback?: boolean;
}

export interface SelectorResult {
  selector: string;
  confidence: number;
  type: string;
  reasoning: string;
  aiEnhanced?: boolean;
  code?: string;
}

export interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  attributes: { [key: string]: string };
  order?: number;
}

export interface PageContext {
  url: string;
  title: string;
}

export interface AIEnhancedResult {
  selector: string;
  confidence: number;
  type: string;
  aiEnhanced: boolean;
}