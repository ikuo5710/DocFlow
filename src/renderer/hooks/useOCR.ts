import { useState, useCallback, useEffect, useRef } from 'react';
import { OCRResult, OCROptions, OCRErrorCode } from '../../types/ocr';

interface OCRProcessRequest {
  filePath: string;
  options?: OCROptions;
}

interface OCRProcessMultipleRequest {
  filePaths: string[];
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

export interface OCRProgress {
  current: number;
  total: number;
  fileName: string;
}

export interface UseOCRState {
  isProcessing: boolean;
  result: OCRResult | null;
  error: string | null;
  errorCode: OCRErrorCode | null;
  progress: OCRProgress | null;
}

export interface UseOCRActions {
  processFile: (filePath: string, options?: OCROptions) => Promise<OCRResult | null>;
  processMultipleFiles: (filePaths: string[], options?: OCROptions) => Promise<OCRResult | null>;
  reset: () => void;
}

export type UseOCRReturn = UseOCRState & UseOCRActions;

const initialState: UseOCRState = {
  isProcessing: false,
  result: null,
  error: null,
  errorCode: null,
  progress: null,
};

export function useOCR(): UseOCRReturn {
  const [state, setState] = useState<UseOCRState>(initialState);
  const progressListenerRef = useRef<((...args: unknown[]) => void) | null>(null);

  // Clean up progress listener on unmount
  useEffect(() => {
    return () => {
      if (progressListenerRef.current) {
        window.electron.ipcRenderer.removeListener(
          'ocr:processMultiple:progress',
          progressListenerRef.current
        );
        progressListenerRef.current = null;
      }
    };
  }, []);

  const processMultipleFiles = useCallback(
    async (filePaths: string[], options?: OCROptions): Promise<OCRResult | null> => {
      setState({
        isProcessing: true,
        result: null,
        error: null,
        errorCode: null,
        progress: { current: 0, total: filePaths.length, fileName: '' },
      });

      // Set up progress listener
      const progressHandler = (...args: unknown[]) => {
        const progress = args[0] as OCRProgress;
        setState((prev) => ({ ...prev, progress }));
      };
      progressListenerRef.current = progressHandler;
      window.electron.ipcRenderer.on('ocr:processMultiple:progress', progressHandler);

      try {
        const request: OCRProcessMultipleRequest = { filePaths, options };
        const response = (await window.electron.ipcRenderer.invoke(
          'ocr:processMultiple',
          request
        )) as OCRProcessResponse;

        // Clean up progress listener
        window.electron.ipcRenderer.removeListener(
          'ocr:processMultiple:progress',
          progressHandler
        );
        progressListenerRef.current = null;

        if (response.success && response.result) {
          setState({
            isProcessing: false,
            result: response.result,
            error: null,
            errorCode: null,
            progress: null,
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
            progress: null,
          });
          return null;
        }
      } catch (error) {
        // Clean up progress listener
        window.electron.ipcRenderer.removeListener(
          'ocr:processMultiple:progress',
          progressHandler
        );
        progressListenerRef.current = null;

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setState({
          isProcessing: false,
          result: null,
          error: errorMessage,
          errorCode: 'API_ERROR',
          progress: null,
        });
        return null;
      }
    },
    []
  );

  const processFile = useCallback(
    async (filePath: string, options?: OCROptions): Promise<OCRResult | null> => {
      setState({
        isProcessing: true,
        result: null,
        error: null,
        errorCode: null,
        progress: null,
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
            progress: null,
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
            progress: null,
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
          progress: null,
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
    processMultipleFiles,
    reset,
  };
}

export default useOCR;
