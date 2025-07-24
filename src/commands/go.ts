import { ConfigManager } from '../core/config-manager.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { BrowserManager } from '../app/browser-manager.js';
import { logger } from '../app/logger.js';
import { CommandOptions, ElementInfo, PageContext, SelectorResult, BestLocatorConfig } from '../types/index.js';
import { AriaCalculator } from '../core/ai/aria-calculator.js';

export async function handleGoCommand(alias: string, options: CommandOptions): Promise<void> {
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();
    const resolvedUrl = configManager.getUrl(alias);

    if (!resolvedUrl) {
        logger.error(`❌ Alias "${alias}" not found in configuration.`);
        return;
    }

    logger.info(`🚀 Opening alias "${alias}" → ${resolvedUrl}`);
    const browserManager = new BrowserManager(config);

    try {
        const page = await browserManager.launchAndNavigate(resolvedUrl);
        await browserManager.runScriptInPage('single-picker.js');
        logger.nl();
        logger.info('🖱️  Click an element to generate a selector (alias mode).');
        logger.log('   Press ESC to cancel.');

        await page.waitForFunction('window.elementSelected === true', null, { timeout: config.timeouts.elementSelection });
        const elementInfo: ElementInfo | null = await page.evaluate('window.selectedElementInfo');

        if (!elementInfo) {
            logger.warning('\n🚪 Selection cancelled by user.');
            return;
        }

        const ariaCalculator = new AriaCalculator();
        elementInfo.computedRole = ariaCalculator.computeRole(elementInfo);
        elementInfo.accessibleName = ariaCalculator.computeAccessibleName(elementInfo);
        delete elementInfo.attributes.style;

        logger.success('\n🎯 Element selected!');

        if (options.ai) {
            await browserManager.showAwaitingOverlay('🧠 AI Processing...', 'Generating smart selector');
        }

        const generator = new SelectorGenerator(config);
        const pageContext = await browserManager.getPageContext();
        let selectorResult: SelectorResult;

        if (options.ai && config.ai.enabled) {
            selectorResult = await generator.generateSelectorWithAI(elementInfo, pageContext);
        } else {
            selectorResult = generator.generateSelector(elementInfo);
        }

        const formatter = new FrameworkFormatter();
        const finalFramework = config.defaultFramework;
        const finalLanguage = config.defaultLanguage;
        
        const formattedCode = formatter.format(selectorResult, finalFramework, finalLanguage);

        logger.nl();
        logger.info('🎯 Best Selector:');
        const displaySelector = selectorResult.selector.startsWith('text=') ? selectorResult.selector.substring(5) : selectorResult.selector;
        logger.selector(displaySelector);
        
        if (config.output.includeConfidence && selectorResult.confidence !== undefined) {
            logger.log(`   Confidence: ${selectorResult.confidence}%`);
        }

        logger.nl();
        logger.info('🧩 Code Snippet:');
        logger.code(formattedCode);
        
        try {
            await page.evaluate(code => navigator.clipboard.writeText(code), formattedCode);
            logger.success('✅ Copied to clipboard!');
        } catch {
            logger.warning('⚠️ Could not copy to clipboard.');
        }

    } catch (error: any) {
        if (error.name === 'TimeoutError') {
            logger.warning('\n🚪 Selection timed out.');
        } else {
            logger.error('An error occurred during the go command:', error);
        }
    } finally {
        await browserManager.close();
    }
}