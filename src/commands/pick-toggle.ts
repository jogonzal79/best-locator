// src/commands/pick-toggle.ts - VERSIÓN ROBUSTA QUE SOBREVIVE A NAVEGACIONES

import { CommandOptions } from '../types/index.js';
import { withBrowserSession } from './shared/browser-utils.js';
import { captureElements } from './shared/element-capture.js';
// +++ INICIO DE CAMBIOS +++
import { processAndOutput } from './shared/selector-processor.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
// --- FIN DE CAMBIOS ---
import { logger } from '../app/logger.js';

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
    
    // 2. Configurar auto-reinyección robusta
    await setupRobustAutoReinjection(page, browserManager);
    
    // 3. ⭐ POLLING ROBUSTO en lugar de waitForFunction simple
    await waitForSessionEndRobustly(page, session.config.timeouts.elementSelection);
    
    // 4. Capturar elementos finales
    const elements = await captureElementsFromAnySource(page);
    
    logger.nl();
    logger.success(`🎯 Sesión completada! ${elements.length} elementos capturados.`);
    
    // +++ INICIO DE CAMBIOS +++
    // 5. Crea los "especialistas" para la web
    const generator = new SelectorGenerator(session.config);
    const formatter = new FrameworkFormatter();

    // 6. Llama al orquestador central con las herramientas web
    await processAndOutput(elements, session, options, generator, formatter, framework, language);
    // --- FIN DE CAMBIOS ---
  });
}

/**
 * Configuración robusta que maneja navegaciones, recargas y cambios de contexto
 */
async function setupRobustAutoReinjection(page: any, browserManager: any): Promise<void> {
  let reinjectionCount = 0;
  
  // 1. Detectar cargas completas de página
  page.on('domcontentloaded', async () => {
    try {
      await page.waitForTimeout(1500); // Dar tiempo para estabilización
      await ensureToggleModeActive(page, browserManager, ++reinjectionCount);
    } catch (error) {
      logger.warning(`⚠️ Error en domcontentloaded: ${error.message}`);
    }
  });
  
  // 2. Detectar navegaciones (incluye SPAs)
  page.on('framenavigated', async (frame: any) => {
    if (frame === page.mainFrame()) {
      try {
        await page.waitForTimeout(1000);
        await ensureToggleModeActive(page, browserManager, ++reinjectionCount);
      } catch (error) {
        logger.warning(`⚠️ Error en framenavigated: ${error.message}`);
      }
    }
  });
}

/**
 * Asegurar que toggle mode esté activo, re-inyectando si es necesario
 */
async function ensureToggleModeActive(page: any, browserManager: any, attempt: number): Promise<void> {
  try {
    const currentUrl = await page.url();
    
    // Verificar si toggle mode está inicializado
    const toggleStatus = await page.evaluate(() => {
      return {
        initialized: typeof window.bestLocatorToggleInitialized !== 'undefined' && window.bestLocatorToggleInitialized === true,
        stateExists: typeof window.bestLocatorState !== 'undefined',
        sessionActive: window.bestLocatorState?.sessionActive ?? false
      };
    });
    
    if (!toggleStatus.initialized || !toggleStatus.stateExists) {
      logger.info(`🔄 Re-inyectando toggle mode (intento ${attempt}) en: ${currentUrl}`);
      
      // Re-inyectar el script
      await browserManager.runScriptInPage('toggle-mode.js');
      
      // Verificar que se inyectó correctamente
      const verified = await page.evaluate(() => window.bestLocatorToggleInitialized === true);
      
      if (verified) {
        logger.success('✅ Toggle mode restaurado exitosamente!');
      } else {
        logger.warning('⚠️ Fallo en la verificación de re-inyección');
      }
    }
  } catch (error) {
    logger.warning(`⚠️ Error asegurando toggle mode (intento ${attempt}): ${error.message}`);
  }
}

/**
 * Polling robusto que sobrevive a navegaciones y recargas
 */
async function waitForSessionEndRobustly(page: any, timeout: number): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 1000; // Verificar cada segundo
  
  logger.info('⏳ Esperando a que termines la sesión (presiona ESC)...');
  
  while (Date.now() - startTime < timeout) {
    try {
      // Verificar estado de la sesión de forma segura
      const sessionStatus = await page.evaluate(() => {
        // Si no existe el estado, asumir que la sesión sigue activa
        if (typeof window.bestLocatorState === 'undefined') {
          return { active: true, reason: 'state_undefined' };
        }
        
        // Si existe, verificar el flag
        return { 
          active: window.bestLocatorState.sessionActive !== false,
          reason: window.bestLocatorState.sessionActive === false ? 'user_ended' : 'still_active'
        };
      }).catch(() => {
        // Si hay error evaluando (página cerrada, etc.), continuar
        return { active: true, reason: 'evaluation_error' };
      });
      
      // Si el usuario terminó la sesión, salir del loop
      if (!sessionStatus.active && sessionStatus.reason === 'user_ended') {
        logger.success('🏁 Usuario terminó la sesión con ESC');
        break;
      }
      
      // Esperar antes del siguiente poll
      await page.waitForTimeout(pollInterval).catch(() => {
        // Si waitForTimeout falla (página cerrada), no hacer nada
      });
      
    } catch (error) {
      // Si hay cualquier error, esperar un poco y continuar
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  if (Date.now() - startTime >= timeout) {
    logger.warning('⏰ Timeout alcanzado - finalizando sesión automáticamente');
  }
}

/**
 * Capturar elementos de cualquier fuente disponible (memoria o sessionStorage)
 */
async function captureElementsFromAnySource(page: any): Promise<any[]> {
  try {
    // Intentar obtener de window.bestLocatorState primero
    const fromMemory = await page.evaluate(() => {
      return window.bestLocatorState?.selectedElements || null;
    }).catch(() => null);
    
    if (fromMemory && fromMemory.length > 0) {
      logger.info(`📦 Elementos recuperados de memoria: ${fromMemory.length}`);
      return sanitizeElements(fromMemory);
    }
    
    // Si no hay en memoria, intentar desde sessionStorage
    const fromStorage = await page.evaluate(() => {
      try {
        const stored = sessionStorage.getItem('bestLocatorToggleState');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.selectedElements || [];
        }
      } catch (e) {
        console.warn('Error leyendo sessionStorage:', e);
      }
      return [];
    }).catch(() => []);
    
    if (fromStorage.length > 0) {
      logger.info(`📦 Elementos recuperados de sessionStorage: ${fromStorage.length}`);
    }
    
    return sanitizeElements(fromStorage);
    
  } catch (error) {
    logger.warning(`⚠️ Error capturando elementos: ${error.message}`);
    return [];
  }
}

/**
 * 🛡️ Sanitizar elementos para asegurar tipos correctos
 */
function sanitizeElements(elements: any[]): any[] {
  if (!Array.isArray(elements)) return [];
  
  return elements.map((element, index) => ({
    tagName: String(element.tagName || 'div').toLowerCase(),
    id: String(element.id || ''),
    className: typeof element.className === 'string' ? element.className : '',
    textContent: String(element.textContent || ''),
    attributes: element.attributes && typeof element.attributes === 'object' ? element.attributes : {},
    order: element.order || (index + 1),
    computedRole: element.computedRole || null,
    accessibleName: element.accessibleName || null,
  }));
}