// src/app/logger.ts
import chalk from 'chalk';

class Logger {
  info(message: string) {
    console.log(chalk.blue(message));
  }

  success(message: string) {
    console.log(chalk.green(message));
  }

  warning(message: string) {
    console.log(chalk.yellow(message));
  }

  error(message: string, error?: any) {
    console.log(chalk.red(`❌ ${message}`));
    if (error) {
      console.log(chalk.red(error.message));
    }
  }

  log(message: string) {
    console.log(chalk.white(message));
  }

  code(message: string) {
    console.log(chalk.green(message));
  }
  
  selector(message: string) {
    console.log(chalk.yellow(`   ${message}`));
  }

  // Puedes añadir más métodos según necesites
  nl() { // Para una nueva línea (new line)
    console.log('');
  }
}

// Exportamos una única instancia para usarla en todo el proyecto
export const logger = new Logger();