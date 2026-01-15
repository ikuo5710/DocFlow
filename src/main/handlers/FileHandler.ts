import * as fs from 'fs/promises';
import * as path from 'path';
import { dialog, BrowserWindow } from 'electron';
import pdf from 'pdf-parse';
import {
  FileInfo,
  FileType,
  FileInputError,
  FileValidationResult,
  MarkdownMetadata,
  SaveDialogResult,
  SaveFileResult,
} from '../../types/file';

export class FileHandler {
  private static readonly SUPPORTED_EXTENSIONS = [
    '.pdf',
    '.png',
    '.jpg',
    '.jpeg',
  ];
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  async validateFile(filePath: string): Promise<FileValidationResult> {
    try {
      // Check if file exists
      const stats = await fs.stat(filePath);

      // Check file size
      if (stats.size > FileHandler.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: new FileInputError(
            'File size exceeds 100MB limit',
            'FILE_TOO_LARGE'
          ),
        };
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (!FileHandler.SUPPORTED_EXTENSIONS.includes(ext)) {
        return {
          valid: false,
          error: new FileInputError(
            `Unsupported file format: ${ext}`,
            'UNSUPPORTED_FORMAT'
          ),
        };
      }

      // Determine file type
      const fileType = this.getFileType(ext);

      // Basic file info
      const fileInfo: FileInfo = {
        path: filePath,
        name: path.basename(filePath),
        type: fileType,
        size: stats.size,
      };

      // Generate preview data URL
      fileInfo.previewDataUrl = await this.generatePreviewDataUrl(
        filePath,
        fileType
      );

      // Extract metadata based on file type
      if (fileType === 'pdf') {
        const pdfMetadata = await this.extractPDFMetadata(filePath);
        fileInfo.pageCount = pdfMetadata.pageCount;
      }

      return {
        valid: true,
        fileInfo,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return {
          valid: false,
          error: new FileInputError('File not found', 'READ_ERROR'),
        };
      }

      return {
        valid: false,
        error: new FileInputError(
          `Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'READ_ERROR'
        ),
      };
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      throw new FileInputError(
        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'READ_ERROR'
      );
    }
  }

  async extractPDFMetadata(
    filePath: string
  ): Promise<{ pageCount: number }> {
    try {
      const dataBuffer = await this.readFile(filePath);
      const data = await pdf(dataBuffer);

      return {
        pageCount: data.numpages,
      };
    } catch (error) {
      throw new FileInputError(
        `Failed to extract PDF metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FILE_CORRUPTED'
      );
    }
  }

  private getFileType(extension: string): FileType {
    switch (extension.toLowerCase()) {
      case '.pdf':
        return 'pdf';
      case '.png':
        return 'png';
      case '.jpg':
      case '.jpeg':
        return 'jpeg';
      default:
        throw new FileInputError(
          `Unsupported file format: ${extension}`,
          'UNSUPPORTED_FORMAT'
        );
    }
  }

  private async generatePreviewDataUrl(
    filePath: string,
    fileType: FileType
  ): Promise<string> {
    try {
      const buffer = await this.readFile(filePath);
      const base64 = buffer.toString('base64');

      const mimeType = this.getMimeType(fileType);
      return `data:${mimeType};base64,${base64}`;
    } catch {
      // Return empty string if preview generation fails
      return '';
    }
  }

  private getMimeType(fileType: FileType): string {
    switch (fileType) {
      case 'pdf':
        return 'application/pdf';
      case 'png':
        return 'image/png';
      case 'jpeg':
        return 'image/jpeg';
    }
  }

  /**
   * OCRキャッシュファイルのパスを生成する
   * 例: /path/to/document.pdf → /path/to/document_ocr.md
   */
  getOCRCachePath(originalFilePath: string): string {
    // 拡張子を除去してから _ocr.md を付加
    const lastDotIndex = originalFilePath.lastIndexOf('.');
    const basePath = lastDotIndex > 0 ? originalFilePath.slice(0, lastDotIndex) : originalFilePath;
    return `${basePath}_ocr.md`;
  }

  /**
   * OCRキャッシュファイルの存在をチェックする
   */
  async checkOCRCacheExists(
    originalFilePath: string
  ): Promise<{ exists: boolean; cachePath: string }> {
    const cachePath = this.getOCRCachePath(originalFilePath);
    try {
      await fs.access(cachePath);
      return { exists: true, cachePath };
    } catch {
      return { exists: false, cachePath };
    }
  }

  /**
   * OCRキャッシュファイルを読み込む
   */
  async readOCRCache(originalFilePath: string): Promise<{ content: string }> {
    const cachePath = this.getOCRCachePath(originalFilePath);
    try {
      const content = await fs.readFile(cachePath, 'utf-8');
      return { content };
    } catch (error) {
      throw new FileInputError(
        `Failed to read OCR cache file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'READ_ERROR'
      );
    }
  }

  /**
   * 保存ダイアログを表示する
   */
  async showSaveDialog(defaultFileName: string): Promise<SaveDialogResult> {
    const focusedWindow = BrowserWindow.getFocusedWindow();

    const options = {
      defaultPath: defaultFileName,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    };

    const result = focusedWindow
      ? await dialog.showSaveDialog(focusedWindow, options)
      : await dialog.showSaveDialog(options);

    return {
      canceled: result.canceled,
      filePath: result.filePath,
    };
  }

  /**
   * Markdownファイルを保存する
   */
  async saveMarkdown(
    filePath: string,
    content: string,
    metadata?: MarkdownMetadata
  ): Promise<SaveFileResult> {
    try {
      let fileContent = content;

      // メタデータがある場合はYAML Front Matterとして追加
      if (metadata) {
        const frontMatter = [
          '---',
          `original_file: ${metadata.originalFilePath}`,
          `processed_at: ${metadata.processedAt}`,
          '---',
          '',
        ].join('\n');
        fileContent = frontMatter + content;
      }

      await fs.writeFile(filePath, fileContent, 'utf-8');

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // エラーの種類を判別
      if (error instanceof Error && 'code' in error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'EACCES' || code === 'EPERM') {
          return {
            success: false,
            error: 'Permission denied: Cannot write to the specified location',
          };
        }
        if (code === 'ENOSPC') {
          return {
            success: false,
            error: 'Disk space is full',
          };
        }
      }

      return {
        success: false,
        error: `Failed to save file: ${errorMessage}`,
      };
    }
  }
}
