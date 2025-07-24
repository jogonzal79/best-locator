import { ConfigManager } from '../core/config-manager.js';
import { SelectorGenerator } from '../core/selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import { BrowserManager } from '../app/browser-manager.js';
import { logger } from '../app/logger.js';
import { CommandOptions, ElementInfo, PageContext, SelectorResult, BestLocatorConfig } from '../types/index.js';
import { AIEngine } from '../core/ai-engine.js';

async function generateSelector(generator: SelectorGenerator, elementInfo: ElementInfo, pageContext: PageContext, options: CommandOptions, config: BestLocatorConfig): Promise<SelectorResult> {
    const useAI = options.ai && config.ai?.enabled;
    if (useAI) {
        try {
            logger.info('🧠 Running AI analysis...');
            return await generator.generateSelectorWithAI(elementInfo, pageContext);
        } catch (err) {
            logger.warning('⚠️ AI failed, falling back to traditional method.');
        }
    }
    return generator.generateSelector(elementInfo);
}

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
        
        if (elementInfo) {
          // Limpiamos el atributo 'style' para que la IA no se confunda con el resaltado
          delete elementInfo.attributes.style;
        }

        if (!elementInfo) {
            logger.warning('\n🚪 Selection cancelled by user.');
            return;
        }

        logger.success('\n🎯 Element selected!');
        logger.log(`   Tag: ${elementInfo.tagName}`);

        if (options.ai) {
            await browserManager.showAwaitingOverlay('🧠 AI Processing...', 'Generating smart selector');
        }

        const generator = new SelectorGenerator(config);
        const pageContext = await browserManager.getPageContext();
        const selectorResult = await generateSelector(generator, elementInfo, pageContext, options, config);

        logger.nl();
        logger.info('🎯 Best Selector:');
        logger.selector(selectorResult.selector);

        if (config.output.includeConfidence && selectorResult.confidence) {
            logger.log(`   Confidence: ${selectorResult.confidence}%`);
        }

        if (options.ai && options.explain && config.ai.enabled) {
            logger.info('🧠 Generating AI explanation...');
            const aiEngine = new AIEngine(config);
            const explanation = await aiEngine.explainSelector(selectorResult.selector, elementInfo);
            logger.nl();
            logger.info('💡 AI Explanation:');
            logger.log(`   ${explanation}`);
        }

        logger.nl();
        logger.info('🧩 Code Snippet:');
        const formatter = new FrameworkFormatter();
        const finalFramework = framework || config.defaultFramework;
        const finalLanguage = language || config.defaultLanguage;
        const formattedCode = formatter.format(selectorResult.selector, finalFramework, finalLanguage);
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