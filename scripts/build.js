#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.blue('🔨 Building Best-Locator for NPM...'));

try {
  // 1. Limpiar directorio dist
  console.log(chalk.yellow('🧹 Cleaning dist directory...'));
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // 2. Compilar TypeScript
  console.log(chalk.yellow('⚙️  Compiling TypeScript...'));
  execSync('npx tsc', { stdio: 'inherit' });

  // 3. Hacer ejecutable el CLI
  console.log(chalk.yellow('🔧 Making CLI executable...'));
  const cliPath = path.join('dist', 'cli', 'index.js');
  
  if (fs.existsSync(cliPath)) {
    // Asegurar que tenga el shebang correcto
    let content = fs.readFileSync(cliPath, 'utf8');
    if (!content.startsWith('#!/usr/bin/env node')) {
      content = '#!/usr/bin/env node\n' + content;
      fs.writeFileSync(cliPath, content);
    }
    
    // Hacer ejecutable en sistemas Unix
    try {
      fs.chmodSync(cliPath, '755');
      console.log(chalk.green('✅ CLI made executable'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not set executable permissions (Windows?)'));
    }
  } else {
    throw new Error('CLI file not found after compilation');
  }

  // 4. Verificar archivos necesarios
  console.log(chalk.yellow('📋 Verifying required files...'));
  const requiredFiles = [
    'dist/cli/index.js',
    'dist/core/config-manager.js',
    'dist/core/selector-generator.js',
    'dist/core/framework-formatter.js',
    'dist/core/selector-validator.js',
    'package.json',
    'README.md'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.log(chalk.red('❌ Missing files:'));
    missingFiles.forEach(file => console.log(chalk.red(`   - ${file}`)));
    throw new Error('Build incomplete');
  }

  // 5. Test básico
  console.log(chalk.yellow('🧪 Running basic test...'));
  try {
    const testOutput = execSync('node dist/cli/index.js hello', { encoding: 'utf8' });
    if (testOutput.includes('Best-Locator') && testOutput.includes('working')) {
      console.log(chalk.green('✅ Basic test passed'));
    } else {
      throw new Error('Test output unexpected');
    }
  } catch (error) {
    console.log(chalk.red('❌ Basic test failed:'), error.message);
    throw error;
  }

  // 6. Mostrar resumen
  console.log(chalk.green('\n🎉 Build completed successfully!'));
  console.log(chalk.blue('\n📦 Ready for NPM publish:'));
  console.log(chalk.white('   npm publish --dry-run  # Para test'));
  console.log(chalk.white('   npm publish            # Para publicar'));
  
  // 7. Mostrar tamaño del paquete
  const distSize = getDirSize('dist');
  console.log(chalk.blue(`\n📊 Package size: ~${(distSize / 1024 / 1024).toFixed(2)} MB`));

} catch (error) {
  console.log(chalk.red('\n❌ Build failed:'), error.message);
  process.exit(1);
}

function getDirSize(dir) {
  let size = 0;
  
  function calculateSize(filePath) {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(filePath);
      files.forEach(file => calculateSize(path.join(filePath, file)));
    } else {
      size += stats.size;
    }
  }
  
  if (fs.existsSync(dir)) {
    calculateSize(dir);
  }
  
  return size;
}