/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileInputComponent from './FileInputComponent';
import { fileInputService } from '../services/FileInputService';
import { FileInputError, FileInfo } from '../../types/file';

vi.mock('../services/FileInputService', () => ({
  fileInputService: {
    handleFileSelect: vi.fn(),
    handleFileDrop: vi.fn(),
    validateFile: vi.fn(),
    readFile: vi.fn(),
  },
}));

vi.mock('react-pdf', () => ({
  Document: ({
    children,
  }: {
    children: React.ReactNode;
    file?: string;
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

describe('FileInputComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render drop zone with instructions', () => {
      render(<FileInputComponent />);

      expect(
        screen.getByText(/drag and drop pdf or image files here/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select files/i })).toBeInTheDocument();
    });

    it('should render file input with correct accept attribute', () => {
      render(<FileInputComponent />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.pdf,.png,.jpg,.jpeg');
      expect(fileInput).toHaveAttribute('multiple');
    });
  });

  describe('drag and drop', () => {
    it('should highlight drop zone on drag over', () => {
      render(<FileInputComponent />);

      const dropZone = document.querySelector('.drop-zone');
      expect(dropZone).not.toHaveClass('drag-over');

      fireEvent.dragOver(dropZone!);
      expect(dropZone).toHaveClass('drag-over');
    });

    it('should remove highlight on drag leave', () => {
      render(<FileInputComponent />);

      const dropZone = document.querySelector('.drop-zone');

      fireEvent.dragOver(dropZone!);
      expect(dropZone).toHaveClass('drag-over');

      fireEvent.dragLeave(dropZone!);
      expect(dropZone).not.toHaveClass('drag-over');
    });

    it('should process files on drop', async () => {
      const mockFileInfo: FileInfo = {
        path: '/path/to/image.png',
        name: 'image.png',
        type: 'png',
        size: 2048,
      };

      vi.mocked(fileInputService.handleFileDrop).mockResolvedValue([mockFileInfo]);

      render(<FileInputComponent />);

      const dropZone = document.querySelector('.drop-zone');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [],
        },
      });

      await waitFor(() => {
        expect(fileInputService.handleFileDrop).toHaveBeenCalled();
      });
    });

    it('should display loaded files after drop', async () => {
      const mockFileInfo: FileInfo = {
        path: '/path/to/image.png',
        name: 'image.png',
        type: 'png',
        size: 2048,
      };

      vi.mocked(fileInputService.handleFileDrop).mockResolvedValue([mockFileInfo]);

      render(<FileInputComponent />);

      const dropZone = document.querySelector('.drop-zone');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('image.png')).toBeInTheDocument();
        expect(screen.getByText('2.0 KB')).toBeInTheDocument();
      });
    });
  });

  describe('file select button', () => {
    it('should trigger file input click on button click', () => {
      render(<FileInputComponent />);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      const button = screen.getByRole('button', { name: /select files/i });
      fireEvent.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should process files on file input change', async () => {
      const mockFileInfo: FileInfo = {
        path: '/path/to/file.pdf',
        name: 'file.pdf',
        type: 'pdf',
        size: 1024,
        pageCount: 5,
      };

      vi.mocked(fileInputService.handleFileSelect).mockResolvedValue([mockFileInfo]);

      render(<FileInputComponent />);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      fireEvent.change(fileInput, {
        target: {
          files: [],
        },
      });

      await waitFor(() => {
        expect(fileInputService.handleFileSelect).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('should display error message for unsupported format', async () => {
      vi.mocked(fileInputService.handleFileDrop).mockRejectedValue(
        new FileInputError('Unsupported format', 'UNSUPPORTED_FORMAT')
      );

      render(<FileInputComponent />);

      const dropZone = document.querySelector('.drop-zone');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [],
        },
      });

      await waitFor(() => {
        expect(
          screen.getByText(/this file format is not supported/i)
        ).toBeInTheDocument();
      });
    });

    it('should display error message for corrupted file', async () => {
      vi.mocked(fileInputService.handleFileDrop).mockRejectedValue(
        new FileInputError('File corrupted', 'FILE_CORRUPTED')
      );

      render(<FileInputComponent />);

      const dropZone = document.querySelector('.drop-zone');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [],
        },
      });

      await waitFor(() => {
        expect(
          screen.getByText(/the file appears to be corrupted/i)
        ).toBeInTheDocument();
      });
    });

    it('should display error message for file too large', async () => {
      vi.mocked(fileInputService.handleFileDrop).mockRejectedValue(
        new FileInputError('File too large', 'FILE_TOO_LARGE')
      );

      render(<FileInputComponent />);

      const dropZone = document.querySelector('.drop-zone');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [],
        },
      });

      await waitFor(() => {
        expect(
          screen.getByText(/the file is too large/i)
        ).toBeInTheDocument();
      });
    });

    it('should display error message for read error', async () => {
      vi.mocked(fileInputService.handleFileDrop).mockRejectedValue(
        new FileInputError('Read error', 'READ_ERROR')
      );

      render(<FileInputComponent />);

      const dropZone = document.querySelector('.drop-zone');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [],
        },
      });

      await waitFor(() => {
        expect(
          screen.getByText(/failed to read the file/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('file preview', () => {
    it('should display image preview for image files', async () => {
      const mockFileInfo: FileInfo = {
        path: '/path/to/image.png',
        name: 'image.png',
        type: 'png',
        size: 2048,
        previewDataUrl: 'data:image/png;base64,ZmFrZSBpbWFnZQ==',
      };

      vi.mocked(fileInputService.handleFileDrop).mockResolvedValue([mockFileInfo]);

      render(<FileInputComponent />);

      const dropZone = document.querySelector('.drop-zone');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [],
        },
      });

      await waitFor(() => {
        const image = document.querySelector('.preview-image');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute(
          'src',
          'data:image/png;base64,ZmFrZSBpbWFnZQ=='
        );
      });
    });

    it('should display PDF preview for PDF files', async () => {
      const mockFileInfo: FileInfo = {
        path: '/path/to/file.pdf',
        name: 'file.pdf',
        type: 'pdf',
        size: 1024,
        pageCount: 5,
        previewDataUrl: 'data:application/pdf;base64,ZmFrZSBwZGY=',
      };

      vi.mocked(fileInputService.handleFileDrop).mockResolvedValue([mockFileInfo]);

      render(<FileInputComponent />);

      const dropZone = document.querySelector('.drop-zone');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [],
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
        expect(screen.getByText('5 pages')).toBeInTheDocument();
      });
    });
  });

  describe('callback', () => {
    it('should call onFilesLoaded callback when files are loaded', async () => {
      const mockFileInfo: FileInfo = {
        path: '/path/to/image.png',
        name: 'image.png',
        type: 'png',
        size: 2048,
      };

      vi.mocked(fileInputService.handleFileDrop).mockResolvedValue([mockFileInfo]);

      const onFilesLoaded = vi.fn();
      render(<FileInputComponent onFilesLoaded={onFilesLoaded} />);

      const dropZone = document.querySelector('.drop-zone');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [],
        },
      });

      await waitFor(() => {
        expect(onFilesLoaded).toHaveBeenCalledWith([mockFileInfo]);
      });
    });
  });
});
