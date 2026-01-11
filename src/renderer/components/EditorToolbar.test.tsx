/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditorToolbar from './EditorToolbar';

describe('EditorToolbar', () => {
  const defaultProps = {
    onCommand: vi.fn(),
    canUndo: true,
    canRedo: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ボタン表示', () => {
    it('書式ボタンが表示される', () => {
      render(<EditorToolbar {...defaultProps} />);

      expect(screen.getByLabelText('太字')).toBeDefined();
      expect(screen.getByLabelText('イタリック')).toBeDefined();
      expect(screen.getByLabelText('取り消し線')).toBeDefined();
    });

    it('見出しボタンが表示される', () => {
      render(<EditorToolbar {...defaultProps} />);

      expect(screen.getByLabelText('見出し1')).toBeDefined();
      expect(screen.getByLabelText('見出し2')).toBeDefined();
      expect(screen.getByLabelText('見出し3')).toBeDefined();
    });

    it('コード・リンクボタンが表示される', () => {
      render(<EditorToolbar {...defaultProps} />);

      expect(screen.getByLabelText('コード')).toBeDefined();
      expect(screen.getByLabelText('リンク')).toBeDefined();
    });

    it('リスト・引用ボタンが表示される', () => {
      render(<EditorToolbar {...defaultProps} />);

      expect(screen.getByLabelText('箇条書き')).toBeDefined();
      expect(screen.getByLabelText('番号付きリスト')).toBeDefined();
      expect(screen.getByLabelText('引用')).toBeDefined();
    });

    it('Undo/Redoボタンが表示される', () => {
      render(<EditorToolbar {...defaultProps} />);

      expect(screen.getByLabelText('元に戻す')).toBeDefined();
      expect(screen.getByLabelText('やり直し')).toBeDefined();
    });
  });

  describe('クリックイベント', () => {
    it('太字ボタンをクリックするとboldコマンドが発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('太字'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'bold' });
    });

    it('イタリックボタンをクリックするとitalicコマンドが発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('イタリック'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'italic' });
    });

    it('取り消し線ボタンをクリックするとstrikethroughコマンドが発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('取り消し線'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'strikethrough' });
    });

    it('見出し1ボタンをクリックするとheadingコマンド(level:1)が発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('見出し1'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'heading', level: 1 });
    });

    it('見出し2ボタンをクリックするとheadingコマンド(level:2)が発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('見出し2'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'heading', level: 2 });
    });

    it('見出し3ボタンをクリックするとheadingコマンド(level:3)が発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('見出し3'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'heading', level: 3 });
    });

    it('コードボタンをクリックするとcodeコマンドが発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('コード'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'code' });
    });

    it('リンクボタンをクリックするとlinkコマンドが発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('リンク'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'link' });
    });

    it('箇条書きボタンをクリックするとbulletListコマンドが発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('箇条書き'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'bulletList' });
    });

    it('番号付きリストボタンをクリックするとnumberedListコマンドが発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('番号付きリスト'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'numberedList' });
    });

    it('引用ボタンをクリックするとquoteコマンドが発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('引用'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'quote' });
    });

    it('Undoボタンをクリックするとundoコマンドが発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('元に戻す'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'undo' });
    });

    it('Redoボタンをクリックするとredoコマンドが発行される', () => {
      render(<EditorToolbar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('やり直し'));

      expect(defaultProps.onCommand).toHaveBeenCalledWith({ type: 'redo' });
    });
  });

  describe('無効状態', () => {
    it('disabled=trueの場合、全ボタンが無効になる', () => {
      render(<EditorToolbar {...defaultProps} disabled={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.hasAttribute('disabled')).toBe(true);
      });
    });

    it('disabled=trueの場合、クリックしてもコマンドが発行されない', () => {
      render(<EditorToolbar {...defaultProps} disabled={true} />);

      fireEvent.click(screen.getByLabelText('太字'));

      expect(defaultProps.onCommand).not.toHaveBeenCalled();
    });

    it('canUndo=falseの場合、Undoボタンのみ無効になる', () => {
      render(<EditorToolbar {...defaultProps} canUndo={false} />);

      expect(screen.getByLabelText('元に戻す').hasAttribute('disabled')).toBe(true);
      expect(screen.getByLabelText('やり直し').hasAttribute('disabled')).toBe(false);
    });

    it('canRedo=falseの場合、Redoボタンのみ無効になる', () => {
      render(<EditorToolbar {...defaultProps} canRedo={false} />);

      expect(screen.getByLabelText('元に戻す').hasAttribute('disabled')).toBe(false);
      expect(screen.getByLabelText('やり直し').hasAttribute('disabled')).toBe(true);
    });

    it('canUndo=falseかつcanRedo=falseの場合、両方無効になる', () => {
      render(<EditorToolbar {...defaultProps} canUndo={false} canRedo={false} />);

      expect(screen.getByLabelText('元に戻す').hasAttribute('disabled')).toBe(true);
      expect(screen.getByLabelText('やり直し').hasAttribute('disabled')).toBe(true);
    });
  });

  describe('ツールチップ', () => {
    it('太字ボタンにショートカットキーが表示される', () => {
      render(<EditorToolbar {...defaultProps} />);

      const button = screen.getByLabelText('太字');
      expect(button.getAttribute('title')).toBe('太字 (Ctrl+B)');
    });

    it('イタリックボタンにショートカットキーが表示される', () => {
      render(<EditorToolbar {...defaultProps} />);

      const button = screen.getByLabelText('イタリック');
      expect(button.getAttribute('title')).toBe('イタリック (Ctrl+I)');
    });

    it('取り消し線ボタンにはショートカットキーがない', () => {
      render(<EditorToolbar {...defaultProps} />);

      const button = screen.getByLabelText('取り消し線');
      expect(button.getAttribute('title')).toBe('取り消し線');
    });
  });

  describe('アクセシビリティ', () => {
    it('ツールバーにrole="toolbar"が設定されている', () => {
      render(<EditorToolbar {...defaultProps} />);

      expect(screen.getByRole('toolbar')).toBeDefined();
    });

    it('ツールバーにaria-labelが設定されている', () => {
      render(<EditorToolbar {...defaultProps} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar.getAttribute('aria-label')).toBe('Markdown formatting');
    });
  });
});
