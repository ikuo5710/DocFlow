import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, ViewUpdate } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import EditorToolbar, { MarkdownCommand, EditorViewMode } from './EditorToolbar';
import MarkdownPreview from './MarkdownPreview';
import { useMarkdownCommands } from '../hooks/useMarkdownCommands';
import {
  applyBold,
  applyItalic,
  insertCode,
  insertLink,
  toggleHeading,
} from '../utils/markdownCommands';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  readOnly = false,
  placeholder = 'OCR result will appear here...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInternalUpdate = useRef(false);
  const onChangeRef = useRef(onChange);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [viewMode, setViewMode] = useState<EditorViewMode>('text');

  // onChangeをrefで保持（エディタ再生成を防ぐ）
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Markdownコマンドフック（ツールバー用）
  const {
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
  } = useMarkdownCommands(editorView);

  // 変更ハンドラ（refを使用して最新のonChangeを呼ぶ）
  const handleChange = useCallback((update: ViewUpdate) => {
    if (update.docChanged && !isInternalUpdate.current) {
      onChangeRef.current(update.state.doc.toString());
    }
  }, []);

  // 表示モード切り替えハンドラ
  const handleViewModeChange = useCallback((mode: EditorViewMode) => {
    setViewMode(mode);
  }, []);

  // ツールバーコマンドのハンドラ
  const handleCommand = useCallback(
    (command: MarkdownCommand) => {
      switch (command.type) {
        case 'bold':
          execBold();
          break;
        case 'italic':
          execItalic();
          break;
        case 'strikethrough':
          execStrikethrough();
          break;
        case 'heading':
          execHeading(command.level);
          break;
        case 'code':
          execCode();
          break;
        case 'link':
          execLink();
          break;
        case 'bulletList':
          execBulletList();
          break;
        case 'numberedList':
          execNumberedList();
          break;
        case 'quote':
          execQuote();
          break;
        case 'undo':
          execUndo();
          break;
        case 'redo':
          execRedo();
          break;
      }
    },
    [
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
    ]
  );

  // キーボードショートカットのキーマップ（メモ化して再生成を防止）
  const markdownKeymap = useMemo(
    () =>
      keymap.of([
        { key: 'Mod-b', run: (view) => applyBold(view) },
        { key: 'Mod-i', run: (view) => applyItalic(view) },
        { key: 'Mod-`', run: (view) => insertCode(view) },
        { key: 'Mod-k', run: (view) => insertLink(view) },
        { key: 'Mod-1', run: (view) => toggleHeading(view, 1) },
        { key: 'Mod-2', run: (view) => toggleHeading(view, 2) },
        { key: 'Mod-3', run: (view) => toggleHeading(view, 3) },
      ]),
    []
  );

  // Ctrl+Shift+P でプレビュー切り替え（グローバルキーボードショートカット）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'text' ? 'preview' : 'text'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdownKeymap,
        EditorView.updateListener.of(handleChange),
        EditorView.editable.of(!readOnly),
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
          '.cm-content': {
            padding: '16px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          },
          '.cm-line': {
            wordBreak: 'break-word',
          },
          '.cm-gutters': {
            backgroundColor: '#f8fafc',
            borderRight: '1px solid #e5e7eb',
            color: '#9ca3af',
          },
          '.cm-activeLineGutter': {
            backgroundColor: '#e5e7eb',
          },
          '.cm-activeLine': {
            backgroundColor: '#f3f4f6',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    setEditorView(view);

    return () => {
      view.destroy();
      viewRef.current = null;
      setEditorView(null);
    };
  }, [readOnly, handleChange, markdownKeymap]);

  // content変更時にエディタを更新
  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== content) {
        isInternalUpdate.current = true;
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: content,
          },
        });
        isInternalUpdate.current = false;
      }
    }
  }, [content]);


  return (
    <div className="markdown-editor">
      <div className="editor-header">
        <span className="editor-title">Markdown</span>
        {readOnly && <span className="readonly-badge">Read Only</span>}
      </div>
      <EditorToolbar
        onCommand={handleCommand}
        canUndo={canUndo}
        canRedo={canRedo}
        disabled={readOnly}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
      <div className="editor-content-area">
        <div
          className="editor-container"
          ref={editorRef}
          style={{ display: viewMode === 'text' ? 'flex' : 'none' }}
        >
          {!content && (
            <div className="editor-placeholder">{placeholder}</div>
          )}
        </div>
        {viewMode === 'preview' && <MarkdownPreview content={content} />}
      </div>

      <style>{`
        .markdown-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: #ffffff;
        }

        .editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background-color: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .editor-title {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .readonly-badge {
          font-size: 12px;
          padding: 2px 8px;
          background-color: #fef3c7;
          color: #92400e;
          border-radius: 4px;
        }

        .editor-content-area {
          flex: 1;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .editor-container {
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .editor-container .cm-editor {
          height: 100%;
        }

        .editor-placeholder {
          position: absolute;
          top: 16px;
          left: 60px;
          color: #9ca3af;
          font-size: 14px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;
