// Archivo: src/app/device-manager.ts

import { remote } from 'webdriverio';
import { BestLocatorConfig, MobileElementInfo } from '../types/index.js';
import { logger } from './logger.js';
import path from 'path';

export class DeviceManager {
  private driver: WebdriverIO.Browser | null = null;
  private config: BestLocatorConfig;
  private platform: 'ios' | 'android';

  constructor(config: BestLocatorConfig, platform: 'ios' | 'android') {
    this.config = config;
    this.platform = platform;
  }

  public async connectAndLaunch(appPath: string): Promise<WebdriverIO.Browser> {
    logger.info('Connecting to Appium server...');
    const capabilities = this.buildCapabilities(appPath);

    try {
      this.driver = await remote({
        port: parseInt(new URL(this.config.appium.serverUrl).port, 10),
        capabilities
      });
      logger.success(`Connected to ${this.platform} device and launched app!`);
      return this.driver;
    } catch (error: any) {
      logger.error('Failed to connect to Appium server.', error);
      throw error;
    }
  }

  public async getPageSource(): Promise<string> {
    if (!this.driver) throw new Error('Driver not initialized');
    return await this.driver.getPageSource();
  }

  public async takeScreenshot(): Promise<string> {
    if (!this.driver) throw new Error('Driver not initialized');
    return await this.driver.takeScreenshot();
  }

  public async getAllElements(): Promise<MobileElementInfo[]> {
    if (!this.driver) throw new Error('Driver not initialized');

    const elements = await this.driver.$$('//*');
    const elementInfos: MobileElementInfo[] = [];
    
    // CORRECCIÓN 1: Se usa un bucle for...of para evitar el error con .length
    let i = 0;
    for (const el of elements) {
      // CORRECCIÓN 2: Se usa una doble aserción para forzar el tipo correcto.
      const element = el as unknown as WebdriverIO.Element;
      try {
        const rect = await element.getLocation();
        const size = await element.getSize();
        const text = await element.getText().catch(() => '');
        const attributes = await this.getElementAttributes(element);

        elementInfos.push({
          tagName: attributes.class || 'unknown',
          text: text.trim(),
          accessibilityId: attributes['accessibility-id'],
          resourceId: attributes['resource-id'],
          className: attributes.class,
          bounds: {
            x: rect.x,
            y: rect.y,
            width: size.width,
            height: size.height
          },
          attributes,
          visible: true,
          enabled: await element.isEnabled(),
          index: i
        });
      } catch (error) {
        // Ignorar elementos que no se pueden procesar
      }
      i++;
    }
    return elementInfos;
  }

  private buildCapabilities(appPath: string) {
    const baseCapabilities = this.config.appium.capabilities[this.platform];
    const isLocalFile = appPath.includes('.app') || appPath.includes('.apk');
    const isBundleId = appPath.includes('.');

    if (this.platform === 'ios') {
      return {
        ...baseCapabilities,
        ...(isLocalFile && { 'appium:app': path.resolve(appPath) }),
        ...(isBundleId && !isLocalFile && { 'appium:bundleId': appPath }),
      };
    } else { // android
      return {
        ...baseCapabilities,
        ...(isLocalFile && { 'appium:app': path.resolve(appPath) }),
        ...(isBundleId && !isLocalFile && { 
            'appium:appPackage': appPath,
            'appium:appActivity': 'MainActivity'
        }),
      };
    }
  }

  private async getElementAttributes(element: WebdriverIO.Element): Promise<Record<string, string>> {
    const attributes: Record<string, string> = {};
    try {
      const commonAttrs = ['class', 'text', 'content-desc', 'resource-id', 'accessibility-id'];
      for (const attr of commonAttrs) {
        try {
          const value = await element.getAttribute(attr);
          if (value) attributes[attr] = value;
        } catch {
          // Ignorar atributos no disponibles
        }
      }
    } catch (error) {
      // Ignorar errores de atributos
    }
    return attributes;
  }

  public getDriver(): WebdriverIO.Browser {
    if (!this.driver) {
      throw new Error('Driver is not initialized. Call connectAndLaunch first.');
    }
    return this.driver;
  }

  public async close(): Promise<void> {
    if (this.driver) {
      await this.driver.deleteSession();
      this.driver = null;
    }
  }
}