import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockProcessFile = vi.fn();
const mockProcessMultipleFiles = vi.fn();

vi.mock('../services/OCRService', () => ({
  OCRService: vi.fn(function () {
    return {
      processFile: mockProcessFile,
      processMultipleFiles: mockProcessMultipleFiles,
    };
  }),
}));

vi.mock('electron', () => {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  return {
    ipcMain: {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      _getHandler: (channel: string) => handlers.get(channel),
    },
  };
});

import { ipcMain } from 'electron';
import { registerOCRHandlers } from './ocrHandlers';
import { OCRError } from '../../types/ocr';

describe('ocrHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MISTRAL_API_KEY = 'test-api-key';
    registerOCRHandlers();
  });

  describe('ocr:processMultiple', () => {
    it('should process multiple files successfully', async () => {
      mockProcessMultipleFiles.mockResolvedValue({
        markdown: '# Page 1\n\n---\n\n# Page 2',
        pageCount: 2,
      });

      const handler = (ipcMain as unknown as { _getHandler: (c: string) => (...args: unknown[]) => unknown })._getHandler('ocr:processMultiple');
      const mockEvent = { sender: { send: vi.fn() } };
      const result = await handler(mockEvent, {
        filePaths: ['/path/a.png', '/path/b.png'],
      });

      expect(result).toEqual({
        success: true,
        result: {
          markdown: '# Page 1\n\n---\n\n# Page 2',
          pageCount: 2,
        },
      });
    });

    it('should send progress events', async () => {
      mockProcessMultipleFiles.mockImplementation(
        async (_paths: string[], _opts: unknown, onProgress: (c: number, t: number, f: string) => void) => {
          onProgress(1, 2, 'a.png');
          onProgress(2, 2, 'b.png');
          return { markdown: '# Content', pageCount: 2 };
        }
      );

      const handler = (ipcMain as unknown as { _getHandler: (c: string) => (...args: unknown[]) => unknown })._getHandler('ocr:processMultiple');
      const mockSend = vi.fn();
      const mockEvent = { sender: { send: mockSend } };
      await handler(mockEvent, {
        filePaths: ['/path/a.png', '/path/b.png'],
      });

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenCalledWith('ocr:processMultiple:progress', {
        current: 1, total: 2, fileName: 'a.png',
      });
      expect(mockSend).toHaveBeenCalledWith('ocr:processMultiple:progress', {
        current: 2, total: 2, fileName: 'b.png',
      });
    });

    it('should handle OCRError', async () => {
      mockProcessMultipleFiles.mockRejectedValue(
        new OCRError('API failure', 'API_ERROR')
      );

      const handler = (ipcMain as unknown as { _getHandler: (c: string) => (...args: unknown[]) => unknown })._getHandler('ocr:processMultiple');
      const mockEvent = { sender: { send: vi.fn() } };
      const result = await handler(mockEvent, {
        filePaths: ['/path/a.png'],
      });

      expect(result).toEqual({
        success: false,
        error: { message: 'API failure', code: 'API_ERROR' },
      });
    });
  });
});
