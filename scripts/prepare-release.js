#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log(chalk.blue('🚀 Best-Locator NPM Release Preparation'));
  console.log(chalk.yellow('This script will prepare your package for NPM publication\n'));

  // 1. Verificar que estamos en el directorio correcto
  if (!fs.existsSync('package.json')) {
    console.log(chalk.red('❌ package.json not found. Run this script from the project root.'));
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(chalk.blue(`📦 Package: ${packageJson.name} v${packageJson.version}`));

  // 2. Verificar disponibilidad del nombre
  console.log(chalk.yellow('\n🔍 Checking package name availability...'));
  try {
    execSync(`npm info ${packageJson.name}`, { stdio: 'pipe' });
    console.log(chalk.red(`❌ Package name "${packageJson.name}" is already taken!`));
    
    const useScope = await question(chalk.blue('Do you want to use a scoped package? (y/N): '));
    if (useScope.toLowerCase() === 'y') {
      const username = await question(chalk.blue('Enter your NPM username: '));
      packageJson.name = `@${username}/${packageJson.name}`;
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
      console.log(chalk.green(`✅ Updated package name to: ${packageJson.name}`));
    } else {
      const newName = await question(chalk.blue('Enter a new package name: '));
      packageJson.name = newName;
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
      console.log(chalk.green(`✅ Updated package name to: ${packageJson.name}`));
    }
  } catch (error) {
    console.log(chalk.green('✅ Package name is available!'));
  }

  // 3. Verificar login NPM
  console.log(chalk.yellow('\n👤 Checking NPM authentication...'));
  try {
    const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
    console.log(chalk.green(`✅ Logged in as: ${whoami}`));
  } catch (error) {
    console.log(chalk.red('❌ Not logged in to NPM'));
    console.log(chalk.blue('Please run: npm login'));
    process.exit(1);
  }

  // 4. Verificar archivos requeridos
  console.log(chalk.yellow('\n📋 Checking required files...'));
  const requiredFiles = [
    { file: 'README.md', required: true },
    { file: 'LICENSE', required: true },
    { file: 'src/cli/index.ts', required: true },
    { file: '.gitignore', required: false },
    { file: '.npmignore', required: false }
  ];

  let missingRequired = false;
  for (const { file, required } of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(chalk.green(`✅ ${file}`));
    } else if (required) {
      console.log(chalk.red(`❌ ${file} (required)`));
      missingRequired = true;
    } else {
      console.log(chalk.yellow(`⚠️  ${file} (optional)`));
    }
  }

  if (missingRequired) {
    console.log(chalk.red('\n❌ Missing required files. Please create them first.'));
    process.exit(1);
  }

  // 5. Crear .npmignore si no existe
  if (!fs.existsSync('.npmignore')) {
    console.log(chalk.yellow('\n📝 Creating .npmignore...'));
    const npmIgnore = `# Source code
src/
tsconfig.json
*.ts

# Development
.vscode/
.idea/
*.log
npm-debug.log*

# Tests
test/
tests/
*.test.js
*.spec.js

# Build tools
scripts/
.github/

# Electron (keep only CLI)
src/gui/
assets/

# Misc
.DS_Store
Thumbs.db
*.tgz
node_modules/
`;
    fs.writeFileSync('.npmignore', npmIgnore);
    console.log(chalk.green('✅ .npmignore created'));
  }

  // 6. Verificar configuración del package.json
  console.log(chalk.yellow('\n⚙️  Validating package.json configuration...'));
  
  const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'keywords', 'author', 'license'];
  const missingFields = requiredFields.filter(field => !packageJson[field]);
  
  if (missingFields.length > 0) {
    console.log(chalk.red(`❌ Missing package.json fields: ${missingFields.join(', ')}`));
    process.exit(1);
  }

  if (!packageJson.bin || !packageJson.bin['best-locator']) {
    console.log(chalk.red('❌ Missing bin configuration in package.json'));
    process.exit(1);
  }

  console.log(chalk.green('✅ package.json configuration is valid'));

  // 7. Build del proyecto
  console.log(chalk.yellow('\n🔨 Building project...'));
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log(chalk.green('✅ Build successful'));
  } catch (error) {
    console.log(chalk.red('❌ Build failed'));
    process.exit(1);
  }

  // 8. Verificar que el CLI compilado funciona
  console.log(chalk.yellow('\n🧪 Testing compiled CLI...'));
  try {
    const output = execSync('node dist/cli/index.js hello', { encoding: 'utf8' });
    if (output.includes('Best-Locator') && output.includes('working')) {
      console.log(chalk.green('✅ CLI test passed'));
    } else {
      throw new Error('Unexpected output');
    }
  } catch (error) {
    console.log(chalk.red('❌ CLI test failed'));
    console.log(error.message);
    process.exit(1);
  }

  // 9. Verificar tamaño del paquete
  console.log(chalk.yellow('\n📦 Checking package size...'));
  try {
    execSync('npm pack', { stdio: 'pipe' });
    const tarFiles = fs.readdirSync('.').filter(f => f.endsWith('.tgz'));
    
    if (tarFiles.length > 0) {
      const stats = fs.statSync(tarFiles[0]);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(chalk.blue(`📊 Package size: ${sizeMB} MB`));
      
      if (stats.size > 50 * 1024 * 1024) { // 50MB
        console.log(chalk.yellow('⚠️  Package is quite large (>50MB)'));
      }
      
      // Cleanup
      tarFiles.forEach(file => fs.unlinkSync(file));
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not determine package size'));
  }

  // 10. Dry run
  console.log(chalk.yellow('\n🔍 Running publish dry run...'));
  try {
    execSync('npm publish --dry-run', { stdio: 'inherit' });
    console.log(chalk.green('✅ Dry run successful'));
  } catch (error) {
    console.log(chalk.red('❌ Dry run failed'));
    process.exit(1);
  }

  // 11. Confirmación final
  console.log(chalk.green('\n🎉 All checks passed! Package is ready for publication.'));
  console.log(chalk.blue('\n📋 Summary:'));
  console.log(chalk.white(`   Package: ${packageJson.name}`));
  console.log(chalk.white(`   Version: ${packageJson.version}`));
  console.log(chalk.white(`   Description: ${packageJson.description}`));
  
  console.log(chalk.blue('\n🚀 Next steps:'));
  console.log(chalk.white('   1. npm publish                    # Publish to NPM'));
  console.log(chalk.white('   2. git tag v' + packageJson.version + '            # Tag release'));
  console.log(chalk.white('   3. git push --tags                # Push tags'));

  const proceed = await question(chalk.yellow('\nDo you want to publish now? (y/N): '));
  
  if (proceed.toLowerCase() === 'y') {
    console.log(chalk.blue('\n🚀 Publishing to NPM...'));
    try {
      execSync('npm publish', { stdio: 'inherit' });
      console.log(chalk.green('\n🎉 Successfully published to NPM!'));
      console.log(chalk.blue(`\n📦 Your package is now available:`));
      console.log(chalk.white(`   npm install -g ${packageJson.name}`));
      console.log(chalk.white(`   ${packageJson.bin['best-locator'].replace('dist/', '')} hello`));
    } catch (error) {
      console.log(chalk.red('\n❌ Publication failed'));
      console.log(error.message);
    }
  } else {
    console.log(chalk.blue('\n✋ Publication cancelled. You can publish later with: npm publish'));
  }

  rl.close();
}

main().catch(console.error);