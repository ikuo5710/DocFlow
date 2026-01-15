import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileInfo, OCRCacheCheckResult, OCRCacheReadResult } from '../../types/file';
import FileViewer from './FileViewer';
import Splitter from './Splitter';
import MarkdownEditor from './MarkdownEditor';
import Toast, { ToastType } from './Toast';
import { useOCR } from '../hooks/useOCR';
import { usePageMarkdown } from '../hooks/usePageMarkdown';
import { useFileSave } from '../hooks/useFileSave';

// Electron IPC interface
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      };
    };
  }
}

interface ParallelViewerProps {
  file: FileInfo;
  onClose: () => void;
}

const ParallelViewer: React.FC<ParallelViewerProps> = ({ file, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const { isProcessing, result, error, processFile, reset } = useOCR();

  const totalPages = file.pageCount ?? 1;

  // ページごとのMarkdown管理
  const {
    getPageMarkdown,
    setPageMarkdown,
    initializeFromOCR,
    clearAll: clearAllMarkdown,
    getAllMarkdown,
  } = usePageMarkdown(totalPages);

  // 現在のページのMarkdown内容
  const markdownContent = getPageMarkdown(currentPage);

  // ファイル保存
  const { isSaving, savedPath, error: saveError, saveFile, clearSavedPath, clearError: clearSaveError } = useFileSave();

  // Toast表示用の状態
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // キャッシュ読み込み状態
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  // Debug: log file info
  useEffect(() => {
    console.log('ParallelViewer file:', {
      path: file.path,
      name: file.name,
      type: file.type,
      size: file.size,
      pageCount: file.pageCount,
      hasPreviewDataUrl: !!file.previewDataUrl,
      previewDataUrlLength: file.previewDataUrl?.length ?? 0,
    });
  }, [file]);

  // Check for OCR cache and load it, or process OCR
  useEffect(() => {
    const loadFileContent = async () => {
      if (!file.path) return;

      clearAllMarkdown();
      setLoadedFromCache(false);

      try {
        // Check if OCR cache exists
        const cacheCheckResult = await window.electron.ipcRenderer.invoke(
          'file:checkOCRCache',
          file.path
        ) as OCRCacheCheckResult;

        if (cacheCheckResult.exists) {
          // Load from cache
          try {
            const cacheReadResult = await window.electron.ipcRenderer.invoke(
              'file:readOCRCache',
              file.path
            ) as OCRCacheReadResult;

            // Initialize markdown from cache
            initializeFromOCR(cacheReadResult.content, totalPages);
            setLoadedFromCache(true);

            // Show toast notification
            setToastMessage('Loaded from cached OCR result');
            setToastType('success');
            setToastVisible(true);

            return; // Skip OCR processing
          } catch (cacheReadError) {
            console.warn('Failed to read OCR cache, falling back to OCR:', cacheReadError);
            // Fall through to OCR processing
          }
        }

        // No cache or cache read failed, process OCR
        processFile(file.path);
      } catch (error) {
        console.error('Error checking OCR cache:', error);
        // Fall back to OCR processing
        processFile(file.path);
      }
    };

    loadFileContent();

    return () => {
      reset();
    };
  }, [file.path, processFile, reset, clearAllMarkdown, initializeFromOCR, totalPages]);

  // Update markdown content when OCR result is available
  useEffect(() => {
    if (result?.markdown) {
      // OCR結果をページごとに分割して初期化
      initializeFromOCR(result.markdown, totalPages);
    }
  }, [result, totalPages, initializeFromOCR]);

  const handleResize = useCallback((ratio: number) => {
    setSplitRatio(ratio);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom);
  }, []);

  const handleMarkdownChange = useCallback(
    (content: string) => {
      // 現在のページのMarkdownを更新
      setPageMarkdown(currentPage, content);
    },
    [currentPage, setPageMarkdown]
  );

  // 保存成功時のToast表示
  useEffect(() => {
    if (savedPath) {
      const fileName = savedPath.split(/[/\\]/).pop() ?? 'file';
      setToastMessage(`Saved: ${fileName}`);
      setToastType('success');
      setToastVisible(true);
      clearSavedPath();
    }
  }, [savedPath, clearSavedPath]);

  // 保存エラー時のToast表示
  useEffect(() => {
    if (saveError) {
      setToastMessage(saveError);
      setToastType('error');
      setToastVisible(true);
      clearSaveError();
    }
  }, [saveError, clearSaveError]);

  const handleSave = useCallback(async () => {
    // すべてのページのMarkdownを結合して保存
    const allMarkdown = getAllMarkdown();

    if (!allMarkdown.trim()) {
      setToastMessage('No content to save');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    // デフォルトファイル名: 元ファイル名 + "_ocr.md"
    const baseName = file.name.replace(/\.[^/.]+$/, ''); // 拡張子を除去
    const defaultFileName = `${baseName}_ocr.md`;

    // メタデータ
    const metadata = {
      originalFilePath: file.path,
      processedAt: new Date().toISOString(),
    };

    await saveFile(defaultFileName, allMarkdown, metadata);
  }, [getAllMarkdown, file.name, file.path, saveFile]);

  const handleCloseToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const handleRetryOCR = useCallback(() => {
    if (file.path) {
      processFile(file.path);
    }
  }, [file.path, processFile]);

  const leftWidth = `calc(${splitRatio * 100}% - 4px)`;
  const rightWidth = `calc(${(1 - splitRatio) * 100}% - 4px)`;

  return (
    <div className="parallel-viewer" ref={containerRef}>
      <div className="viewer-header">
        <div className="header-left">
          <button className="back-button" onClick={onClose} title="Back to file selection">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="file-name">{file.name}</span>
        </div>
        <div className="header-right">
          {isProcessing && (
            <span className="processing-indicator">Processing OCR...</span>
          )}
          {error && (
            <button className="retry-button" onClick={handleRetryOCR}>
              Retry OCR
            </button>
          )}
          <button
            className="save-button"
            onClick={handleSave}
            disabled={isProcessing || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="viewer-content">
        <div className="left-pane" style={{ width: leftWidth }}>
          <FileViewer
            file={file}
            currentPage={currentPage}
            totalPages={totalPages}
            zoomLevel={zoomLevel}
            onPageChange={handlePageChange}
            onZoomChange={handleZoomChange}
          />
        </div>

        <Splitter onResize={handleResize} containerRef={containerRef} />

        <div className="right-pane" style={{ width: rightWidth }}>
          {error ? (
            <div className="error-panel">
              <div className="error-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3>OCR Processing Failed</h3>
              <p>{error}</p>
              <button className="retry-button-large" onClick={handleRetryOCR}>
                Retry
              </button>
            </div>
          ) : (
            <MarkdownEditor
              content={markdownContent}
              onChange={handleMarkdownChange}
              readOnly={isProcessing}
              placeholder={isProcessing ? 'Processing OCR...' : 'OCR result will appear here...'}
            />
          )}
        </div>
      </div>

      <style>{`
        .parallel-viewer {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #f8fafc;
        }

        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          background-color: transparent;
          border-radius: 6px;
          cursor: pointer;
          color: #6b7280;
          transition: background-color 0.2s, color 0.2s;
        }

        .back-button:hover {
          background-color: #f3f4f6;
          color: #1e293b;
        }

        .file-name {
          font-size: 16px;
          font-weight: 500;
          color: #1e293b;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .processing-indicator {
          font-size: 14px;
          color: #6b7280;
        }

        .retry-button {
          padding: 8px 16px;
          border: 1px solid #dc2626;
          background-color: transparent;
          color: #dc2626;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .retry-button:hover {
          background-color: #fef2f2;
        }

        .save-button {
          padding: 8px 16px;
          border: none;
          background-color: #2563eb;
          color: #ffffff;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .save-button:hover:not(:disabled) {
          background-color: #1d4ed8;
        }

        .save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .viewer-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .left-pane,
        .right-pane {
          height: 100%;
          overflow: hidden;
        }

        .left-pane {
          background-color: #1e293b;
        }

        .right-pane {
          background-color: #ffffff;
        }

        .error-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 32px;
          text-align: center;
        }

        .error-icon {
          margin-bottom: 16px;
        }

        .error-panel h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .error-panel p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px 0;
          max-width: 300px;
        }

        .retry-button-large {
          padding: 12px 24px;
          border: none;
          background-color: #2563eb;
          color: #ffffff;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .retry-button-large:hover {
          background-color: #1d4ed8;
        }
      `}</style>

      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onClose={handleCloseToast}
      />
    </div>
  );
};

export default ParallelViewer;
