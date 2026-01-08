import * as fs from 'fs/promises';
import * as path from 'path';
import pdf from 'pdf-parse';
import {
  FileInfo,
  FileType,
  FileInputError,
  FileValidationResult,
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
}
