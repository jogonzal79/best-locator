import { BrowserSession } from './browser-utils.js';
import { ElementInfo } from '../../types/index.js';
import { logger } from '../../app/logger.js';

export type CaptureType = 'single' | 'multiple' | 'toggle';

const scriptMap: Record<CaptureType, string> = {
  single: 'single-picker.js', multiple: 'multi-picker.js', toggle: 'toggle-mode.js'
};
const completionFlagMap: Record<CaptureType, string> = {
  single: 'window.elementSelected === true',
  multiple: 'window.multipleSelectionDone === true',
  toggle: 'window.bestLocatorState && window.bestLocatorState.sessionActive === false'
};
const resultVariableMap: Record<CaptureType, string> = {
  single: 'window.selectedElementInfo',
  multiple: 'window.selectedElementsInfo',
  toggle: 'window.bestLocatorState?.selectedElements || []'
};

export async function captureElements(session: BrowserSession, type: CaptureType): Promise<ElementInfo[]> {
  const { page, config, browserManager } = session;

  await browserManager.runScriptInPage(scriptMap[type]);
  showUserInstructions(type);

  await page.waitForFunction(completionFlagMap[type], null, { timeout: config.timeouts.elementSelection });
  const result: ElementInfo | ElementInfo[] | null = await page.evaluate(resultVariableMap[type]);

  if (!result) return [];
  return Array.isArray(result) ? result : [result];
}

function showUserInstructions(type: CaptureType): void {
  logger.nl();
  if (type === 'single') logger.info('🖱️ Click any element on the page to generate a selector.');
  if (type === 'multiple') logger.info('🔢 Multiple Selection Mode... Press ESC when you are done selecting elements.');
  if (type === 'toggle') logger.info('🌐 Professional Toggle Mode Active! Press ESC when you are done.');
}