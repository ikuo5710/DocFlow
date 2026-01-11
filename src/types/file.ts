export type FileType = 'pdf' | 'jpeg' | 'png';

export interface FileInfo {
  path: string;
  name: string;
  type: FileType;
  size: number;
  pageCount?: number; // PDF only
  width?: number; // Image only
  height?: number; // Image only
  previewDataUrl?: string; // Base64 data URL for preview
}

export type FileInputErrorCode =
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_CORRUPTED'
  | 'FILE_TOO_LARGE'
  | 'READ_ERROR';

export class FileInputError extends Error {
  constructor(
    message: string,
    public code: FileInputErrorCode
  ) {
    super(message);
    this.name = 'FileInputError';
  }
}

export interface FileValidationResult {
  valid: boolean;
  error?: FileInputError;
  fileInfo?: FileInfo;
}

// ファイル保存関連の型定義

export interface MarkdownMetadata {
  originalFilePath: string;
  processedAt: string;
}

export interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

export interface SaveFileResult {
  success: boolean;
  filePath?: string;
  error?: string;
}
