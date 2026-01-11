import { useState, useCallback } from 'react';
import { OCRResult, OCROptions, OCRErrorCode } from '../../types/ocr';

interface OCRProcessRequest {
  filePath: string;
  options?: OCROptions;
}

interface OCRProcessResponse {
  success: boolean;
  result?: OCRResult;
  error?: {
    message: string;
    code: OCRErrorCode;
  };
}

export interface UseOCRState {
  isProcessing: boolean;
  result: OCRResult | null;
  error: string | null;
  errorCode: OCRErrorCode | null;
}

export interface UseOCRActions {
  processFile: (filePath: string, options?: OCROptions) => Promise<OCRResult | null>;
  reset: () => void;
}

export type UseOCRReturn = UseOCRState & UseOCRActions;

const initialState: UseOCRState = {
  isProcessing: false,
  result: null,
  error: null,
  errorCode: null,
};

export function useOCR(): UseOCRReturn {
  const [state, setState] = useState<UseOCRState>(initialState);

  const processFile = useCallback(
    async (filePath: string, options?: OCROptions): Promise<OCRResult | null> => {
      setState({
        isProcessing: true,
        result: null,
        error: null,
        errorCode: null,
      });

      try {
        const request: OCRProcessRequest = { filePath, options };
        const response = (await window.electron.ipcRenderer.invoke(
          'ocr:process',
          request
        )) as OCRProcessResponse;

        if (response.success && response.result) {
          setState({
            isProcessing: false,
            result: response.result,
            error: null,
            errorCode: null,
          });
          return response.result;
        } else {
          const errorMessage = response.error?.message ?? 'OCR processing failed';
          const errorCode = response.error?.code ?? 'API_ERROR';
          setState({
            isProcessing: false,
            result: null,
            error: errorMessage,
            errorCode,
          });
          return null;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setState({
          isProcessing: false,
          result: null,
          error: errorMessage,
          errorCode: 'API_ERROR',
        });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    processFile,
    reset,
  };
}

export default useOCR;
