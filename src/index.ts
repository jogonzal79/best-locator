#!/usr/bin/env node

import { Command } from 'commander';
import { handlePickCommand } from './commands/pick.js';
import { handlePickMultipleCommand } from './commands/pick-multiple.js';
import { handlePickToggleCommand } from './commands/pick-toggle.js';
import { handleValidateCommand } from './commands/validate.js';
import { handleInitCommand } from './commands/init.js';
import { handleHelloCommand } from './commands/hello.js';
import { handleConfigCommand } from './commands/config.js';
import { handleGoCommand } from './commands/go.js';
import { handleAiTestCommand } from './commands/ai-test.js';
import chalk from 'chalk';
import { handlePickMobileCommand } from './commands/pick-mobile.js';
import { handlePickMobileMultipleCommand } from './commands/pick-mobile-multiple.js';
import { handleMobileInspectorCommand } from './commands/mobile-inspector.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  await readFile(path.join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('bestlocator')
  .description('🎯 Universal selector generator for UI testing')
  .version(packageJson.version);

// --- Comandos Web Existentes ---
program
  .command('pick <url> [framework] [language]')
  .description('Pick an element from a webpage and generate a selector')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(handlePickCommand);

program
  .command('pick-multiple <url> [framework] [language]')
  .description('Pick multiple elements from a webpage and generate selectors')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(handlePickMultipleCommand);

program
  .command('pick-toggle <url> [framework] [language]')
  .description('Navigate freely and toggle selector capture with CTRL+S/CTRL+D')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(handlePickToggleCommand);
  
program
  .command('validate <url> <selector>')
  .description('Validate a selector on a given URL')
  .action(handleValidateCommand);

// --- NUEVOS COMANDOS PARA APPIUM ---
program
  .command('pick-mobile <app-path> [platform] [language]')
  .description('Pick an element from a mobile app (iOS/Android)')
  .option('--platform <platform>', 'Mobile platform (ios or android)')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .action(handlePickMobileCommand);

program
  .command('pick-mobile-multiple <app-path> [platform] [language]')
  .description('Pick multiple elements from a mobile app')
  .option('--platform <platform>', 'Mobile platform (ios or android)')
  .option('--ai', 'Enable AI-powered selector generation')
  .action(handlePickMobileMultipleCommand);

program
  .command('mobile-inspector <app-path> [platform]')
  .description('Start interactive mobile app inspector')
  .option('--platform <platform>', 'Mobile platform (ios or android)')
  .action(handleMobileInspectorCommand);

// --- Comandos de Utilidad Existentes ---
program
  .command('config')
  .description('Show current configuration')
  .action(handleConfigCommand);

program
  .command('go <alias>')
  .description('Open a configured URL alias and pick an element')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(handleGoCommand);

program
  .command('ai-test')
  .description('Test AI functionality')
  .action(handleAiTestCommand);

program
  .command('init')
  .description('Create a sample configuration file (best-locator.config.json)')
  .action(handleInitCommand);

program
  .command('hello')
  .description('Test that Best-Locator is working correctly')
  .action(() => handleHelloCommand(packageJson.version));

if (process.argv.length <= 2) {
  console.log(chalk.green('🧪 Best-Locator - Quick Start'));
  console.log(chalk.white('\nExamples:'));
  console.log(chalk.white('  bestlocator pick https://saucedemo.com'));
  console.log(chalk.white('  bestlocator pick-mobile ./path/to/my.app ios'));
  console.log(chalk.white('\n🌐 Documentation: https://github.com/jogonzal79/best-locator'));
  process.exit(0);
}

program.parse(process.argv);