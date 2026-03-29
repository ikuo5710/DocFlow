import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OCRService } from './OCRService';
import { OCRError } from '../../types/ocr';

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

const mockOCRProcess = vi.fn();

vi.mock('@mistralai/mistralai', () => ({
  Mistral: vi.fn(function () {
    return {
      ocr: {
        process: mockOCRProcess,
      },
    };
  }),
}));

import * as fs from 'fs/promises';

describe('OCRService', () => {
  let ocrService: OCRService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MISTRAL_API_KEY = 'test-api-key';
    ocrService = new OCRService();
  });

  describe('constructor', () => {
    it('should create service with API key from environment', () => {
      process.env.MISTRAL_API_KEY = 'env-api-key';
      const service = new OCRService();
      expect(service).toBeInstanceOf(OCRService);
    });

    it('should create service with provided API key', () => {
      const service = new OCRService('custom-api-key');
      expect(service).toBeInstanceOf(OCRService);
    });

    it('should throw OCRError when API key is not provided', () => {
      delete process.env.MISTRAL_API_KEY;
      expect(() => new OCRService()).toThrow(OCRError);
    });
  });

  describe('processFile', () => {
    describe('successful processing', () => {
      it('should process PDF file successfully', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        mockOCRProcess.mockResolvedValue({
          pages: [
            { markdown: '# Page 1\nContent here' },
            { markdown: '# Page 2\nMore content' },
          ],
        });

        const result = await ocrService.processFile('/path/to/file.pdf');

        expect(result.markdown).toBe(
          '# Page 1\nContent here\n\n---\n\n# Page 2\nMore content'
        );
        expect(result.pageCount).toBe(2);
      });

      it('should process PNG file successfully', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake png'));
        mockOCRProcess.mockResolvedValue({
          pages: [{ markdown: '# Image Content' }],
        });

        const result = await ocrService.processFile('/path/to/image.png');

        expect(result.markdown).toBe('# Image Content');
      });

      it('should process JPEG file successfully', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake jpg'));
        mockOCRProcess.mockResolvedValue({
          pages: [{ markdown: '# JPEG Content' }],
        });

        const result = await ocrService.processFile('/path/to/image.jpg');

        expect(result.markdown).toBe('# JPEG Content');
      });

      it('should process .jpeg extension file successfully', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake jpeg'));
        mockOCRProcess.mockResolvedValue({
          pages: [{ markdown: '# JPEG Content' }],
        });

        const result = await ocrService.processFile('/path/to/image.jpeg');

        expect(result.markdown).toBe('# JPEG Content');
      });
    });

    describe('error handling', () => {
      it('should throw OCRError for unsupported file format', async () => {
        await expect(ocrService.processFile('/path/to/file.docx')).rejects.toThrow(
          OCRError
        );
      });

      it('should throw OCRError when no pages returned', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        mockOCRProcess.mockResolvedValue({ pages: [] });

        await expect(ocrService.processFile('/path/to/file.pdf')).rejects.toThrow(
          OCRError
        );
      });

      it('should throw OCRError with INVALID_RESPONSE code when no pages', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        mockOCRProcess.mockResolvedValue({ pages: [] });

        try {
          await ocrService.processFile('/path/to/file.pdf');
        } catch (error) {
          expect(error).toBeInstanceOf(OCRError);
          expect((error as OCRError).code).toBe('INVALID_RESPONSE');
        }
      });

      it('should throw OCRError on API error', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        mockOCRProcess.mockRejectedValue(new Error('API failure'));

        await expect(
          ocrService.processFile('/path/to/file.pdf', { maxRetries: 1 })
        ).rejects.toThrow(OCRError);
      });

      it('should handle rate limit error', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        const rateLimitError = new Error('Rate limit exceeded') as Error & {
          status: number;
        };
        rateLimitError.status = 429;
        mockOCRProcess.mockRejectedValue(rateLimitError);

        try {
          await ocrService.processFile('/path/to/file.pdf', { maxRetries: 1 });
        } catch (error) {
          expect(error).toBeInstanceOf(OCRError);
          expect((error as OCRError).code).toBe('RATE_LIMIT');
        }
      });
    });

    describe('retry behavior', () => {
      it('should retry on rate limit errors', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        const rateLimitError = new Error('Rate limit') as Error & {
          status: number;
        };
        rateLimitError.status = 429;
        mockOCRProcess
          .mockRejectedValueOnce(rateLimitError)
          .mockResolvedValueOnce({
            pages: [{ markdown: '# Success after retry' }],
          });

        const result = await ocrService.processFile('/path/to/file.pdf', {
          maxRetries: 2,
        });

        expect(result.markdown).toBe('# Success after retry');
        expect(mockOCRProcess).toHaveBeenCalledTimes(2);
      });

      it('should not retry on INVALID_RESPONSE error', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        mockOCRProcess.mockReset();
        mockOCRProcess.mockResolvedValue({ pages: [] });

        await expect(
          ocrService.processFile('/path/to/file.pdf', { maxRetries: 3 })
        ).rejects.toThrow(OCRError);

        expect(mockOCRProcess).toHaveBeenCalledTimes(1);
      });

      it('should exhaust retries on persistent failure', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        const rateLimitError = new Error('Rate limit') as Error & {
          status: number;
        };
        rateLimitError.status = 429;
        mockOCRProcess.mockRejectedValue(rateLimitError);

        await expect(
          ocrService.processFile('/path/to/file.pdf', { maxRetries: 2 })
        ).rejects.toThrow(OCRError);

        expect(mockOCRProcess).toHaveBeenCalledTimes(2);
      });
    });

    describe('options', () => {
      it('should use default options when not provided', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        mockOCRProcess.mockResolvedValue({
          pages: [{ markdown: '# Content' }],
        });

        await ocrService.processFile('/path/to/file.pdf');

        expect(mockOCRProcess).toHaveBeenCalled();
      });

      it('should respect custom maxRetries option', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake pdf'));
        const rateLimitError = new Error('Rate limit') as Error & {
          status: number;
        };
        rateLimitError.status = 429;
        mockOCRProcess.mockRejectedValue(rateLimitError);

        await expect(
          ocrService.processFile('/path/to/file.pdf', { maxRetries: 1 })
        ).rejects.toThrow(OCRError);

        expect(mockOCRProcess).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('processMultipleFiles', () => {
    it('should process multiple files sorted by filename ascending', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake image'));
      mockOCRProcess
        .mockResolvedValueOnce({ pages: [{ markdown: '# Image C' }] })
        .mockResolvedValueOnce({ pages: [{ markdown: '# Image A' }] })
        .mockResolvedValueOnce({ pages: [{ markdown: '# Image B' }] });

      const result = await ocrService.processMultipleFiles([
        '/path/to/c_image.png',
        '/path/to/a_image.png',
        '/path/to/b_image.png',
      ]);

      // ファイル名昇順: a_image, b_image, c_image
      expect(result.markdown).toBe(
        '# Image C\n\n---\n\n# Image A\n\n---\n\n# Image B'
      );
      expect(result.pageCount).toBe(3);
    });

    it('should sort by filename not full path', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake image'));
      // ソート後の順序: 01_page.png (dir1), 02_page.png (dir2)
      mockOCRProcess
        .mockResolvedValueOnce({ pages: [{ markdown: '# Page 01' }] })
        .mockResolvedValueOnce({ pages: [{ markdown: '# Page 02' }] });

      const result = await ocrService.processMultipleFiles([
        '/dir2/02_page.png',
        '/dir1/01_page.png',
      ]);

      // ファイル名昇順: 01_page (from dir1), 02_page (from dir2)
      expect(result.markdown).toBe('# Page 01\n\n---\n\n# Page 02');
      expect(result.pageCount).toBe(2);
      // 呼び出し順を検証: 01_page.pngが先
      expect(vi.mocked(fs.readFile)).toHaveBeenNthCalledWith(1, '/dir1/01_page.png');
      expect(vi.mocked(fs.readFile)).toHaveBeenNthCalledWith(2, '/dir2/02_page.png');
    });

    it('should call onProgress callback for each file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake image'));
      mockOCRProcess.mockResolvedValue({ pages: [{ markdown: '# Content' }] });

      const onProgress = vi.fn();
      await ocrService.processMultipleFiles(
        ['/path/to/b.png', '/path/to/a.png'],
        undefined,
        onProgress
      );

      // ソート後: a.png, b.png
      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2, 'a.png');
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2, 'b.png');
    });

    it('should propagate error when a file fails', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('fake image'));
      mockOCRProcess
        .mockResolvedValueOnce({ pages: [{ markdown: '# OK' }] })
        .mockRejectedValueOnce(new OCRError('API failure', 'API_ERROR'));

      await expect(
        ocrService.processMultipleFiles(
          ['/path/to/a.png', '/path/to/b.png'],
          { maxRetries: 1 }
        )
      ).rejects.toThrow(OCRError);
    });

    it('should handle empty file list', async () => {
      const result = await ocrService.processMultipleFiles([]);

      expect(result.markdown).toBe('');
      expect(result.pageCount).toBe(0);
    });
  });
});
