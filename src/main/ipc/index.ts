import { ipcMain } from 'electron';
import { registerFileHandlers } from './fileHandlers';

export function registerIPCHandlers(): void {
  // Ping handler for testing IPC communication
  ipcMain.handle('ping', async () => {
    return 'pong';
  });

  // File handlers
  registerFileHandlers();
}
