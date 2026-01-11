/**
 * Markdownコマンド実行フック
 *
 * CodeMirror EditorViewに対するMarkdown編集コマンドを提供
 */
import { useCallback, useState, useEffect } from 'react';
import { EditorView } from '@codemirror/view';
import { undo, redo, undoDepth, redoDepth } from '@codemirror/commands';
import {
  applyBold,
  applyItalic,
  applyStrikethrough,
  toggleHeading,
  insertCode,
  insertLink,
  toggleBulletList,
  toggleNumberedList,
  toggleQuote,
} from '../utils/markdownCommands';

export interface UseMarkdownCommandsReturn {
  // 書式コマンド
  execBold: () => void;
  execItalic: () => void;
  execStrikethrough: () => void;
  execHeading: (level: 1 | 2 | 3) => void;
  execCode: () => void;
  execLink: () => void;
  execBulletList: () => void;
  execNumberedList: () => void;
  execQuote: () => void;

  // Undo/Redo
  execUndo: () => void;
  execRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useMarkdownCommands(
  view: EditorView | null
): UseMarkdownCommandsReturn {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Undo/Redo状態を更新
  const updateUndoRedoState = useCallback(() => {
    if (view) {
      setCanUndo(undoDepth(view.state) > 0);
      setCanRedo(redoDepth(view.state) > 0);
    } else {
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [view]);

  // EditorViewの状態変更を監視
  useEffect(() => {
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  const execBold = useCallback(() => {
    if (view) {
      applyBold(view);
      updateUndoRedoState();
    }
  }, [view, updateUndoRedoState]);

  const execItalic = useCallback(() => {
    if (view) {
      applyItalic(view);
      updateUndoRedoState();
    }
  }, [view, updateUndoRedoState]);

  const execStrikethrough = useCallback(() => {
    if (view) {
      applyStrikethrough(view);
      updateUndoRedoState();
    }
  }, [view, updateUndoRedoState]);

  const execHeading = useCallback(
    (level: 1 | 2 | 3) => {
      if (view) {
        toggleHeading(view, level);
        updateUndoRedoState();
      }
    },
    [view, updateUndoRedoState]
  );

  const execCode = useCallback(() => {
    if (view) {
      insertCode(view);
      updateUndoRedoState();
    }
  }, [view, updateUndoRedoState]);

  const execLink = useCallback(() => {
    if (view) {
      insertLink(view);
      updateUndoRedoState();
    }
  }, [view, updateUndoRedoState]);

  const execBulletList = useCallback(() => {
    if (view) {
      toggleBulletList(view);
      updateUndoRedoState();
    }
  }, [view, updateUndoRedoState]);

  const execNumberedList = useCallback(() => {
    if (view) {
      toggleNumberedList(view);
      updateUndoRedoState();
    }
  }, [view, updateUndoRedoState]);

  const execQuote = useCallback(() => {
    if (view) {
      toggleQuote(view);
      updateUndoRedoState();
    }
  }, [view, updateUndoRedoState]);

  const execUndo = useCallback(() => {
    if (view) {
      undo(view);
      updateUndoRedoState();
    }
  }, [view, updateUndoRedoState]);

  const execRedo = useCallback(() => {
    if (view) {
      redo(view);
      updateUndoRedoState();
    }
  }, [view, updateUndoRedoState]);

  return {
    execBold,
    execItalic,
    execStrikethrough,
    execHeading,
    execCode,
    execLink,
    execBulletList,
    execNumberedList,
    execQuote,
    execUndo,
    execRedo,
    canUndo,
    canRedo,
  };
}

export type { UseMarkdownCommandsReturn as MarkdownCommandsReturn };
