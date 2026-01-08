import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileInputService } from './FileInputService';
import { FileInputError } from '../../types/file';

const mockIpcRenderer = {
  invoke: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

const mockGetPathForFile = vi.fn((file: { path?: string }) => file.path || '');

vi.stubGlobal('window', {
  electron: {
    ipcRenderer: mockIpcRenderer,
    getPathForFile: mockGetPathForFile,
  },
});

describe('FileInputService', () => {
  let service: FileInputService;

  beforeEach(() => {
    service = new FileInputService();
    vi.clearAllMocks();
    mockGetPathForFile.mockImplementation((file: { path?: string }) => file.path || '');
  });

  describe('validateFile', () => {
    it('should call IPC with file:validate channel', async () => {
      const expectedResult = {
        valid: true,
        fileInfo: {
          path: '/path/to/file.pdf',
          name: 'file.pdf',
          type: 'pdf',
          size: 1024,
          pageCount: 5,
        },
      };
      mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

      const result = await service.validateFile('/path/to/file.pdf');

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'file:validate',
        '/path/to/file.pdf'
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('readFile', () => {
    it('should call IPC with file:read channel', async () => {
      const expectedBuffer = Buffer.from('file content');
      mockIpcRenderer.invoke.mockResolvedValue(expectedBuffer);

      const result = await service.readFile('/path/to/file.pdf');

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'file:read',
        '/path/to/file.pdf'
      );
      expect(result).toEqual(expectedBuffer);
    });
  });

  describe('handleFileSelect', () => {
    it('should return empty array for null files', async () => {
      const result = await service.handleFileSelect(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty FileList', async () => {
      const emptyFileList = {
        length: 0,
        item: () => null,
        [Symbol.iterator]: function* () {},
      } as unknown as FileList;

      const result = await service.handleFileSelect(emptyFileList);
      expect(result).toEqual([]);
    });

    it('should process valid files and return file infos', async () => {
      const mockFile = {
        path: '/path/to/file.pdf',
        name: 'file.pdf',
        size: 1024,
        type: 'application/pdf',
      };

      const mockFileList = {
        length: 1,
        0: mockFile,
        item: (index: number) => (index === 0 ? mockFile : null),
        [Symbol.iterator]: function* () {
          yield mockFile;
        },
      } as unknown as FileList;

      const validationResult = {
        valid: true,
        fileInfo: {
          path: '/path/to/file.pdf',
          name: 'file.pdf',
          type: 'pdf',
          size: 1024,
          pageCount: 5,
        },
      };
      mockIpcRenderer.invoke.mockResolvedValue(validationResult);

      const result = await service.handleFileSelect(mockFileList);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(validationResult.fileInfo);
    });

    it('should handle validation errors gracefully', async () => {
      const mockFile = {
        path: '/path/to/file.docx',
        name: 'file.docx',
        size: 1024,
        type: 'application/docx',
      };

      const mockFileList = {
        length: 1,
        0: mockFile,
        item: (index: number) => (index === 0 ? mockFile : null),
        [Symbol.iterator]: function* () {
          yield mockFile;
        },
      } as unknown as FileList;

      const validationResult = {
        valid: false,
        error: new FileInputError('Unsupported format', 'UNSUPPORTED_FORMAT'),
      };
      mockIpcRenderer.invoke.mockResolvedValue(validationResult);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.handleFileSelect(mockFileList);

      expect(result).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('handleFileDrop', () => {
    it('should process dropped files', async () => {
      const mockFile = {
        path: '/path/to/image.png',
        name: 'image.png',
        size: 2048,
        type: 'image/png',
      };

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: {
            length: 1,
            0: mockFile,
            item: (index: number) => (index === 0 ? mockFile : null),
            [Symbol.iterator]: function* () {
              yield mockFile;
            },
          } as unknown as FileList,
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      const validationResult = {
        valid: true,
        fileInfo: {
          path: '/path/to/image.png',
          name: 'image.png',
          type: 'png',
          size: 2048,
        },
      };
      mockIpcRenderer.invoke.mockResolvedValue(validationResult);

      const result = await service.handleFileDrop(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(validationResult.fileInfo);
    });
  });
});
