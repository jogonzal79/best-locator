import { BrowserManager } from '../../app/browser-manager.js';
import { logger } from '../../app/logger.js';
import { BestLocatorConfig, PageContext } from '../../types/index.js';
import { Page } from 'playwright';
import { ConfigManager } from '../../core/config-manager.js';

export interface BrowserSession {
  page: Page;
  config: BestLocatorConfig;
  pageContext: PageContext;
  browserManager: BrowserManager;
}

export async function withBrowserSession<T>(
  url: string,
  operation: (session: BrowserSession) => Promise<T>
): Promise<T | undefined> {

  const configManager = new ConfigManager();
  const config = await configManager.getConfig();
  const resolvedUrl = configManager.getUrl(url) || url;
  const browserManager = new BrowserManager(config);

  try {
    const page = await browserManager.launchAndNavigate(resolvedUrl);
    const pageContext = await browserManager.getPageContext();

    const session: BrowserSession = { page, config, pageContext, browserManager };

    return await operation(session);

  } catch (error: any) {
    if (error.name !== 'TimeoutError') { // El timeout lo maneja el llamador
      logger.error('An unexpected error occurred during the browser session:', error);
    }
    return undefined;
  } finally {
    await browserManager.close();
  }
}