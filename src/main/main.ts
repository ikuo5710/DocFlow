import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerIPCHandlers } from './ipc';

// Load environment variables from config/.env
// In dev: __dirname = dist/main/main, so ../../../config/.env
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: path.join(__dirname, '../../../config/.env') });

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
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
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
