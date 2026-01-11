import { useState, useCallback } from 'react';
import { FileInfo } from '../../types/file';

/**
 * 複数ファイルの管理を行うカスタムフック
 *
 * @returns ファイルリスト管理関数
 */
export function useFileList() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);

  /**
   * 現在選択中のファイルを取得
   */
  const currentFile = currentFileIndex >= 0 ? files[currentFileIndex] : null;

  /**
   * ファイルを追加（重複チェック付き）
   */
  const addFiles = useCallback((newFiles: FileInfo[]): void => {
    setFiles((prev) => {
      const existingPaths = new Set(prev.map((f) => f.path));
      const uniqueNewFiles = newFiles.filter((f) => !existingPaths.has(f.path));

      if (uniqueNewFiles.length === 0) {
        return prev;
      }

      const updated = [...prev, ...uniqueNewFiles];

      // 最初のファイルを選択状態にする（まだ選択されていない場合）
      setCurrentFileIndex((prevIndex) => (prevIndex < 0 ? prev.length : prevIndex));

      return updated;
    });
  }, []);

  /**
   * 単一ファイルを追加
   */
  const addFile = useCallback(
    (file: FileInfo): void => {
      addFiles([file]);
    },
    [addFiles]
  );

  /**
   * ファイルを削除
   */
  const removeFile = useCallback((index: number): void => {
    setFiles((prev) => {
      if (index < 0 || index >= prev.length) {
        return prev;
      }

      const updated = prev.filter((_, i) => i !== index);

      // 選択中のファイルが削除された場合、選択を調整
      setCurrentFileIndex((prevIndex) => {
        if (updated.length === 0) {
          return -1;
        }
        if (prevIndex === index) {
          // 削除されたファイルが選択されていた場合、前のファイルを選択
          return Math.max(0, index - 1);
        }
        if (prevIndex > index) {
          // 選択中のファイルより前が削除された場合、インデックスを調整
          return prevIndex - 1;
        }
        return prevIndex;
      });

      return updated;
    });
  }, []);

  /**
   * ファイルを選択
   */
  const selectFile = useCallback(
    (index: number): void => {
      if (index >= 0 && index < files.length) {
        setCurrentFileIndex(index);
      }
    },
    [files.length]
  );

  /**
   * パスでファイルを選択
   */
  const selectFileByPath = useCallback(
    (path: string): void => {
      const index = files.findIndex((f) => f.path === path);
      if (index >= 0) {
        setCurrentFileIndex(index);
      }
    },
    [files]
  );

  /**
   * 前のファイルを選択
   */
  const selectPreviousFile = useCallback((): void => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  }, [currentFileIndex]);

  /**
   * 次のファイルを選択
   */
  const selectNextFile = useCallback((): void => {
    if (currentFileIndex < files.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    }
  }, [currentFileIndex, files.length]);

  /**
   * すべてのファイルをクリア
   */
  const clearAll = useCallback((): void => {
    setFiles([]);
    setCurrentFileIndex(-1);
  }, []);

  /**
   * ファイルリストを置き換え
   */
  const setFileList = useCallback((newFiles: FileInfo[]): void => {
    setFiles(newFiles);
    setCurrentFileIndex(newFiles.length > 0 ? 0 : -1);
  }, []);

  return {
    files,
    currentFile,
    currentFileIndex,
    addFile,
    addFiles,
    removeFile,
    selectFile,
    selectFileByPath,
    selectPreviousFile,
    selectNextFile,
    clearAll,
    setFileList,
    hasMultipleFiles: files.length > 1,
    totalFiles: files.length,
  };
}

export type UseFileListReturn = ReturnType<typeof useFileList>;
