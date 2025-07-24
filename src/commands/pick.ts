import { ConfigManager } from '../core/config-manager.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { BrowserManager } from '../app/browser-manager.js';
import { logger } from '../app/logger.js';
import { CommandOptions, ElementInfo, PageContext, SelectorResult, BestLocatorConfig } from '../types/index.js';
import { AriaCalculator } from '../core/ai/aria-calculator.js';
import { AIEngine } from '../core/ai-engine.js';

export async function handlePickCommand(url: string, framework: string | undefined, language: string | undefined, options: CommandOptions): Promise<void> {
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();
    const resolvedUrl = configManager.getUrl(url) || url;
    const browserManager = new BrowserManager(config);

    try {
        const page = await browserManager.launchAndNavigate(resolvedUrl);
        await browserManager.runScriptInPage('single-picker.js');
        logger.nl();
        logger.info('🖱️ Click any element on the page to generate a selector.');
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
        const finalFramework = framework || config.defaultFramework;
        const finalLanguage = language || config.defaultLanguage;
        const formattedCode = formatter.format(selectorResult, finalFramework, finalLanguage);

        logger.nl();
        logger.info('🎯 Best Selector:');
        const displaySelector = selectorResult.selector.startsWith('text=') ? selectorResult.selector.substring(5) : selectorResult.selector;
        logger.selector(displaySelector);

        if (config.output.includeConfidence && selectorResult.confidence) {
            logger.log(`   Confidence: ${selectorResult.confidence}%`);
        }

        if (options.ai && options.explain && selectorResult.aiEnhanced) {
            const aiEngine = new AIEngine(config);
            const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo);
            logger.nl();
            logger.info('💡 AI Explanation:');
            logger.log(`   ${explanation}`);
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
            logger.error('An error occurred during the pick command:', error);
        }
    } finally {
        await browserManager.close();
    }
}