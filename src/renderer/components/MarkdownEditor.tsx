import React, { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

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

  const handleChange = useCallback(
    (update: { state: EditorState; docChanged: boolean }) => {
      if (update.docChanged && !isInternalUpdate.current) {
        onChange(update.state.doc.toString());
      }
    },
    [onChange]
  );

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
        EditorView.updateListener.of(handleChange),
        EditorView.editable.of(!readOnly),
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

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [handleChange, readOnly]);

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
      <div className="editor-container" ref={editorRef}>
        {!content && (
          <div className="editor-placeholder">{placeholder}</div>
        )}
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
