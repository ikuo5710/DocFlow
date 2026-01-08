import React, { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FileInfo, FileInputError } from '../../types/file';
import { fileInputService } from '../services/FileInputService';

// Use local worker file from public folder
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface FileInputComponentProps {
  onFilesLoaded?: (files: FileInfo[]) => void;
}

const FileInputComponent: React.FC<FileInputComponentProps> = ({
  onFilesLoaded,
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<FileInputError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
    },
    []
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      setError(null);
      setIsLoading(true);

      try {
        const loadedFiles = await fileInputService.handleFileDrop(event);
        setFiles(loadedFiles);
        onFilesLoaded?.(loadedFiles);
      } catch (err) {
        if (err instanceof FileInputError) {
          setError(err);
        } else {
          setError(
            new FileInputError(
              'An unexpected error occurred while loading files',
              'READ_ERROR'
            )
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [onFilesLoaded]
  );

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      setIsLoading(true);

      try {
        const loadedFiles = await fileInputService.handleFileSelect(
          event.target.files
        );
        setFiles(loadedFiles);
        onFilesLoaded?.(loadedFiles);
      } catch (err) {
        if (err instanceof FileInputError) {
          setError(err);
        } else {
          setError(
            new FileInputError(
              'An unexpected error occurred while loading files',
              'READ_ERROR'
            )
          );
        }
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onFilesLoaded]
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'UNSUPPORTED_FORMAT':
        return 'This file format is not supported. Please use PDF, JPEG, or PNG.';
      case 'FILE_CORRUPTED':
        return 'The file appears to be corrupted and cannot be read.';
      case 'FILE_TOO_LARGE':
        return 'The file is too large. Please use a file under 100MB.';
      case 'READ_ERROR':
        return 'Failed to read the file. Please try again.';
      default:
        return 'An unexpected error occurred.';
    }
  };

  return (
    <div className="file-input-container">
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${isLoading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="loading-indicator">
            <span>Loading...</span>
          </div>
        ) : (
          <>
            <div className="drop-zone-content">
              <p className="drop-zone-text">
                Drag and drop PDF or image files here
              </p>
              <p className="drop-zone-or">or</p>
              <button
                type="button"
                className="file-select-button"
                onClick={handleButtonClick}
              >
                Select Files
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              onChange={handleFileSelect}
              className="file-input-hidden"
            />
          </>
        )}
      </div>

      {error && (
        <div className="error-message" role="alert">
          <span className="error-icon">!</span>
          <span>{getErrorMessage(error.code)}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="file-preview-container">
          <h3>Loaded Files ({files.length})</h3>
          <ul className="file-list">
            {files.map((file, index) => (
              <li key={`${file.path}-${index}`} className="file-item">
                <FilePreview file={file} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        .file-input-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .drop-zone {
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 40px 20px;
          text-align: center;
          background-color: #fafafa;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .drop-zone.drag-over {
          border-color: #2196f3;
          background-color: #e3f2fd;
        }

        .drop-zone.loading {
          opacity: 0.7;
          cursor: wait;
        }

        .drop-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .drop-zone-text {
          font-size: 16px;
          color: #666;
          margin: 0;
        }

        .drop-zone-or {
          font-size: 14px;
          color: #999;
          margin: 5px 0;
        }

        .file-select-button {
          padding: 10px 24px;
          font-size: 14px;
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .file-select-button:hover {
          background-color: #1976d2;
        }

        .file-select-button:focus {
          outline: 2px solid #1976d2;
          outline-offset: 2px;
        }

        .file-input-hidden {
          display: none;
        }

        .loading-indicator {
          color: #666;
          font-size: 16px;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px 16px;
          background-color: #ffebee;
          border: 1px solid #f44336;
          border-radius: 4px;
          color: #c62828;
        }

        .error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background-color: #f44336;
          color: white;
          border-radius: 50%;
          font-weight: bold;
          font-size: 12px;
        }

        .file-preview-container {
          margin-top: 24px;
        }

        .file-preview-container h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #333;
        }

        .file-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .file-item {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          background-color: white;
        }
      `}</style>
    </div>
  );
};

interface FilePreviewProps {
  file: FileInfo;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const [previewError, setPreviewError] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const previewUrl = file.previewDataUrl || null;

  React.useEffect(() => {
    setPreviewError(false);
    setPdfError(false);
  }, [file]);

  const handleImageError = () => {
    setPreviewError(true);
  };

  const handlePdfLoadError = () => {
    setPdfError(true);
  };

  const getFileIcon = () => {
    switch (file.type) {
      case 'pdf':
        return 'PDF';
      case 'jpeg':
      case 'png':
        return 'IMG';
      default:
        return 'FILE';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderPdfPreview = () => {
    if (!previewUrl || pdfError) {
      return (
        <div className="pdf-placeholder">
          <span className="file-type-icon">{getFileIcon()}</span>
          {file.pageCount && (
            <span className="page-count">{file.pageCount} pages</span>
          )}
        </div>
      );
    }

    return (
      <Document
        file={previewUrl}
        onLoadError={handlePdfLoadError}
        loading={
          <div className="pdf-loading">
            <span>Loading PDF...</span>
          </div>
        }
        error={
          <div className="pdf-placeholder">
            <span className="file-type-icon">{getFileIcon()}</span>
            {file.pageCount && (
              <span className="page-count">{file.pageCount} pages</span>
            )}
          </div>
        }
      >
        <Page
          pageNumber={1}
          width={180}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    );
  };

  return (
    <div className="file-preview">
      <div className="preview-image-container">
        {file.type === 'pdf' ? (
          renderPdfPreview()
        ) : previewUrl && !previewError ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="preview-image"
            onError={handleImageError}
          />
        ) : (
          <div className="image-placeholder">
            <span className="file-type-icon">{getFileIcon()}</span>
          </div>
        )}
      </div>
      <div className="file-info">
        <span className="file-name" title={file.name}>
          {file.name}
        </span>
        <span className="file-size">{formatFileSize(file.size)}</span>
        {file.type === 'pdf' && file.pageCount && (
          <span className="file-pages">{file.pageCount} pages</span>
        )}
      </div>

      <style>{`
        .file-preview {
          display: flex;
          flex-direction: column;
        }

        .preview-image-container {
          width: 100%;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          overflow: hidden;
        }

        .preview-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .pdf-placeholder,
        .image-placeholder,
        .pdf-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #666;
        }

        .file-type-icon {
          font-size: 24px;
          font-weight: bold;
          color: #2196f3;
        }

        .page-count {
          font-size: 12px;
          color: #999;
        }

        .file-info {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size {
          font-size: 12px;
          color: #999;
        }

        .file-pages {
          font-size: 12px;
          color: #666;
        }

        .react-pdf__Document {
          display: flex;
          justify-content: center;
        }

        .react-pdf__Page {
          max-height: 150px;
        }

        .react-pdf__Page canvas {
          max-height: 150px !important;
          width: auto !important;
        }
      `}</style>
    </div>
  );
};

export default FileInputComponent;
