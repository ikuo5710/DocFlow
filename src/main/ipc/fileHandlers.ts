import { ipcMain } from 'electron';
import { FileHandler } from '../handlers/FileHandler';
import { FileValidationResult } from '../../types/file';

const fileHandler = new FileHandler();

export function registerFileHandlers(): void {
  ipcMain.handle(
    'file:validate',
    async (_event, filePath: string): Promise<FileValidationResult> => {
      return await fileHandler.validateFile(filePath);
    }
  );

  ipcMain.handle(
    'file:read',
    async (_event, filePath: string): Promise<Buffer> => {
      return await fileHandler.readFile(filePath);
    }
  );

  ipcMain.handle(
    'file:metadata',
    async (_event, filePath: string): Promise<{ pageCount: number }> => {
      return await fileHandler.extractPDFMetadata(filePath);
    }
  );
}
