/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileList } from './useFileList';
import { FileInfo } from '../../types/file';

const createMockFile = (path: string, name: string): FileInfo => ({
  path,
  name,
  type: 'pdf',
  size: 1024,
});

describe('useFileList', () => {
  describe('初期状態', () => {
    it('初期状態で空のリストと-1のインデックスを返す', () => {
      const { result } = renderHook(() => useFileList());

      expect(result.current.files).toEqual([]);
      expect(result.current.currentFile).toBeNull();
      expect(result.current.currentFileIndex).toBe(-1);
      expect(result.current.totalFiles).toBe(0);
      expect(result.current.hasMultipleFiles).toBe(false);
    });
  });

  describe('addFile', () => {
    it('ファイルを追加できる', () => {
      const { result } = renderHook(() => useFileList());
      const file = createMockFile('/path/to/file.pdf', 'file.pdf');

      act(() => {
        result.current.addFile(file);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.currentFile).toEqual(file);
      expect(result.current.currentFileIndex).toBe(0);
    });

    it('最初のファイル追加時に自動選択される', () => {
      const { result } = renderHook(() => useFileList());
      const file = createMockFile('/path/to/file.pdf', 'file.pdf');

      act(() => {
        result.current.addFile(file);
      });

      expect(result.current.currentFileIndex).toBe(0);
    });
  });

  describe('addFiles', () => {
    it('複数ファイルを追加できる', () => {
      const { result } = renderHook(() => useFileList());
      const files = [
        createMockFile('/path/to/file1.pdf', 'file1.pdf'),
        createMockFile('/path/to/file2.pdf', 'file2.pdf'),
      ];

      act(() => {
        result.current.addFiles(files);
      });

      expect(result.current.files).toHaveLength(2);
      expect(result.current.hasMultipleFiles).toBe(true);
    });

    it('重複するファイルは追加されない', () => {
      const { result } = renderHook(() => useFileList());
      const file = createMockFile('/path/to/file.pdf', 'file.pdf');

      act(() => {
        result.current.addFile(file);
      });
      act(() => {
        result.current.addFile(file);
      });

      expect(result.current.files).toHaveLength(1);
    });
  });

  describe('removeFile', () => {
    it('ファイルを削除できる', () => {
      const { result } = renderHook(() => useFileList());
      const files = [
        createMockFile('/path/to/file1.pdf', 'file1.pdf'),
        createMockFile('/path/to/file2.pdf', 'file2.pdf'),
      ];

      act(() => {
        result.current.addFiles(files);
      });
      act(() => {
        result.current.removeFile(0);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('file2.pdf');
    });

    it('選択中のファイルを削除すると前のファイルが選択される', () => {
      const { result } = renderHook(() => useFileList());
      const files = [
        createMockFile('/path/to/file1.pdf', 'file1.pdf'),
        createMockFile('/path/to/file2.pdf', 'file2.pdf'),
        createMockFile('/path/to/file3.pdf', 'file3.pdf'),
      ];

      act(() => {
        result.current.addFiles(files);
        result.current.selectFile(1); // file2を選択
      });
      act(() => {
        result.current.removeFile(1); // file2を削除
      });

      expect(result.current.currentFileIndex).toBe(0);
      expect(result.current.currentFile?.name).toBe('file1.pdf');
    });

    it('最後のファイルを削除するとインデックスが-1になる', () => {
      const { result } = renderHook(() => useFileList());
      const file = createMockFile('/path/to/file.pdf', 'file.pdf');

      act(() => {
        result.current.addFile(file);
      });
      act(() => {
        result.current.removeFile(0);
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.currentFileIndex).toBe(-1);
      expect(result.current.currentFile).toBeNull();
    });
  });

  describe('selectFile', () => {
    it('インデックスでファイルを選択できる', () => {
      const { result } = renderHook(() => useFileList());
      const files = [
        createMockFile('/path/to/file1.pdf', 'file1.pdf'),
        createMockFile('/path/to/file2.pdf', 'file2.pdf'),
      ];

      act(() => {
        result.current.addFiles(files);
      });
      act(() => {
        result.current.selectFile(1);
      });

      expect(result.current.currentFileIndex).toBe(1);
      expect(result.current.currentFile?.name).toBe('file2.pdf');
    });

    it('範囲外のインデックスは無視される', () => {
      const { result } = renderHook(() => useFileList());
      const file = createMockFile('/path/to/file.pdf', 'file.pdf');

      act(() => {
        result.current.addFile(file);
      });
      act(() => {
        result.current.selectFile(10);
      });

      expect(result.current.currentFileIndex).toBe(0);
    });
  });

  describe('selectFileByPath', () => {
    it('パスでファイルを選択できる', () => {
      const { result } = renderHook(() => useFileList());
      const files = [
        createMockFile('/path/to/file1.pdf', 'file1.pdf'),
        createMockFile('/path/to/file2.pdf', 'file2.pdf'),
      ];

      act(() => {
        result.current.addFiles(files);
      });
      act(() => {
        result.current.selectFileByPath('/path/to/file2.pdf');
      });

      expect(result.current.currentFile?.name).toBe('file2.pdf');
    });
  });

  describe('selectPreviousFile / selectNextFile', () => {
    it('前のファイルを選択できる', () => {
      const { result } = renderHook(() => useFileList());
      const files = [
        createMockFile('/path/to/file1.pdf', 'file1.pdf'),
        createMockFile('/path/to/file2.pdf', 'file2.pdf'),
      ];

      act(() => {
        result.current.addFiles(files);
        result.current.selectFile(1);
      });
      act(() => {
        result.current.selectPreviousFile();
      });

      expect(result.current.currentFileIndex).toBe(0);
    });

    it('次のファイルを選択できる', () => {
      const { result } = renderHook(() => useFileList());
      const files = [
        createMockFile('/path/to/file1.pdf', 'file1.pdf'),
        createMockFile('/path/to/file2.pdf', 'file2.pdf'),
      ];

      act(() => {
        result.current.addFiles(files);
      });
      act(() => {
        result.current.selectNextFile();
      });

      expect(result.current.currentFileIndex).toBe(1);
    });

    it('最初のファイルで前は選択できない', () => {
      const { result } = renderHook(() => useFileList());
      const files = [
        createMockFile('/path/to/file1.pdf', 'file1.pdf'),
        createMockFile('/path/to/file2.pdf', 'file2.pdf'),
      ];

      act(() => {
        result.current.addFiles(files);
      });
      act(() => {
        result.current.selectPreviousFile();
      });

      expect(result.current.currentFileIndex).toBe(0);
    });

    it('最後のファイルで次は選択できない', () => {
      const { result } = renderHook(() => useFileList());
      const files = [
        createMockFile('/path/to/file1.pdf', 'file1.pdf'),
        createMockFile('/path/to/file2.pdf', 'file2.pdf'),
      ];

      act(() => {
        result.current.addFiles(files);
        result.current.selectFile(1);
      });
      act(() => {
        result.current.selectNextFile();
      });

      expect(result.current.currentFileIndex).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('すべてのファイルをクリアする', () => {
      const { result } = renderHook(() => useFileList());
      const files = [
        createMockFile('/path/to/file1.pdf', 'file1.pdf'),
        createMockFile('/path/to/file2.pdf', 'file2.pdf'),
      ];

      act(() => {
        result.current.addFiles(files);
      });
      act(() => {
        result.current.clearAll();
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.currentFileIndex).toBe(-1);
      expect(result.current.currentFile).toBeNull();
    });
  });

  describe('setFileList', () => {
    it('ファイルリストを置き換える', () => {
      const { result } = renderHook(() => useFileList());
      const initialFiles = [createMockFile('/path/to/old.pdf', 'old.pdf')];
      const newFiles = [
        createMockFile('/path/to/new1.pdf', 'new1.pdf'),
        createMockFile('/path/to/new2.pdf', 'new2.pdf'),
      ];

      act(() => {
        result.current.addFiles(initialFiles);
      });
      act(() => {
        result.current.setFileList(newFiles);
      });

      expect(result.current.files).toHaveLength(2);
      expect(result.current.files[0].name).toBe('new1.pdf');
      expect(result.current.currentFileIndex).toBe(0);
    });
  });
});
