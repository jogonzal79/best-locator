// src/gui/main.js
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Mantener referencia global de la ventana
let mainWindow;

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Opcional: agregar icono después
    show: false, // No mostrar hasta que esté listo
    titleBarStyle: 'default',
    resizable: true,
    minWidth: 600,
    minHeight: 400
  });

  // Cargar el archivo HTML
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Enfocar ventana
    if (process.platform === 'darwin') {
      app.dock.show();
    }
  });

  // NO abrir DevTools automáticamente
  // Removido el código que abría DevTools en desarrollo

  // Manejar links externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Este método será llamado cuando Electron haya terminado de inicializarse
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // En macOS, re-crear ventana cuando se hace clic en el icono del dock
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', function () {
  // En macOS, mantener la app activa hasta que el usuario salga explícitamente
  if (process.platform !== 'darwin') app.quit();
});

// Manejar comandos desde el renderer process
ipcMain.handle('execute-command', async (event, command, args) => {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command} ${args.join(' ')}`);
    
    // Ejecutar el comando CLI de Best-Locator usando npm run dev
    const child = spawn('npm', [
      'run',
      'dev',
      command,
      ...args
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true // Necesario en Windows
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      // Enviar output en tiempo real al renderer
      event.sender.send('command-output', data.toString());
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
      event.sender.send('command-error', data.toString());
    });

    child.on('close', (code) => {
      resolve({
        code,
        output,
        error,
        success: code === 0
      });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
});

// Manejar obtener configuración
ipcMain.handle('get-config', async () => {
  try {
    // Importar ConfigManager
    const { ConfigManager } = require('../core/config-manager.js');
    const configManager = new ConfigManager();
    return configManager.getConfig();
  } catch (error) {
    console.error('Error getting config:', error);
    return null;
  }
});

// Prevenir navegación no deseada
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'file://') {
      navigationEvent.preventDefault();
    }
  });
});