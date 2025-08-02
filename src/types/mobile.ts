// Archivo: src/types/mobile.ts

export interface AppiumCapabilities {
  platformName: string;
  // CORRECCIÓN: Se añaden los prefijos 'appium:' a las claves
  // y se marcan como opcionales con '?' para mayor flexibilidad.
  'appium:platformVersion'?: string;
  'appium:deviceName'?: string;
  'appium:app'?: string;
  'appium:bundleId'?: string;
  'appium:appPackage'?: string;
  'appium:appActivity'?: string;
  'appium:automationName'?: string;
  'appium:udid'?: string;
  'appium:newCommandTimeout'?: number;
}

export interface MobileElementInfo {
  tagName: string;
  text: string;
  accessibilityId?: string;
  resourceId?: string;
  className?: string;
  xpath?: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes: Record<string, string>;
  visible: boolean;
  enabled: boolean;
  index?: number;
}

export interface AppiumConfig {
  enabled: boolean;
  serverUrl: string;
  capabilities: {
    ios: AppiumCapabilities;
    android: AppiumCapabilities;
  };
  defaultPlatform: 'ios' | 'android';
  inspector: {
    enabled: boolean;
    port: number;
  };
  presets?: Record<string, {
    platform: 'ios' | 'android';
    app?: string;
    bundleId?: string;
    appPackage?: string;
    capabilities?: Partial<AppiumCapabilities>;
  }>;
}