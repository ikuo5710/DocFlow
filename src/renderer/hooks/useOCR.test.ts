/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOCR } from './useOCR';

const mockInvoke = vi.fn();
const mockOn = vi.fn();
const mockRemoveListener = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom 環境では window が存在するので electron プロパティだけ追加
  Object.defineProperty(window, 'electron', {
    value: {
      ipcRenderer: {
        invoke: mockInvoke,
        on: mockOn,
        removeListener: mockRemoveListener,
      },
    },
    writable: true,
    configurable: true,
  });
});

describe('useOCR', () => {
  describe('processMultipleFiles', () => {
    it('should process multiple files and return result', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        result: {
          markdown: '# Page 1\n\n---\n\n# Page 2',
          pageCount: 2,
        },
      });

      const { result } = renderHook(() => useOCR());

      let ocrResult: unknown;
      await act(async () => {
        ocrResult = await result.current.processMultipleFiles([
          '/path/a.png',
          '/path/b.png',
        ]);
      });

      expect(mockInvoke).toHaveBeenCalledWith('ocr:processMultiple', {
        filePaths: ['/path/a.png', '/path/b.png'],
        options: undefined,
      });
      expect(ocrResult).toEqual({
        markdown: '# Page 1\n\n---\n\n# Page 2',
        pageCount: 2,
      });
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.result).toEqual({
        markdown: '# Page 1\n\n---\n\n# Page 2',
        pageCount: 2,
      });
      expect(result.current.progress).toBeNull();
    });

    it('should register and clean up progress listener', async () => {
      mockInvoke.mockResolvedValue({
        success: true,
        result: { markdown: '# Content', pageCount: 1 },
      });

      const { result } = renderHook(() => useOCR());

      await act(async () => {
        await result.current.processMultipleFiles(['/path/a.png']);
      });

      expect(mockOn).toHaveBeenCalledWith(
        'ocr:processMultiple:progress',
        expect.any(Function)
      );
      expect(mockRemoveListener).toHaveBeenCalledWith(
        'ocr:processMultiple:progress',
        expect.any(Function)
      );
    });

    it('should handle error response', async () => {
      mockInvoke.mockResolvedValue({
        success: false,
        error: { message: 'API failure', code: 'API_ERROR' },
      });

      const { result } = renderHook(() => useOCR());

      let ocrResult: unknown;
      await act(async () => {
        ocrResult = await result.current.processMultipleFiles(['/path/a.png']);
      });

      expect(ocrResult).toBeNull();
      expect(result.current.error).toBe('API failure');
      expect(result.current.errorCode).toBe('API_ERROR');
    });

    it('should handle thrown error', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useOCR());

      await act(async () => {
        await result.current.processMultipleFiles(['/path/a.png']);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.errorCode).toBe('API_ERROR');
      expect(result.current.progress).toBeNull();
    });
  });
});
