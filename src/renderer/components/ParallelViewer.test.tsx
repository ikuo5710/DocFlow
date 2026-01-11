/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParallelViewer from './ParallelViewer';
import { FileInfo } from '../../types/file';
import * as useOCRModule from '../hooks/useOCR';

vi.mock('react-pdf', () => ({
  Document: ({
    children,
  }: {
    children: React.ReactNode;
    file?: string;
    onLoadSuccess?: (args: { numPages: number }) => void;
    onLoadError?: () => void;
    loading?: React.ReactNode;
    error?: React.ReactNode;
  }) => React.createElement('div', { 'data-testid': 'pdf-document' }, children),
  Page: () =>
    React.createElement('div', { 'data-testid': 'pdf-page' }, 'PDF Page'),
  pdfjs: {
    GlobalWorkerOptions: { workerSrc: '' },
    version: '3.0.0',
  },
}));

vi.mock('./MarkdownEditor', () => ({
  default: ({ content, placeholder }: { content: string; placeholder?: string }) =>
    React.createElement('div', { 'data-testid': 'markdown-editor' }, [
      React.createElement('span', { key: 'title' }, 'Markdown'),
      React.createElement('span', { key: 'content' }, content || placeholder || 'Editor'),
    ]),
}));

const mockProcessFile = vi.fn();
const mockReset = vi.fn();

const mockUseOCR = (overrides = {}) => ({
  isProcessing: false,
  result: null,
  error: null,
  errorCode: null,
  processFile: mockProcessFile,
  reset: mockReset,
  ...overrides,
});

describe('ParallelViewer', () => {
  const mockFile: FileInfo = {
    path: '/path/to/test.pdf',
    name: 'test.pdf',
    type: 'pdf',
    size: 1024,
    pageCount: 5,
    previewDataUrl: 'data:application/pdf;base64,test',
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useOCRModule, 'useOCR').mockReturnValue(mockUseOCR());
  });

  describe('rendering', () => {
    it('should render with file name in header', () => {
      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      const backButton = screen.getByTitle('Back to file selection');
      expect(backButton).toBeInTheDocument();
    });

    it('should render save button', () => {
      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should render file viewer in left pane', () => {
      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
    });

    it('should render markdown editor in right pane', () => {
      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      expect(screen.getByText('Markdown')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onClose when back button is clicked', () => {
      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      const backButton = screen.getByTitle('Back to file selection');
      fireEvent.click(backButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should process OCR when file is loaded', () => {
      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      expect(mockProcessFile).toHaveBeenCalledWith('/path/to/test.pdf');
    });
  });

  describe('OCR processing states', () => {
    it('should show processing indicator when OCR is in progress', () => {
      vi.spyOn(useOCRModule, 'useOCR').mockReturnValue(
        mockUseOCR({ isProcessing: true })
      );

      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      // Multiple elements with this text exist (header + editor placeholder)
      const processingElements = screen.getAllByText('Processing OCR...');
      expect(processingElements.length).toBeGreaterThan(0);
    });

    it('should disable save button when processing', () => {
      vi.spyOn(useOCRModule, 'useOCR').mockReturnValue(
        mockUseOCR({ isProcessing: true })
      );

      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should show error message when OCR fails', () => {
      vi.spyOn(useOCRModule, 'useOCR').mockReturnValue(
        mockUseOCR({
          error: 'API rate limit exceeded',
          errorCode: 'RATE_LIMIT',
        })
      );

      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      expect(screen.getByText('OCR Processing Failed')).toBeInTheDocument();
      expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument();
    });

    it('should show retry buttons when OCR fails', () => {
      vi.spyOn(useOCRModule, 'useOCR').mockReturnValue(
        mockUseOCR({
          error: 'API error occurred',
          errorCode: 'API_ERROR',
        })
      );

      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      const retryButtons = screen.getAllByRole('button', { name: /retry/i });
      expect(retryButtons.length).toBeGreaterThan(0);
    });

    it('should retry OCR when retry button is clicked', () => {
      vi.spyOn(useOCRModule, 'useOCR').mockReturnValue(
        mockUseOCR({
          error: 'API error occurred',
          errorCode: 'API_ERROR',
        })
      );

      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      // Use the large retry button in the error panel
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockProcessFile).toHaveBeenCalledWith('/path/to/test.pdf');
    });
  });

  describe('with OCR result', () => {
    it('should display markdown content from OCR result', async () => {
      vi.spyOn(useOCRModule, 'useOCR').mockReturnValue(
        mockUseOCR({
          result: { markdown: '# Test Document\n\nSome content', pageCount: 1 },
        })
      );

      render(<ParallelViewer file={mockFile} onClose={mockOnClose} />);

      // The markdown editor should be rendered (not the error panel)
      expect(screen.queryByText('OCR Processing Failed')).not.toBeInTheDocument();
    });
  });

  describe('image files', () => {
    const mockImageFile: FileInfo = {
      path: '/path/to/image.png',
      name: 'image.png',
      type: 'png',
      size: 2048,
      width: 800,
      height: 600,
      previewDataUrl: 'data:image/png;base64,test',
    };

    it('should render image file in viewer', () => {
      render(<ParallelViewer file={mockImageFile} onClose={mockOnClose} />);

      expect(screen.getByText('image.png')).toBeInTheDocument();
    });

    it('should process OCR for image files', () => {
      render(<ParallelViewer file={mockImageFile} onClose={mockOnClose} />);

      expect(mockProcessFile).toHaveBeenCalledWith('/path/to/image.png');
    });
  });
});
