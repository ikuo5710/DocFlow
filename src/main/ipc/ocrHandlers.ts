import { ipcMain } from 'electron';
import { OCRService } from '../services/OCRService';
import { OCRResult, OCROptions, OCRError } from '../../types/ocr';

let ocrService: OCRService | null = null;

function getOCRService(): OCRService {
  if (!ocrService) {
    ocrService = new OCRService();
  }
  return ocrService;
}

export interface OCRProcessRequest {
  filePath: string;
  options?: OCROptions;
}

export interface OCRProcessResponse {
  success: boolean;
  result?: OCRResult;
  error?: {
    message: string;
    code: string;
  };
}

export function registerOCRHandlers(): void {
  ipcMain.handle(
    'ocr:process',
    async (_event, request: OCRProcessRequest): Promise<OCRProcessResponse> => {
      try {
        const service = getOCRService();
        const result = await service.processFile(
          request.filePath,
          request.options
        );
        return {
          success: true,
          result,
        };
      } catch (error) {
        if (error instanceof OCRError) {
          return {
            success: false,
            error: {
              message: error.message,
              code: error.code,
            },
          };
        }

        return {
          success: false,
          error: {
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
            code: 'API_ERROR',
          },
        };
      }
    }
  );
}
