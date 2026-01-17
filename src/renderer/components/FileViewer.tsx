import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FileInfo } from '../../types/file';
import PageNavigator from './PageNavigator';

pdfjs.GlobalWorkerOptions.workerSrc = './pdf.worker.min.mjs';

interface FileViewerProps {
  file: FileInfo;
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  currentPage,
  totalPages,
  zoomLevel,
  onPageChange,
  onZoomChange,
}) => {
  const [pdfError, setPdfError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleZoomIn = useCallback(() => {
    onZoomChange(Math.min(zoomLevel + 0.25, 3.0));
  }, [zoomLevel, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    onZoomChange(Math.max(zoomLevel - 0.25, 0.25));
  }, [zoomLevel, onZoomChange]);

  const handlePdfLoadError = () => {
    setPdfError(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const renderContent = () => {
    if (file.type === 'pdf') {
      if (pdfError) {
        return (
          <div className="viewer-placeholder">
            <span className="placeholder-icon">PDF</span>
            <span className="placeholder-text">Failed to load PDF</span>
          </div>
        );
      }

      // Use previewDataUrl (base64 data URL) for PDFs
      if (!file.previewDataUrl) {
        return (
          <div className="viewer-placeholder">
            <span className="placeholder-icon">PDF</span>
            <span className="placeholder-text">No PDF data available</span>
          </div>
        );
      }

      return (
        <Document
          file={file.previewDataUrl}
          onLoadError={(error) => {
            console.error('PDF load error:', error);
            handlePdfLoadError();
          }}
          loading={
            <div className="viewer-loading">
              <span>Loading PDF...</span>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={zoomLevel}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      );
    }

    if (imageError || !file.previewDataUrl) {
      return (
        <div className="viewer-placeholder">
          <span className="placeholder-icon">IMG</span>
          <span className="placeholder-text">Failed to load image</span>
        </div>
      );
    }

    return (
      <img
        src={file.previewDataUrl}
        alt={file.name}
        className="viewer-image"
        style={{ transform: `scale(${zoomLevel})` }}
        onError={handleImageError}
      />
    );
  };

  return (
    <div className="file-viewer">
      <div className="viewer-toolbar">
        <div className="zoom-controls">
          <button
            type="button"
            className="zoom-button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
          <button
            type="button"
            className="zoom-button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div className="viewer-content">{renderContent()}</div>

      {file.type === 'pdf' && totalPages > 1 && (
        <PageNavigator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}

      <style>{`
        .file-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: #f8fafc;
        }

        .viewer-toolbar {
          display: flex;
          justify-content: center;
          padding: 8px;
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .zoom-button {
          width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background-color: #ffffff;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .zoom-button:hover {
          background-color: #f3f4f6;
        }

        .zoom-level {
          min-width: 50px;
          text-align: center;
          font-size: 14px;
          color: #374151;
        }

        .viewer-content {
          flex: 1;
          overflow: auto;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 16px;
        }

        .viewer-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transform-origin: center center;
        }

        .viewer-placeholder,
        .viewer-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #6b7280;
          padding: 40px;
        }

        .placeholder-icon {
          font-size: 48px;
          font-weight: bold;
          color: #2563eb;
        }

        .placeholder-text {
          font-size: 14px;
        }

        .react-pdf__Document {
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default FileViewer;
