export type OCRErrorCode =
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'RATE_LIMIT';

export class OCRError extends Error {
  constructor(
    message: string,
    public code: OCRErrorCode
  ) {
    super(message);
    this.name = 'OCRError';
  }
}

export interface OCRResult {
  markdown: string;
  pageCount?: number;
}

export interface OCROptions {
  timeout?: number;
  maxRetries?: number;
}
