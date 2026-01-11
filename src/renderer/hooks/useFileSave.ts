import { useState, useCallback } from 'react';
import { MarkdownMetadata, SaveFileResult } from '../../types/file';

interface UseFileSaveReturn {
  isSaving: boolean;
  savedPath: string | null;
  error: string | null;
  saveFile: (
    defaultFileName: string,
    content: string,
    metadata?: MarkdownMetadata
  ) => Promise<boolean>;
  clearError: () => void;
  clearSavedPath: () => void;
}

/**
 * ファイル保存機能を提供するカスタムフック
 */
export function useFileSave(): UseFileSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveFile = useCallback(
    async (
      defaultFileName: string,
      content: string,
      metadata?: MarkdownMetadata
    ): Promise<boolean> => {
      setIsSaving(true);
      setError(null);
      setSavedPath(null);

      try {
        // 保存ダイアログを表示
        const dialogResult = (await window.electron.ipcRenderer.invoke(
          'file:showSaveDialog',
          defaultFileName
        )) as { canceled: boolean; filePath?: string };

        if (dialogResult.canceled || !dialogResult.filePath) {
          setIsSaving(false);
          return false;
        }

        // ファイルを保存
        const saveResult = (await window.electron.ipcRenderer.invoke(
          'file:save',
          dialogResult.filePath,
          content,
          metadata
        )) as SaveFileResult;

        if (!saveResult.success) {
          setError(saveResult.error ?? 'Unknown error occurred');
          setIsSaving(false);
          return false;
        }

        setSavedPath(saveResult.filePath ?? dialogResult.filePath);
        setIsSaving(false);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to save file';
        setError(errorMessage);
        setIsSaving(false);
        return false;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSavedPath = useCallback(() => {
    setSavedPath(null);
  }, []);

  return {
    isSaving,
    savedPath,
    error,
    saveFile,
    clearError,
    clearSavedPath,
  };
}

export type { UseFileSaveReturn };
