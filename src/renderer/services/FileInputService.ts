import { FileValidationResult, FileInfo } from '../../types/file';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        on: (channel: string, func: (...args: unknown[]) => void) => void;
        removeListener: (
          channel: string,
          func: (...args: unknown[]) => void
        ) => void;
      };
      getPathForFile: (file: File) => string;
    };
  }
}

export class FileInputService {
  async validateFile(filePath: string): Promise<FileValidationResult> {
    return (await window.electron.ipcRenderer.invoke(
      'file:validate',
      filePath
    )) as FileValidationResult;
  }

  async readFile(filePath: string): Promise<Buffer> {
    return (await window.electron.ipcRenderer.invoke(
      'file:read',
      filePath
    )) as Buffer;
  }

  async handleFileSelect(files: FileList | null): Promise<FileInfo[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const fileInfos: FileInfo[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = window.electron.getPathForFile(file);
      const result = await this.validateFile(filePath);

      if (result.valid && result.fileInfo) {
        fileInfos.push(result.fileInfo);
      } else if (result.error) {
        console.error(`File validation failed: ${result.error.message}`);
      }
    }

    return fileInfos;
  }

  async handleFileDrop(
    event: React.DragEvent<HTMLDivElement>
  ): Promise<FileInfo[]> {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    return await this.handleFileSelect(files);
  }
}

export const fileInputService = new FileInputService();
