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


// Leer package.json para obtener la versión
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

const program = new Command();

program
  .name('best-locator')
  .description('🎯 Universal selector generator for UI testing')
  .version(packageJson.version);

// Comando: pick
program
  .command('pick <url> [framework] [language]')
  .description('Pick an element from a webpage and generate a selector')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(handlePickCommand);

// Comando: pick-multiple
program
  .command('pick-multiple <url> [framework] [language]')
  .description('Pick multiple elements from a webpage and generate selectors')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(handlePickMultipleCommand);

// Comando: pick-toggle
program
  .command('pick-toggle <url> [framework] [language]')
  .description('Navigate freely and toggle selector capture with CTRL+S/CTRL+D')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(handlePickToggleCommand);
  
// Comando: validate
program
  .command('validate <url> <selector>')
  .description('Validate a selector on a given URL')
  .action(handleValidateCommand);

// Comando: config
program
  .command('config')
  .description('Show current configuration')
  .action(handleConfigCommand);

// Comando: go
program
  .command('go <alias>')
  .description('Open a configured URL alias and pick an element')
  .option('--ai', 'Enable AI-powered selector generation')
  .option('--explain', 'Explain AI decisions')
  .option('--no-fallback', 'Disable fallback to traditional method')
  .action(handleGoCommand);  

// Comando: ai-test
program
  .command('ai-test')
  .description('Test AI functionality')
  .action(handleAiTestCommand); 

// Comando: init
program
  .command('init')
  .description('Create a sample configuration file (best-locator.config.json)')
  .action(handleInitCommand);

// Comando: hello
program
  .command('hello')
  .description('Test that Best-Locator is working correctly')
  .action(() => handleHelloCommand(packageJson.version));


// Mensaje de ayuda si no se pasan argumentos
if (process.argv.length <= 2) {
  console.log(chalk.green('🧪 Best-Locator - Quick Start'));
  console.log(chalk.white('\nExamples:'));
  console.log(chalk.white('  best-locator pick https://saucedemo.com'));
  console.log(chalk.white('  best-locator pick-multiple https://saucedemo.com'));
  console.log(chalk.white('\n🌐 Documentation: https://github.com/jogonzal79/best-locator'));
  process.exit(0);
}

program.parse(process.argv);