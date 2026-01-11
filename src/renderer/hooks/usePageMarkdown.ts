import { useState, useCallback, useMemo } from 'react';

/**
 * OCR結果をページごとに分割するためのセパレータ
 * Mistral OCRはページ間を "---" で区切る
 */
const PAGE_SEPARATOR = '\n\n---\n\n';

/**
 * ページごとのMarkdown管理を行うカスタムフック
 *
 * @param totalPages - 総ページ数
 * @returns ページごとのMarkdown管理関数
 */
export function usePageMarkdown(totalPages: number) {
  // ページ番号をキーにMarkdown内容を保持
  const [pageMarkdowns, setPageMarkdowns] = useState<Map<number, string>>(
    () => new Map()
  );

  /**
   * 指定ページのMarkdownを取得
   */
  const getPageMarkdown = useCallback(
    (page: number): string => {
      return pageMarkdowns.get(page) ?? '';
    },
    [pageMarkdowns]
  );

  /**
   * 指定ページのMarkdownを設定
   */
  const setPageMarkdown = useCallback(
    (page: number, content: string): void => {
      setPageMarkdowns((prev) => {
        const next = new Map(prev);
        next.set(page, content);
        return next;
      });
    },
    []
  );

  /**
   * OCR結果からページごとのMarkdownを初期化
   * Mistral OCRは複数ページの結果を "---" で区切って返す
   */
  const initializeFromOCR = useCallback(
    (ocrResult: string, pageCount: number): void => {
      const pages = ocrResult.split(PAGE_SEPARATOR);
      const newMarkdowns = new Map<number, string>();

      for (let i = 0; i < pageCount; i++) {
        // OCR結果のページ数とPDFのページ数が一致しない場合に対応
        const content = pages[i]?.trim() ?? '';
        newMarkdowns.set(i + 1, content);
      }

      setPageMarkdowns(newMarkdowns);
    },
    []
  );

  /**
   * すべてのMarkdownをクリア
   */
  const clearAll = useCallback((): void => {
    setPageMarkdowns(new Map());
  }, []);

  /**
   * すべてのページのMarkdownを結合して返す
   */
  const getAllMarkdown = useCallback((): string => {
    const markdowns: string[] = [];
    for (let i = 1; i <= totalPages; i++) {
      const content = pageMarkdowns.get(i) ?? '';
      if (content) {
        markdowns.push(content);
      }
    }
    return markdowns.join(PAGE_SEPARATOR);
  }, [pageMarkdowns, totalPages]);

  /**
   * 変更があるページがあるかどうか
   */
  const hasContent = useMemo(() => {
    for (const content of pageMarkdowns.values()) {
      if (content.trim()) {
        return true;
      }
    }
    return false;
  }, [pageMarkdowns]);

  return {
    pageMarkdowns,
    getPageMarkdown,
    setPageMarkdown,
    initializeFromOCR,
    clearAll,
    getAllMarkdown,
    hasContent,
  };
}

export type UsePageMarkdownReturn = ReturnType<typeof usePageMarkdown>;
