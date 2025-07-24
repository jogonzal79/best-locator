import { ConfigManager } from '../core/config-manager.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { BrowserManager } from '../app/browser-manager.js';
import { logger } from '../app/logger.js';
import { CommandOptions, ElementInfo, PageContext, SelectorResult, BestLocatorConfig } from '../types/index.js';

async function generateSelector(generator: SelectorGenerator, elementInfo: ElementInfo, pageContext: PageContext, options: CommandOptions, config: BestLocatorConfig): Promise<SelectorResult> {
    const useAI = options.ai && config.ai?.enabled;
    if (useAI) { return await generator.generateSelectorWithAI(elementInfo, pageContext); }
    return generator.generateSelector(elementInfo);
}

export async function handlePickMultipleCommand(url: string, framework: string | undefined, language: string | undefined, options: CommandOptions): Promise<void> {
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();
    const resolvedUrl = configManager.getUrl(url) || url;
    const browserManager = new BrowserManager(config);

    try {
        const page = await browserManager.launchAndNavigate(resolvedUrl);
        await browserManager.runScriptInPage('multi-picker.js');
        logger.nl();
        logger.info('🔢 Multiple Selection Mode... Press ESC when you are done selecting elements.');

        await page.waitForFunction('window.multipleSelectionDone === true', null, { timeout: config.timeouts.elementSelection });
        
        const selectedElements: ElementInfo[] = await page.evaluate('window.selectedElementsInfo');

        if (!selectedElements || selectedElements.length === 0) {
            logger.warning('\n⚠️ No elements were selected.');
            return;
        }
        
        // Limpiamos el atributo 'style' de cada elemento antes de procesarlos
        selectedElements.forEach(el => delete el.attributes.style);

        logger.success(`\n🎯 ${selectedElements.length} element(s) selected!`);
        
        if (options.ai) {
            await browserManager.showAwaitingOverlay('🧠 AI Processing...', `Analyzing ${selectedElements.length} elements`);
        }
        
        const generator = new SelectorGenerator(config);
        const formatter = new FrameworkFormatter();
        const pageContext = await browserManager.getPageContext();
        const finalFramework = framework || config.defaultFramework;
        const finalLanguage = language || config.defaultLanguage;
        
        const results: { order: number | undefined; selector: string; code: string }[] = [];
        let clipboardText = '';

        for (const elementInfo of selectedElements) {
            logger.nl();
            logger.info(`🔄 Analyzing element ${elementInfo.order || 0}/${selectedElements.length}...`);
            const selectorResult = await generateSelector(generator, elementInfo, pageContext, options, config);
            const formattedCode = formatter.format(selectorResult.selector, finalFramework, finalLanguage);
            
            results.push({ order: elementInfo.order, selector: selectorResult.selector, code: formattedCode });
            clipboardText += `${formattedCode}\n`;

            logger.info('   🎯 Selector:');
            logger.selector(`      ${selectorResult.selector}`);
            if (config.output.includeConfidence && selectorResult.confidence) {
                logger.log(`      Confidence: ${selectorResult.confidence}%`);
            }
        }

        logger.nl();
        logger.success('✅ All elements processed successfully!');
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
            logger.error('An error occurred during the pick-multiple command:', error);
        }
    } finally {
        await browserManager.close();
    }
}