// Archivo: src/app/mobile-inspector.ts

import express from 'express';
import { Server } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { DeviceManager } from './device-manager.js';
import { BestLocatorConfig, MobileElementInfo } from '../types/index.js';
import { logger } from './logger.js';
import { MobileSelectorGenerator } from '../core/mobile-selector-generator.js';
import { FrameworkFormatter } from '../core/framework-formatter.js';
import clipboardy from 'clipboardy';
import open from 'open'; // <-- ESTA ES LA LÍNEA QUE FALTABA

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class MobileInspector {
  private app: express.Application;
  private server: Server | null = null;
  private selectedElements: MobileElementInfo[] = [];

  constructor(
    private deviceManager: DeviceManager,
    private config: BestLocatorConfig,
    private platform: 'ios' | 'android',
    private port: number = 8100
  ) {
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // Rutas de la API
    this.app.get('/api/inspect', async (req, res) => {
      try {
        const screenshot = await this.deviceManager.takeScreenshot();
        const elements = await this.deviceManager.getAllElements();
        res.json({
          screenshot: `data:image/png;base64,${screenshot}`,
          elements: elements
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/select-element', (req, res) => {
      const { element } = req.body;
      this.selectedElements.push(element);
      res.json({ success: true, selectedCount: this.selectedElements.length });
    });

    this.app.get('/api/selected-elements', (req, res) => {
        res.json({ elements: this.selectedElements });
    });

    this.app.post('/api/clear-selection', (req, res) => {
      this.selectedElements = [];
      res.json({ success: true });
    });

    this.app.post('/api/generate-selectors', async (req, res) => { 
      if (this.selectedElements.length === 0) {
        logger.warning('No elements selected to generate selectors.');
        return res.status(400).json({ success: false, message: 'No elements selected' });
      }

      logger.nl();
      logger.info('--- Generating Selectors on Demand ---');
      
      const generator = new MobileSelectorGenerator(this.config, this.platform);
      const formatter = new FrameworkFormatter();
      const resultsToCopy: string[] = [];
      
      this.selectedElements.forEach(elementInfo => {
        const selectorResult = generator.generateSelector(elementInfo);
        const formattedCode = formatter.formatMobile(selectorResult, this.platform, this.config.defaultLanguage);
        resultsToCopy.push(formattedCode);
        
        logger.info(`Element: ${elementInfo.tagName} (Text: "${elementInfo.text}")`);
        logger.selector(selectorResult.selector);
        logger.code(formattedCode);
        logger.nl();
      });

      try {
        const clipboardText = resultsToCopy.join('\n');
        await clipboardy.write(clipboardText);
        logger.success('✅ Results copied to clipboard!');
      } catch (error) {
        logger.warning('⚠️ Could not copy to clipboard.');
      }
      
      this.selectedElements = [];
      res.json({ success: true });
    });
    
    this.app.use(express.static(path.join(__dirname, '../mobile-ui')));
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, async () => {
        const url = `http://localhost:${this.port}`;
        logger.success(`Mobile Inspector running at ${url}`);
        await open(url);
        resolve();
      });
      this.server.on('error', reject);
    });
  }

  public async waitForSelection(type: 'single' | 'multiple'): Promise<MobileElementInfo[]> {
    logger.info('Waiting for element selection in the web inspector...');
    
    return new Promise((resolve) => {
      const checkSelection = () => {
        if (type === 'single' && this.selectedElements.length >= 1) {
          resolve(this.selectedElements);
        } else if (type === 'multiple' && this.selectedElements.length > 0) {
          setTimeout(() => resolve(this.selectedElements), 30000);
        } else {
          setTimeout(checkSelection, 1000);
        }
      };
      checkSelection();
    });
  }

  public async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}