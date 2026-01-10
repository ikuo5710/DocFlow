import { ipcMain } from 'electron';
import { registerFileHandlers } from './fileHandlers';
import { registerOCRHandlers } from './ocrHandlers';

export function registerIPCHandlers(): void {
  // Ping handler for testing IPC communication
  ipcMain.handle('ping', async () => {
    return 'pong';
  });

  // File handlers
  registerFileHandlers();

  // OCR handlers
  registerOCRHandlers();
}
