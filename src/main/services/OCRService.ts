import * as fs from 'fs/promises';
import * as path from 'path';
import { Mistral } from '@mistralai/mistralai';
import { OCRError, OCRResult, OCROptions } from '../../types/ocr';

export class OCRService {
  private client: Mistral;
  private static readonly DEFAULT_TIMEOUT = 30000;
  private static readonly MAX_RETRIES = 3;
  private static readonly MODEL = 'mistral-ocr-latest';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.MISTRAL_API_KEY;
    if (!key) {
      throw new OCRError(
        'MISTRAL_API_KEY environment variable is not set',
        'API_ERROR'
      );
    }
    this.client = new Mistral({ apiKey: key });
  }

  async processFile(
    filePath: string,
    options?: OCROptions
  ): Promise<OCRResult> {
    const maxRetries = options?.maxRetries ?? OCRService.MAX_RETRIES;
    const timeout = options?.timeout ?? OCRService.DEFAULT_TIMEOUT;

    const buffer = await fs.readFile(filePath);
    const base64Data = buffer.toString('base64');
    const mimeType = this.getMimeType(filePath);
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const result = await this.retryWithBackoff(
      () => this.callAPI(dataUrl, mimeType, timeout),
      maxRetries
    );

    return {
      markdown: result.markdown,
      pageCount: result.pageCount,
    };
  }

  private async callAPI(
    dataUrl: string,
    mimeType: string,
    timeout: number
  ): Promise<{ markdown: string; pageCount: number }> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new OCRError('OCR request timed out', 'TIMEOUT')),
        timeout
      );
    });

    try {
      // Use document_url for PDFs, image_url for images
      const isPdf = mimeType === 'application/pdf';
      const document = isPdf
        ? {
            type: 'document_url' as const,
            documentUrl: dataUrl,
          }
        : {
            type: 'image_url' as const,
            imageUrl: dataUrl,
          };

      const response = await Promise.race([
        this.client.ocr.process({
          model: OCRService.MODEL,
          document,
        }),
        timeoutPromise,
      ]);

      if (!response.pages || response.pages.length === 0) {
        throw new OCRError('No pages returned from OCR', 'INVALID_RESPONSE');
      }

      const markdown = response.pages
        .map((page) => page.markdown)
        .join('\n\n---\n\n');

      return {
        markdown,
        pageCount: response.pages.length,
      };
    } catch (error) {
      if (error instanceof OCRError) {
        throw error;
      }

      if (error instanceof Error) {
        if (
          'status' in error &&
          (error as { status: number }).status === 429
        ) {
          throw new OCRError('Rate limit exceeded', 'RATE_LIMIT');
        }

        throw new OCRError(`OCR API error: ${error.message}`, 'API_ERROR');
      }

      throw new OCRError('Unknown OCR error', 'API_ERROR');
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (error instanceof OCRError) {
          if (
            error.code === 'INVALID_RESPONSE' ||
            error.code === 'API_ERROR'
          ) {
            throw error;
          }
        }

        if (attempt < maxRetries - 1) {
          const delay = 1000 * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.pdf':
        return 'application/pdf';
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      default:
        throw new OCRError(`Unsupported file format: ${ext}`, 'API_ERROR');
    }
  }
}
