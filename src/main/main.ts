import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { registerIPCHandlers } from './ipc';

// Load environment variables from config/.env
// In dev: __dirname = dist/main/main, so ../../../config/.env
// In packaged app: Use app.getPath('userData') for user-specific config
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv');

function loadEnvForPackagedApp(): void {
  // For portable app, PORTABLE_EXECUTABLE_DIR is set by electron-builder
  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
  const exeDir = path.dirname(process.execPath);
  const userDataDir = app.getPath('userData');

  const envPaths = [
    portableDir ? path.join(portableDir, '.env') : null,
    path.join(exeDir, '.env'),
    path.join(userDataDir, '.env'),
  ].filter((p): p is string => p !== null);

  let loaded = false;
  const debugInfo: string[] = [];

  for (const envPath of envPaths) {
    const exists = fs.existsSync(envPath);
    debugInfo.push(`${envPath}: ${exists ? 'exists' : 'not found'}`);
    if (exists && !loaded) {
      const result = dotenv.config({ path: envPath });
      if (!result.error) {
        loaded = true;
        debugInfo.push(`  -> Loaded successfully`);
      } else {
        debugInfo.push(`  -> Load error: ${result.error.message}`);
      }
    }
  }

  // Show debug dialog if API key is not set
  if (!process.env.MISTRAL_API_KEY) {
    dialog.showErrorBox(
      'Environment Configuration Debug',
      `MISTRAL_API_KEY not found.\n\nSearched paths:\n${debugInfo.join('\n')}\n\nPORTABLE_EXECUTABLE_DIR: ${portableDir || 'not set'}\nprocess.execPath: ${process.execPath}`
    );
  }
}

if (!app.isPackaged) {
  dotenv.config({ path: path.join(__dirname, '../../../config/.env') });
} else {
  loadEnvForPackagedApp();
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow loading local files for file:// URLs
    },
  });

  // Load the renderer
  // In development, load from Vite dev server
  // In production (packaged app), load from built files
  if (!app.isPackaged) {
    const devPort = process.env.VITE_DEV_PORT || '5180';
    mainWindow.loadURL(`http://localhost:${devPort}`);
    mainWindow.webContents.openDevTools();
  } else {
    // In packaged app: __dirname = resources/app.asar/dist/main/main
    // Renderer is at: resources/app.asar/dist/renderer/index.html
    // So we need to go up two levels: ../../renderer/index.html
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  registerIPCHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
