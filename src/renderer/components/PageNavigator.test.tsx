/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PageNavigator from './PageNavigator';

describe('PageNavigator', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本表示', () => {
    it('現在のページと総ページ数が表示される', () => {
      render(<PageNavigator {...defaultProps} />);

      expect(screen.getByDisplayValue('1')).toBeDefined();
      expect(screen.getByText('/ 10')).toBeDefined();
    });

    it('前後のナビゲーションボタンが表示される', () => {
      render(<PageNavigator {...defaultProps} />);

      expect(screen.getByLabelText('Previous page')).toBeDefined();
      expect(screen.getByLabelText('Next page')).toBeDefined();
    });
  });

  describe('ナビゲーションボタン', () => {
    it('最初のページでは前ボタンが無効', () => {
      render(<PageNavigator {...defaultProps} currentPage={1} />);

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton.hasAttribute('disabled')).toBe(true);
    });

    it('最後のページでは次ボタンが無効', () => {
      render(<PageNavigator {...defaultProps} currentPage={10} />);

      const nextButton = screen.getByLabelText('Next page');
      expect(nextButton.hasAttribute('disabled')).toBe(true);
    });

    it('前ボタンをクリックするとページが減る', () => {
      render(<PageNavigator {...defaultProps} currentPage={5} />);

      fireEvent.click(screen.getByLabelText('Previous page'));

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(4);
    });

    it('次ボタンをクリックするとページが増える', () => {
      render(<PageNavigator {...defaultProps} currentPage={5} />);

      fireEvent.click(screen.getByLabelText('Next page'));

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(6);
    });
  });

  describe('ページジャンプ入力', () => {
    it('ページ番号入力フィールドが表示される', () => {
      render(<PageNavigator {...defaultProps} />);

      expect(screen.getByLabelText('Page number')).toBeDefined();
    });

    it('有効なページ番号を入力してEnterでジャンプ', () => {
      render(<PageNavigator {...defaultProps} />);
      const input = screen.getByLabelText('Page number') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(5);
    });

    it('数字以外は入力できない', () => {
      render(<PageNavigator {...defaultProps} />);
      const input = screen.getByLabelText('Page number') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'abc' } });

      expect(input.value).toBe('1');
    });

    it('範囲外のページ番号は入力できるがジャンプできない', () => {
      render(<PageNavigator {...defaultProps} />);
      const input = screen.getByLabelText('Page number') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '100' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onPageChange).not.toHaveBeenCalled();
    });

    it('Escapeキーで編集をキャンセル', () => {
      render(<PageNavigator {...defaultProps} />);
      const input = screen.getByLabelText('Page number') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(input.value).toBe('1');
    });

    it('フォーカスを外すと無効な値は元に戻る', () => {
      render(<PageNavigator {...defaultProps} />);
      const input = screen.getByLabelText('Page number') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '100' } });
      fireEvent.blur(input);

      expect(input.value).toBe('1');
    });

    it('フォーカスを外すと有効な値でページ変更', () => {
      render(<PageNavigator {...defaultProps} />);
      const input = screen.getByLabelText('Page number') as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.blur(input);

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(5);
    });
  });

  describe('キーボードナビゲーション', () => {
    it('左矢印キーで前のページへ', () => {
      render(<PageNavigator {...defaultProps} currentPage={5} />);

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(4);
    });

    it('右矢印キーで次のページへ', () => {
      render(<PageNavigator {...defaultProps} currentPage={5} />);

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(6);
    });

    it('PageUpキーで前のページへ', () => {
      render(<PageNavigator {...defaultProps} currentPage={5} />);

      fireEvent.keyDown(window, { key: 'PageUp' });

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(4);
    });

    it('PageDownキーで次のページへ', () => {
      render(<PageNavigator {...defaultProps} currentPage={5} />);

      fireEvent.keyDown(window, { key: 'PageDown' });

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(6);
    });

    it('入力フィールドにフォーカスがあるときはキーボードナビゲーション無効', () => {
      render(<PageNavigator {...defaultProps} currentPage={5} />);
      const input = screen.getByLabelText('Page number') as HTMLInputElement;

      input.focus();
      fireEvent.keyDown(input, { key: 'ArrowLeft' });

      expect(defaultProps.onPageChange).not.toHaveBeenCalled();
    });
  });
});
