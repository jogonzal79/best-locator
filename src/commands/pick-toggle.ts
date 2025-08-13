// src/commands/pick-toggle.ts

import { CommandOptions } from '../types/index.js';
import { withBrowserSession } from './shared/browser-utils.js';
import { processAndOutput } from './shared/selector-processor.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { logger } from '../app/logger.js';
import { GeneratorFactory } from '../core/generators/factory.js';

export async function handlePickToggleCommand(
  url: string,
  framework: string | undefined,
  language: string | undefined,
  options: CommandOptions
): Promise<void> {
  
  await withBrowserSession(url, async (session) => {
    const { page, browserManager } = session;
    
    logger.info('🎛️ Toggle Mode with Navigation Persistence enabled!');
    logger.info('📍 Navigate freely between pages - state will persist');
    logger.nl();
    
    // 1. Inyectar script inicial
    await browserManager.runScriptInPage('toggle-mode.js');
    
    // 2. Esperar un momento para que el script se inicialice completamente
    await page.waitForTimeout(1000);
    
    // 3. Configurar auto-reinyección robusta
    await setupRobustAutoReinjection(page, browserManager);
    
    // 4. Esperar a que el usuario termine la sesión
    await waitForUserToFinishSession(page, session.config.timeouts.elementSelection);
    
    // 5. Capturar elementos finales con pequeño delay para asegurar que el estado se guardó
    await page.waitForTimeout(500);
    const elements = await captureElementsFromAllSources(page);
    
    if (elements.length > 0) {
      logger.nl();
      logger.success(`🎯 Sesión completada! ${elements.length} elementos capturados.`);
      
      // 6. Procesar y mostrar resultados (usando el patrón de los archivos de ejemplo)
      const generator = GeneratorFactory.create(
        framework || session.config.defaultFramework,
        session.config
      );
      const formatter = new FrameworkFormatter();
      await processAndOutput(elements, session, options, generator, formatter, framework, language);
    } else {
      logger.nl();
      logger.warning('🚪 No se capturaron elementos en esta sesión.');
    }
  });
}

/**
 * Configuración robusta que maneja navegaciones
 */
async function setupRobustAutoReinjection(page: any, browserManager: any): Promise<void> {
  let reinjectionCount = 0;
  let isReinjecting = false;
  
  const reinjectIfNeeded = async () => {
    if (isReinjecting) return;
    isReinjecting = true;
    
    try {
      await page.waitForTimeout(1000);
      await ensureToggleModeActive(page, browserManager, ++reinjectionCount);
    } catch (error) {
      if (!error.message?.includes('Target page, context or browser has been closed')) {
        logger.warning(`⚠️ Error en reinyección: ${error.message}`);
      }
    } finally {
      isReinjecting = false;
    }
  };
  
  page.on('domcontentloaded', reinjectIfNeeded);
  page.on('framenavigated', async (frame: any) => {
    if (frame === page.mainFrame()) {
      await reinjectIfNeeded();
    }
  });
}

/**
 * Asegurar que toggle mode esté activo
 */
async function ensureToggleModeActive(page: any, browserManager: any, attempt: number): Promise<void> {
  try {
    const pageActive = await page.evaluate(() => true).catch(() => false);
    if (!pageActive) return;
    
    const currentUrl = await page.url();
    
    const toggleStatus = await page.evaluate(() => {
      return {
        initialized: window.bestLocatorToggleInitialized === true,
        stateExists: typeof window.bestLocatorState !== 'undefined',
        sessionActive: window.bestLocatorState?.sessionActive ?? true,
        elementCount: window.bestLocatorState?.selectedElements?.length || 0
      };
    }).catch(() => ({ initialized: false, stateExists: false, sessionActive: true, elementCount: 0 }));
    
    if ((!toggleStatus.initialized || !toggleStatus.stateExists) && toggleStatus.sessionActive !== false) {
      logger.info(`🔄 Re-inyectando toggle mode (intento ${attempt}) en: ${currentUrl}`);
      await browserManager.runScriptInPage('toggle-mode.js');
      await page.waitForTimeout(500);
      
      const verified = await page.evaluate(() => window.bestLocatorToggleInitialized === true);
      if (verified) {
        logger.success('✅ Toggle mode restaurado exitosamente!');
      }
    }
  } catch (error) {
    if (!error.message?.includes('closed')) {
      logger.warning(`⚠️ Error en verificación: ${error.message}`);
    }
  }
}

/**
 * Esperar a que el usuario termine la sesión de forma más robusta
 */
async function waitForUserToFinishSession(page: any, timeout: number): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 500;
  let lastElementCount = 0;
  
  logger.info('⏳ Esperando a que termines la sesión (presiona ESC o el botón FINISH)...');
  
  while (Date.now() - startTime < timeout) {
    try {
      const status = await page.evaluate(() => {
        const state = window.bestLocatorState;
        const finishedFlag = sessionStorage.getItem('bestLocator:finished');
        
        return {
          sessionActive: state?.sessionActive ?? true,
          elementCount: state?.selectedElements?.length || 0,
          finishedFlag: !!finishedFlag,
        };
      }).catch(() => null);
      
      if (status === null) {
          await page.waitForTimeout(checkInterval);
          continue;
      }
      
      if (status.elementCount !== lastElementCount) {
        lastElementCount = status.elementCount;
        logger.info(`📦 Elementos capturados: ${lastElementCount}`);
      }
      
      if (!status.sessionActive || status.finishedFlag) {
        logger.success(`🏁 Sesión terminada (${status.elementCount} elementos capturados)`);
        await page.waitForTimeout(1000);
        return;
      }
      
      await page.waitForTimeout(checkInterval);
      
    } catch (error) {
      if (error.message?.includes('closed') || error.message?.includes('Target page')) {
        logger.warning('🚪 Browser o tab cerrado. Finalizando sesión.');
        return;
      }
      await new Promise(r => setTimeout(r, checkInterval));
    }
  }
  
  logger.warning('⏰ Timeout alcanzado - finalizando sesión');
  await page.evaluate(() => {
    try {
        if (window.bestLocatorState) window.bestLocatorState.sessionActive = false;
    } catch {}
  }).catch(() => {});
}

/**
 * Capturar elementos de todas las fuentes posibles
 */
async function captureElementsFromAllSources(page: any): Promise<any[]> {
  try {
    let elements = await page.evaluate(() => {
      try {
        const stored = sessionStorage.getItem('bestLocatorToggleState');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.selectedElements || null;
        }
      } catch {}
      return null;
    }).catch(() => null);
    
    if (elements && elements.length > 0) {
      logger.info(`📦 Elementos recuperados de sessionStorage: ${elements.length}`);
      return sanitizeElements(elements);
    }
    
    elements = await page.evaluate(() => {
      return window.bestLocatorState?.selectedElements || null;
    }).catch(() => null);
    
    if (elements && elements.length > 0) {
      logger.info(`📦 Elementos recuperados de memoria: ${elements.length}`);
      return sanitizeElements(elements);
    }
    
    elements = await page.evaluate(() => {
      try {
        const backup = localStorage.getItem('bestLocatorToggleState_backup');
        if (backup) {
          const parsed = JSON.parse(backup);
          return parsed.selectedElements || null;
        }
      } catch {}
      return null;
    }).catch(() => null);
    
    if (elements && elements.length > 0) {
      logger.info(`📦 Elementos recuperados de backup: ${elements.length}`);
      return sanitizeElements(elements);
    }
    
    elements = await page.evaluate(async () => {
      try {
        const openDB = (): Promise<any> => new Promise((resolve, reject) => {
          const request = indexedDB.open('BestLocatorDB', 2);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        const db = await openDB() as any;
        const tx = db.transaction(['sessions'], 'readonly');
        const store = tx.objectStore('sessions');
        
        return new Promise((resolve) => {
          const request = store.getAll();
          request.onsuccess = () => {
            const sessions = request.result;
            const recent = sessions
              .filter(s => Date.now() - s.timestamp < 3600000)
              .sort((a, b) => b.timestamp - a.timestamp)[0];
            
            resolve(recent?.state?.selectedElements || null);
          };
          request.onerror = () => resolve(null);
        });
      } catch {
        return null;
      }
    }).catch(() => null);
    
    if (elements && elements.length > 0) {
      logger.info(`📦 Elementos recuperados de IndexedDB: ${elements.length}`);
      return sanitizeElements(elements);
    }
    
    return [];
    
  } catch (error) {
    logger.warning(`⚠️ Error recuperando elementos: ${error.message}`);
    return [];
  }
}

/**
 * Sanitizar elementos para asegurar estructura correcta
 */
function sanitizeElements(elements: any[]): any[] {
  if (!Array.isArray(elements)) return [];
  
  return elements
    .filter(el => el && typeof el === 'object')
    .map((element, index) => ({
      tagName: String(element.tagName || 'div').toLowerCase(),
      id: String(element.id || ''),
      className: typeof element.className === 'string' ? element.className : '',
      textContent: String(element.textContent || '').substring(0, 500),
      attributes: element.attributes && typeof element.attributes === 'object' ? element.attributes : {},
      order: element.order || (index + 1),
      computedRole: element.computedRole || null,
      accessibleName: element.accessibleName || null,
      cssPath: element.cssPath || '',
      xPath: element.xPath || '',
      context: element.context || 'main-document',
      url: element.url || '',
      timestamp: element.timestamp || Date.now()
    }));
}