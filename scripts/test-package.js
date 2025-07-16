#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import chalk from 'chalk';

console.log(chalk.blue('🧪 Testing Best-Locator package...'));

const tests = [
  {
    name: 'CLI Executable',
    command: 'node dist/cli/index.js',
    expectedOutput: 'Best-Locator',
    timeout: 5000
  },
  {
    name: 'Hello Command',
    command: 'node dist/cli/index.js hello',
    expectedOutput: 'working',
    timeout: 5000
  },
  {
    name: 'Version Command',
    command: 'node dist/cli/index.js --version',
    expectedOutput: /\d+\.\d+\.\d+/,
    timeout: 5000
  },
  {
    name: 'Help Command',
    command: 'node dist/cli/index.js --help',
    expectedOutput: 'Universal selector generator',
    timeout: 5000
  },
  {
    name: 'Config Command',
    command: 'node dist/cli/index.js config',
    expectedOutput: 'Configuration',
    timeout: 5000
  },
  {
    name: 'Init Command',
    command: 'node dist/cli/index.js init',
    expectedOutput: 'configuration created',
    timeout: 10000
  }
];

let passed = 0;
let failed = 0;

console.log(chalk.yellow(`\n🏃 Running ${tests.length} tests...\n`));

for (const test of tests) {
  process.stdout.write(chalk.blue(`${test.name}... `));
  
  try {
    const output = execSync(test.command, { 
      encoding: 'utf8', 
      timeout: test.timeout,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const success = test.expectedOutput instanceof RegExp
      ? test.expectedOutput.test(output)
      : output.includes(test.expectedOutput);
    
    if (success) {
      console.log(chalk.green('✅ PASSED'));
      passed++;
    } else {
      console.log(chalk.red('❌ FAILED'));
      console.log(chalk.red(`   Expected: ${test.expectedOutput}`));
      console.log(chalk.red(`   Got: ${output.substring(0, 100)}...`));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('❌ ERROR'));
    console.log(chalk.red(`   ${error.message}`));
    failed++;
  }
}

// Test de instalación simulada
console.log(chalk.blue('\n📦 Testing package simulation...'));

try {
  // Crear un directorio temporal
  const tempDir = 'temp-test-install';
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir);
  
  // Simular npm pack
  process.stdout.write(chalk.blue('Creating package... '));
  execSync('npm pack', { cwd: process.cwd() });
  console.log(chalk.green('✅'));
  
  // Limpiar
  const packFiles = fs.readdirSync('.').filter(f => f.endsWith('.tgz'));
  packFiles.forEach(file => fs.unlinkSync(file));
  fs.rmSync(tempDir, { recursive: true });
  
  console.log(chalk.green('✅ Package simulation passed'));
  passed++;
  
} catch (error) {
  console.log(chalk.red('❌ Package simulation failed'));
  console.log(chalk.red(`   ${error.message}`));
  failed++;
}

// Resumen final
console.log(chalk.blue('\n📊 Test Results:'));
console.log(chalk.green(`✅ Passed: ${passed}`));
console.log(chalk.red(`❌ Failed: ${failed}`));

if (failed === 0) {
  console.log(chalk.green('\n🎉 All tests passed! Package is ready for publish.'));
  console.log(chalk.blue('\n📋 Next steps:'));
  console.log(chalk.white('1. npm publish --dry-run  # Final verification'));
  console.log(chalk.white('2. npm publish            # Publish to NPM'));
  process.exit(0);
} else {
  console.log(chalk.red('\n💥 Some tests failed. Please fix before publishing.'));
  process.exit(1);
}