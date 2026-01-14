import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileHandler } from './FileHandler';
import { FileInputError } from '../../types/file';

vi.mock('fs/promises', () => ({
  stat: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
}));

vi.mock('electron', () => ({
  dialog: {
    showSaveDialog: vi.fn(),
  },
  BrowserWindow: {
    getFocusedWindow: vi.fn(),
  },
}));

vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

import * as fs from 'fs/promises';
import pdf from 'pdf-parse';
import { dialog, BrowserWindow } from 'electron';

describe('FileHandler', () => {
  let fileHandler: FileHandler;

  beforeEach(() => {
    fileHandler = new FileHandler();
    vi.clearAllMocks();
  });

  describe('validateFile', () => {
    describe('valid files', () => {
      it('should validate a valid PDF file', async () => {
        vi.mocked(fs.stat).mockResolvedValue({
          size: 1024,
        } as import('fs').Stats);
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        vi.mocked(pdf).mockResolvedValue({
          numpages: 5,
          numrender: 5,
          info: {},
          metadata: null,
          version: 'v1.10.100' as const,
          text: '',
        });

        const result = await fileHandler.validateFile('/path/to/file.pdf');

        expect(result.valid).toBe(true);
        expect(result.fileInfo).toEqual({
          path: '/path/to/file.pdf',
          name: 'file.pdf',
          type: 'pdf',
          size: 1024,
          pageCount: 5,
          previewDataUrl: 'data:application/pdf;base64,ZmFrZSBwZGY=',
        });
      });

      it('should validate a valid PNG file', async () => {
        vi.mocked(fs.stat).mockResolvedValue({
          size: 2048,
        } as import('fs').Stats);
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake png'));

        const result = await fileHandler.validateFile('/path/to/image.png');

        expect(result.valid).toBe(true);
        expect(result.fileInfo).toEqual({
          path: '/path/to/image.png',
          name: 'image.png',
          type: 'png',
          size: 2048,
          previewDataUrl: 'data:image/png;base64,ZmFrZSBwbmc=',
        });
      });

      it('should validate a valid JPEG file (.jpg)', async () => {
        vi.mocked(fs.stat).mockResolvedValue({
          size: 3072,
        } as import('fs').Stats);
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake jpg'));

        const result = await fileHandler.validateFile('/path/to/image.jpg');

        expect(result.valid).toBe(true);
        expect(result.fileInfo).toEqual({
          path: '/path/to/image.jpg',
          name: 'image.jpg',
          type: 'jpeg',
          size: 3072,
          previewDataUrl: 'data:image/jpeg;base64,ZmFrZSBqcGc=',
        });
      });

      it('should validate a valid JPEG file (.jpeg)', async () => {
        vi.mocked(fs.stat).mockResolvedValue({
          size: 4096,
        } as import('fs').Stats);
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake jpeg'));

        const result = await fileHandler.validateFile('/path/to/image.jpeg');

        expect(result.valid).toBe(true);
        expect(result.fileInfo).toEqual({
          path: '/path/to/image.jpeg',
          name: 'image.jpeg',
          type: 'jpeg',
          size: 4096,
          previewDataUrl: 'data:image/jpeg;base64,ZmFrZSBqcGVn',
        });
      });
    });

    describe('invalid files', () => {
      it('should reject file exceeding size limit', async () => {
        vi.mocked(fs.stat).mockResolvedValue({
          size: 101 * 1024 * 1024, // 101MB
        } as import('fs').Stats);

        const result = await fileHandler.validateFile('/path/to/large.pdf');

        expect(result.valid).toBe(false);
        expect(result.error).toBeInstanceOf(FileInputError);
        expect(result.error?.code).toBe('FILE_TOO_LARGE');
      });

      it('should reject unsupported file format', async () => {
        vi.mocked(fs.stat).mockResolvedValue({
          size: 1024,
        } as import('fs').Stats);

        const result = await fileHandler.validateFile('/path/to/file.docx');

        expect(result.valid).toBe(false);
        expect(result.error).toBeInstanceOf(FileInputError);
        expect(result.error?.code).toBe('UNSUPPORTED_FORMAT');
      });

      it('should handle file not found error', async () => {
        const error = new Error('ENOENT') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        vi.mocked(fs.stat).mockRejectedValue(error);

        const result = await fileHandler.validateFile('/path/to/nonexistent.pdf');

        expect(result.valid).toBe(false);
        expect(result.error).toBeInstanceOf(FileInputError);
        expect(result.error?.code).toBe('READ_ERROR');
        expect(result.error?.message).toBe('File not found');
      });

      it('should handle generic read error', async () => {
        vi.mocked(fs.stat).mockRejectedValue(new Error('Permission denied'));

        const result = await fileHandler.validateFile('/path/to/file.pdf');

        expect(result.valid).toBe(false);
        expect(result.error).toBeInstanceOf(FileInputError);
        expect(result.error?.code).toBe('READ_ERROR');
      });
    });
  });

  describe('readFile', () => {
    it('should read file successfully', async () => {
      const fileContent = Buffer.from('test content');
      vi.mocked(fs.readFile).mockResolvedValue(fileContent);

      const result = await fileHandler.readFile('/path/to/file.txt');

      expect(result).toEqual(fileContent);
    });

    it('should throw FileInputError on read failure', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read failed'));

      await expect(fileHandler.readFile('/path/to/file.txt')).rejects.toThrow(
        FileInputError
      );
    });
  });

  describe('extractPDFMetadata', () => {
    it('should extract page count from PDF', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
      vi.mocked(pdf).mockResolvedValue({
        numpages: 10,
        numrender: 10,
        info: {},
        metadata: null,
        version: 'v1.10.100' as const,
        text: '',
      });

      const result = await fileHandler.extractPDFMetadata('/path/to/file.pdf');

      expect(result.pageCount).toBe(10);
    });

    it('should throw FileInputError on corrupted PDF', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('corrupted'));
      vi.mocked(pdf).mockRejectedValue(new Error('Invalid PDF'));

      await expect(
        fileHandler.extractPDFMetadata('/path/to/corrupted.pdf')
      ).rejects.toThrow(FileInputError);
    });
  });

  describe('saveMarkdown', () => {
    it('should save markdown content without metadata', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await fileHandler.saveMarkdown(
        '/path/to/output.md',
        '# Test Content\n\nSome text here.'
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/path/to/output.md');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/path/to/output.md',
        '# Test Content\n\nSome text here.',
        'utf-8'
      );
    });

    it('should save markdown content with YAML Front Matter metadata', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const metadata = {
        originalFilePath: '/path/to/original.pdf',
        processedAt: '2026-01-11T10:30:00.000Z',
      };

      const result = await fileHandler.saveMarkdown(
        '/path/to/output.md',
        '# Test Content',
        metadata
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/path/to/output.md');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/path/to/output.md',
        '---\noriginal_file: /path/to/original.pdf\nprocessed_at: 2026-01-11T10:30:00.000Z\n---\n# Test Content',
        'utf-8'
      );
    });

    it('should handle permission denied error (EACCES)', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      vi.mocked(fs.writeFile).mockRejectedValue(error);

      const result = await fileHandler.saveMarkdown(
        '/protected/path/output.md',
        '# Content'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Permission denied: Cannot write to the specified location'
      );
    });

    it('should handle permission denied error (EPERM)', async () => {
      const error = new Error('Operation not permitted') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      vi.mocked(fs.writeFile).mockRejectedValue(error);

      const result = await fileHandler.saveMarkdown(
        '/protected/path/output.md',
        '# Content'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Permission denied: Cannot write to the specified location'
      );
    });

    it('should handle disk full error (ENOSPC)', async () => {
      const error = new Error('No space left on device') as NodeJS.ErrnoException;
      error.code = 'ENOSPC';
      vi.mocked(fs.writeFile).mockRejectedValue(error);

      const result = await fileHandler.saveMarkdown(
        '/path/to/output.md',
        '# Content'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Disk space is full');
    });

    it('should handle generic write error', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Unknown write error'));

      const result = await fileHandler.saveMarkdown(
        '/path/to/output.md',
        '# Content'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save file: Unknown write error');
    });
  });

  describe('showSaveDialog', () => {
    it('should return file path when user selects a file', async () => {
      vi.mocked(BrowserWindow.getFocusedWindow).mockReturnValue(
        {} as Electron.BrowserWindow
      );
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath: '/selected/path/output.md',
      });

      const result = await fileHandler.showSaveDialog('default_ocr.md');

      expect(result.canceled).toBe(false);
      expect(result.filePath).toBe('/selected/path/output.md');
      expect(dialog.showSaveDialog).toHaveBeenCalledWith(
        expect.anything(),
        {
          defaultPath: 'default_ocr.md',
          filters: [{ name: 'Markdown', extensions: ['md'] }],
        }
      );
    });

    it('should return canceled when user cancels dialog', async () => {
      vi.mocked(BrowserWindow.getFocusedWindow).mockReturnValue(null);
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: true,
        filePath: '',
      });

      const result = await fileHandler.showSaveDialog('default_ocr.md');

      expect(result.canceled).toBe(true);
      expect(result.filePath).toBe('');
    });

    it('should work without focused window', async () => {
      vi.mocked(BrowserWindow.getFocusedWindow).mockReturnValue(null);
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath: '/path/output.md',
      });

      const result = await fileHandler.showSaveDialog('test.md');

      expect(result.canceled).toBe(false);
      // When no focused window, dialog.showSaveDialog is called with options only
      expect(dialog.showSaveDialog).toHaveBeenCalledWith({
        defaultPath: 'test.md',
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });
    });
  });

  describe('getOCRCachePath', () => {
    it('should generate correct cache path for PDF', () => {
      const result = fileHandler.getOCRCachePath('/path/to/document.pdf');
      expect(result).toBe('/path/to/document.pdf_ocr.md');
    });

    it('should generate correct cache path for PNG', () => {
      const result = fileHandler.getOCRCachePath('/path/to/image.png');
      expect(result).toBe('/path/to/image.png_ocr.md');
    });

    it('should generate correct cache path for JPEG', () => {
      const result = fileHandler.getOCRCachePath('/path/to/photo.jpg');
      expect(result).toBe('/path/to/photo.jpg_ocr.md');
    });
  });

  describe('checkOCRCacheExists', () => {
    it('should return exists: true when cache file exists', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await fileHandler.checkOCRCacheExists('/path/to/document.pdf');

      expect(result.exists).toBe(true);
      expect(result.cachePath).toBe('/path/to/document.pdf_ocr.md');
      expect(fs.access).toHaveBeenCalledWith('/path/to/document.pdf_ocr.md');
    });

    it('should return exists: false when cache file does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      const result = await fileHandler.checkOCRCacheExists('/path/to/document.pdf');

      expect(result.exists).toBe(false);
      expect(result.cachePath).toBe('/path/to/document.pdf_ocr.md');
    });
  });

  describe('readOCRCache', () => {
    it('should read cache file content successfully', async () => {
      const cacheContent = '---\noriginal_file: /path/to/doc.pdf\n---\n# OCR Result\n\nSome text.';
      vi.mocked(fs.readFile).mockResolvedValue(cacheContent);

      const result = await fileHandler.readOCRCache('/path/to/document.pdf');

      expect(result.content).toBe(cacheContent);
      expect(fs.readFile).toHaveBeenCalledWith('/path/to/document.pdf_ocr.md', 'utf-8');
    });

    it('should throw FileInputError when cache file cannot be read', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      await expect(fileHandler.readOCRCache('/path/to/document.pdf')).rejects.toThrow(
        FileInputError
      );
    });
  });
});
