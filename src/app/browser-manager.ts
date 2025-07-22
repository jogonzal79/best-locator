// src/app/browser-manager.ts
import { chromium, Browser, Page } from 'playwright';
import { BestLocatorConfig } from '../types/index.js';
import { logger } from './logger.js';
import fs from 'fs/promises';
import path from 'path';
// ================== INICIO DE LA CORRECCIÓN ==================
// Importamos las herramientas necesarias para resolver la ruta del paquete
import { fileURLToPath } from 'url';
// =================== FIN DE LA CORRECCIÓN ====================

export class BrowserManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: BestLocatorConfig;

  constructor(config: BestLocatorConfig) {
    this.config = config;
  }

  public async launchAndNavigate(url: string): Promise<Page> {
    logger.info(`🚀 Opening ${url}...`);
    try {
      this.browser = await chromium.launch({
        headless: this.config.browser.headless,
        args: ['--disable-blink-features=AutomationControlled'],
      });
      logger.success('✅ Browser launched successfully!');

      const context = await this.browser.newContext({
        viewport: this.config.browser.viewport,
      });
      this.page = await context.newPage();
      this.page.setDefaultTimeout(0);

      await this.page.goto(url, { timeout: this.config.timeouts.pageLoad });
      logger.success('✅ Page loaded successfully!');
      
      return this.page;

    } catch (error: any) {
      logger.error('Failed to launch browser or navigate.', error);
      await this.close();
      throw error;
    }
  }

  public getPage(): Page {
    if (!this.page) {
      throw new Error('Page is not initialized. Call launchAndNavigate first.');
    }
    return this.page;
  }

  public async getPageContext(): Promise<{ url: string; title: string; pageType: string }> {
      if (!this.page) throw new Error('Page not available');
      return {
          url: await this.page.url(),
          title: await this.page.title(),
          pageType: 'webapp',
      };
  }

  /**
   * Ejecuta un script en el contexto de la página ya cargada.
   * AHORA busca el script relativo a la ubicación de instalación del paquete.
   */
  public async runScriptInPage(scriptName: string): Promise<void> {
    if (!this.page) {
        throw new Error('Page not available to run script.');
    }
    try {
        // ================== INICIO DE LA CORRECCIÓN ==================
        // Obtenemos la ruta del directorio del archivo actual (__dirname)
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        
        // Construimos la ruta al script relativa a este archivo.
        // Desde 'dist/app/' subimos un nivel a 'dist/' y luego entramos a 'injected-scripts/'
        const scriptPath = path.join(__dirname, '..', 'injected-scripts', scriptName);
        // =================== FIN DE LA CORRECCIÓN ====================
        
        const scriptContent = await fs.readFile(scriptPath, 'utf-8');
        await this.page.evaluate(scriptContent);

    } catch (error: any) {
        logger.error(`Failed to read or run script: ${scriptName}`, error);
        throw error;
    }
  }

  public async showAwaitingOverlay(message: string, subMessage: string): Promise<void> {
    // ... (este método no necesita cambios)
    if (!this.page) return;
    const overlayHtml = `
      <div style="font-size: 18px; margin-bottom: 10px;">${message}</div>
      <div style="font-size: 14px;">${subMessage}</div>
      <div style="font-size: 12px; color: #ccc; margin-top:10px;">Keep this window open...</div>
    `;
    await this.page.evaluate((html) => {
      const overlay = document.createElement('div');
      overlay.innerHTML = html;
      overlay.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(30, 60, 114, 0.95); color: white; padding: 20px 30px;
        border-radius: 10px; font-family: monospace; text-align: center;
        z-index: 999999; box-shadow: 0 8px 20px rgba(0,0,0,0.5);
        border: 2px solid #4CAF50;
      `;
      document.body.appendChild(overlay);
    }, overlayHtml);
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
