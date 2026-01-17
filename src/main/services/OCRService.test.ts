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
});
