import React, { useCallback, useEffect } from 'react';
import { FileInfo } from '../../types/file';

interface FileNavigatorProps {
  files: FileInfo[];
  currentFileIndex: number;
  onSelectFile: (index: number) => void;
  onSelectPrevious: () => void;
  onSelectNext: () => void;
  onRemoveFile: (index: number) => void;
}

const FileNavigator: React.FC<FileNavigatorProps> = ({
  files,
  currentFileIndex,
  onSelectFile,
  onSelectPrevious,
  onSelectNext,
  onRemoveFile,
}) => {
  const hasPrevious = currentFileIndex > 0;
  const hasNext = currentFileIndex < files.length - 1;

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when focus is in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      // Ignore when focus is in CodeMirror editor
      if (e.target instanceof HTMLElement && e.target.closest('.cm-editor')) {
        return;
      }

      // Ctrl+左右矢印でファイル間移動
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowLeft' && hasPrevious) {
          e.preventDefault();
          onSelectPrevious();
        } else if (e.key === 'ArrowRight' && hasNext) {
          e.preventDefault();
          onSelectNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrevious, hasNext, onSelectPrevious, onSelectNext]);

  const handleRemove = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      onRemoveFile(index);
    },
    [onRemoveFile]
  );

  const getFileIcon = (type: string) => {
    if (type === 'pdf') {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 12h4" />
          <path d="M10 16h4" />
        </svg>
      );
    }
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  };

  if (files.length <= 1) {
    return null;
  }

  return (
    <div className="file-navigator">
      <div className="file-nav-controls">
        <button
          type="button"
          className="file-nav-button"
          onClick={onSelectPrevious}
          disabled={!hasPrevious}
          aria-label="Previous file"
          title="Previous file (Ctrl+Left)"
        >
          ◀
        </button>
        <span className="file-nav-info">
          File {currentFileIndex + 1} / {files.length}
        </span>
        <button
          type="button"
          className="file-nav-button"
          onClick={onSelectNext}
          disabled={!hasNext}
          aria-label="Next file"
          title="Next file (Ctrl+Right)"
        >
          ▶
        </button>
      </div>

      <div className="file-list">
        {files.map((file, index) => (
          <div
            key={file.path}
            className={`file-item ${index === currentFileIndex ? 'active' : ''}`}
            onClick={() => onSelectFile(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectFile(index);
              }
            }}
          >
            <span className="file-icon">{getFileIcon(file.type)}</span>
            <span className="file-name" title={file.name}>
              {file.name}
            </span>
            <button
              type="button"
              className="file-remove"
              onClick={(e) => handleRemove(e, index)}
              aria-label={`Remove ${file.name}`}
              title="Remove file"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .file-navigator {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px 12px;
          background-color: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .file-nav-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .file-nav-button {
          width: 28px;
          height: 28px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background-color: #ffffff;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .file-nav-button:hover:not(:disabled) {
          background-color: #f3f4f6;
          border-color: #2563eb;
        }

        .file-nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-nav-info {
          font-size: 13px;
          color: #6b7280;
        }

        .file-list {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          min-width: 120px;
          max-width: 180px;
          transition: all 0.2s;
        }

        .file-item:hover {
          border-color: #2563eb;
          background-color: #eff6ff;
        }

        .file-item.active {
          border-color: #2563eb;
          background-color: #dbeafe;
        }

        .file-icon {
          flex-shrink: 0;
          color: #6b7280;
        }

        .file-item.active .file-icon {
          color: #2563eb;
        }

        .file-name {
          flex: 1;
          font-size: 13px;
          color: #374151;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-remove {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          border: none;
          background-color: transparent;
          color: #9ca3af;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .file-remove:hover {
          background-color: #fee2e2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default FileNavigator;
