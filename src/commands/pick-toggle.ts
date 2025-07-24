import { ConfigManager } from '../core/config-manager.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { BrowserManager } from '../app/browser-manager.js';
import { logger } from '../app/logger.js';
import { CommandOptions, ElementInfo, PageContext, SelectorResult, BestLocatorConfig } from '../types/index.js';
import { AriaCalculator } from '../core/ai/aria-calculator.js';

export async function handlePickToggleCommand(url: string, framework: string | undefined, language: string | undefined, options: CommandOptions): Promise<void> {
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();
    const resolvedUrl = configManager.getUrl(url) || url;
    const browserManager = new BrowserManager(config);

    try {
        const page = await browserManager.launchAndNavigate(resolvedUrl);
        await browserManager.runScriptInPage('toggle-mode.js');
        logger.nl();
        logger.info('🌐 Professional Toggle Mode Active! Press ESC when you are done.');
        
        await page.waitForFunction('window.bestLocatorState && window.bestLocatorState.sessionActive === false', null, { timeout: config.timeouts.elementSelection });
        
        const selectedElements: ElementInfo[] = await page.evaluate('window.bestLocatorState?.selectedElements || []');

        if (!selectedElements || selectedElements.length === 0) {
            logger.warning('\n⚠️ No elements were captured.');
            return;
        }

        const ariaCalculator = new AriaCalculator();
        selectedElements.forEach(el => {
            el.computedRole = ariaCalculator.computeRole(el);
            el.accessibleName = ariaCalculator.computeAccessibleName(el);
            delete el.attributes.style;
        });

        logger.success(`\n🎯 ${selectedElements.length} element(s) captured!`);
        
        if (options.ai) {
            await browserManager.showAwaitingOverlay('🧠 AI Processing...', `Analyzing ${selectedElements.length} elements`);
        }
        
        const generator = new SelectorGenerator(config);
        const formatter = new FrameworkFormatter();
        const pageContext = await browserManager.getPageContext();
        const finalFramework = framework || config.defaultFramework;
        const finalLanguage = language || config.defaultLanguage;
        
        const results: { order: number | undefined; code: string }[] = [];
        let clipboardText = '';

        for (const elementInfo of selectedElements) {
            logger.nl();
            logger.info(`🔄 Analyzing element ${elementInfo.order || 0}/${selectedElements.length}...`);
            
            let selectorResult: SelectorResult;
            if (options.ai && config.ai.enabled) {
                selectorResult = await generator.generateSelectorWithAI(elementInfo, pageContext);
            } else {
                selectorResult = generator.generateSelector(elementInfo);
            }
            
            const formattedCode = formatter.format(selectorResult, finalFramework, finalLanguage);
            
            results.push({ order: elementInfo.order, code: formattedCode });
            clipboardText += `${formattedCode}\n`;

            const displaySelector = selectorResult.selector.startsWith('text=') ? selectorResult.selector.substring(5) : selectorResult.selector;
            logger.info('   🎯 Selector:');
            logger.selector(`      ${displaySelector}`);
        }

        logger.nl();
        logger.success('✅ Toggle session complete!');
        logger.info('📦 Summary of generated code:');
        results.forEach(r => logger.log(`   [${r.order}] ${r.code}`));

        try {
            await page.evaluate(text => navigator.clipboard.writeText(text), clipboardText.trim());
            logger.nl();
            logger.success('✅ Summary copied to clipboard!');
        } catch {
            logger.warning('⚠️ Could not copy summary to clipboard.');
        }

    } catch (error: any) {
        if (error.name === 'TimeoutError') {
            logger.warning('\n🚪 Session finished or timed out.');
        } else {
            logger.error('An error occurred during the pick-toggle command:', error);
        }
    } finally {
        await browserManager.close();
    }
}