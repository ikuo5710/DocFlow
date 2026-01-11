/**
 * EditorToolbar - Markdown編集ツールバーコンポーネント
 *
 * 書式設定ボタン、Undo/Redoボタンを提供
 */
import React, { useCallback } from 'react';

export type MarkdownCommand =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'strikethrough' }
  | { type: 'heading'; level: 1 | 2 | 3 }
  | { type: 'code' }
  | { type: 'link' }
  | { type: 'bulletList' }
  | { type: 'numberedList' }
  | { type: 'quote' }
  | { type: 'undo' }
  | { type: 'redo' };

interface EditorToolbarProps {
  onCommand: (command: MarkdownCommand) => void;
  canUndo: boolean;
  canRedo: boolean;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  shortcut?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  disabled,
  title,
  children,
  shortcut,
}) => {
  const tooltipText = shortcut ? `${title} (${shortcut})` : title;

  return (
    <button
      type="button"
      className="toolbar-button"
      onClick={onClick}
      disabled={disabled}
      title={tooltipText}
      aria-label={title}
    >
      {children}
    </button>
  );
};

const ToolbarDivider: React.FC = () => <div className="toolbar-divider" />;

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onCommand,
  canUndo,
  canRedo,
  disabled = false,
}) => {
  const handleCommand = useCallback(
    (command: MarkdownCommand) => {
      if (!disabled) {
        onCommand(command);
      }
    },
    [onCommand, disabled]
  );

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Markdown formatting">
      {/* 書式ボタン */}
      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => handleCommand({ type: 'bold' })}
          disabled={disabled}
          title="太字"
          shortcut="Ctrl+B"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleCommand({ type: 'italic' })}
          disabled={disabled}
          title="イタリック"
          shortcut="Ctrl+I"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleCommand({ type: 'strikethrough' })}
          disabled={disabled}
          title="取り消し線"
        >
          <s>S</s>
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* 見出しボタン */}
      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => handleCommand({ type: 'heading', level: 1 })}
          disabled={disabled}
          title="見出し1"
          shortcut="Ctrl+1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleCommand({ type: 'heading', level: 2 })}
          disabled={disabled}
          title="見出し2"
          shortcut="Ctrl+2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleCommand({ type: 'heading', level: 3 })}
          disabled={disabled}
          title="見出し3"
          shortcut="Ctrl+3"
        >
          H3
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* コード・リンクボタン */}
      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => handleCommand({ type: 'code' })}
          disabled={disabled}
          title="コード"
          shortcut="Ctrl+`"
        >
          {'</>'}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleCommand({ type: 'link' })}
          disabled={disabled}
          title="リンク"
          shortcut="Ctrl+K"
        >
          {'🔗'}
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* リスト・引用ボタン */}
      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => handleCommand({ type: 'bulletList' })}
          disabled={disabled}
          title="箇条書き"
        >
          {'•'}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleCommand({ type: 'numberedList' })}
          disabled={disabled}
          title="番号付きリスト"
        >
          {'1.'}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleCommand({ type: 'quote' })}
          disabled={disabled}
          title="引用"
        >
          {'❝'}
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* Undo/Redoボタン */}
      <div className="toolbar-group">
        <ToolbarButton
          onClick={() => handleCommand({ type: 'undo' })}
          disabled={disabled || !canUndo}
          title="元に戻す"
          shortcut="Ctrl+Z"
        >
          {'↩'}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => handleCommand({ type: 'redo' })}
          disabled={disabled || !canRedo}
          title="やり直し"
          shortcut="Ctrl+Shift+Z"
        >
          {'↪'}
        </ToolbarButton>
      </div>

      <style>{`
        .editor-toolbar {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          background-color: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          gap: 4px;
          flex-wrap: wrap;
        }

        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .toolbar-divider {
          width: 1px;
          height: 20px;
          background-color: #e5e7eb;
          margin: 0 4px;
        }

        .toolbar-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          border-radius: 4px;
          background-color: transparent;
          color: #374151;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .toolbar-button:hover:not(:disabled) {
          background-color: #e5e7eb;
        }

        .toolbar-button:active:not(:disabled) {
          background-color: #dbeafe;
        }

        .toolbar-button:disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }

        .toolbar-button strong {
          font-weight: 700;
        }

        .toolbar-button em {
          font-style: italic;
        }

        .toolbar-button s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
};

export default EditorToolbar;
