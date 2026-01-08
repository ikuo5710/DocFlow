import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileHandler } from './FileHandler';
import { FileInputError } from '../../types/file';

vi.mock('fs/promises', () => ({
  stat: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

import * as fs from 'fs/promises';
import pdf from 'pdf-parse';

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
});
