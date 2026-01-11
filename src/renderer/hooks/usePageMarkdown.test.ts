/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageMarkdown } from './usePageMarkdown';

describe('usePageMarkdown', () => {
  describe('初期化', () => {
    it('初期状態で空のMarkdownを返す', () => {
      const { result } = renderHook(() => usePageMarkdown(5));

      expect(result.current.getPageMarkdown(1)).toBe('');
      expect(result.current.getPageMarkdown(2)).toBe('');
      expect(result.current.hasContent).toBe(false);
    });
  });

  describe('setPageMarkdown', () => {
    it('指定ページにMarkdownを設定できる', () => {
      const { result } = renderHook(() => usePageMarkdown(5));

      act(() => {
        result.current.setPageMarkdown(1, '# Page 1');
      });

      expect(result.current.getPageMarkdown(1)).toBe('# Page 1');
      expect(result.current.hasContent).toBe(true);
    });

    it('複数ページにMarkdownを設定できる', () => {
      const { result } = renderHook(() => usePageMarkdown(5));

      act(() => {
        result.current.setPageMarkdown(1, '# Page 1');
        result.current.setPageMarkdown(2, '# Page 2');
        result.current.setPageMarkdown(3, '# Page 3');
      });

      expect(result.current.getPageMarkdown(1)).toBe('# Page 1');
      expect(result.current.getPageMarkdown(2)).toBe('# Page 2');
      expect(result.current.getPageMarkdown(3)).toBe('# Page 3');
    });

    it('同じページを上書きできる', () => {
      const { result } = renderHook(() => usePageMarkdown(5));

      act(() => {
        result.current.setPageMarkdown(1, '# Original');
      });
      act(() => {
        result.current.setPageMarkdown(1, '# Updated');
      });

      expect(result.current.getPageMarkdown(1)).toBe('# Updated');
    });
  });

  describe('initializeFromOCR', () => {
    it('OCR結果をページごとに分割して初期化する', () => {
      const { result } = renderHook(() => usePageMarkdown(3));
      const ocrResult = 'Page 1 content\n\n---\n\nPage 2 content\n\n---\n\nPage 3 content';

      act(() => {
        result.current.initializeFromOCR(ocrResult, 3);
      });

      expect(result.current.getPageMarkdown(1)).toBe('Page 1 content');
      expect(result.current.getPageMarkdown(2)).toBe('Page 2 content');
      expect(result.current.getPageMarkdown(3)).toBe('Page 3 content');
    });

    it('OCR結果がページ数より少ない場合、残りは空文字', () => {
      const { result } = renderHook(() => usePageMarkdown(5));
      const ocrResult = 'Page 1\n\n---\n\nPage 2';

      act(() => {
        result.current.initializeFromOCR(ocrResult, 5);
      });

      expect(result.current.getPageMarkdown(1)).toBe('Page 1');
      expect(result.current.getPageMarkdown(2)).toBe('Page 2');
      expect(result.current.getPageMarkdown(3)).toBe('');
      expect(result.current.getPageMarkdown(4)).toBe('');
      expect(result.current.getPageMarkdown(5)).toBe('');
    });

    it('単一ページの場合も正しく初期化される', () => {
      const { result } = renderHook(() => usePageMarkdown(1));
      const ocrResult = 'Single page content';

      act(() => {
        result.current.initializeFromOCR(ocrResult, 1);
      });

      expect(result.current.getPageMarkdown(1)).toBe('Single page content');
    });
  });

  describe('clearAll', () => {
    it('すべてのMarkdownをクリアする', () => {
      const { result } = renderHook(() => usePageMarkdown(3));

      act(() => {
        result.current.setPageMarkdown(1, '# Page 1');
        result.current.setPageMarkdown(2, '# Page 2');
      });
      act(() => {
        result.current.clearAll();
      });

      expect(result.current.getPageMarkdown(1)).toBe('');
      expect(result.current.getPageMarkdown(2)).toBe('');
      expect(result.current.hasContent).toBe(false);
    });
  });

  describe('getAllMarkdown', () => {
    it('すべてのページのMarkdownを結合して返す', () => {
      const { result } = renderHook(() => usePageMarkdown(3));

      act(() => {
        result.current.setPageMarkdown(1, 'Page 1');
        result.current.setPageMarkdown(2, 'Page 2');
        result.current.setPageMarkdown(3, 'Page 3');
      });

      const allMarkdown = result.current.getAllMarkdown();
      expect(allMarkdown).toBe('Page 1\n\n---\n\nPage 2\n\n---\n\nPage 3');
    });

    it('空のページはスキップされる', () => {
      const { result } = renderHook(() => usePageMarkdown(3));

      act(() => {
        result.current.setPageMarkdown(1, 'Page 1');
        result.current.setPageMarkdown(3, 'Page 3');
      });

      const allMarkdown = result.current.getAllMarkdown();
      expect(allMarkdown).toBe('Page 1\n\n---\n\nPage 3');
    });
  });

  describe('ページ切り替え時の保持', () => {
    it('ページを切り替えても編集内容は保持される', () => {
      const { result } = renderHook(() => usePageMarkdown(5));

      // ページ1を編集
      act(() => {
        result.current.setPageMarkdown(1, '# Page 1 edited');
      });

      // ページ2に移動して編集
      act(() => {
        result.current.setPageMarkdown(2, '# Page 2 edited');
      });

      // ページ1に戻る
      expect(result.current.getPageMarkdown(1)).toBe('# Page 1 edited');
      expect(result.current.getPageMarkdown(2)).toBe('# Page 2 edited');
    });
  });
});
