/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarkdownEditor from './MarkdownEditor';

// CodeMirrorのモック
vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: () => ({
      doc: { toString: () => '' },
    }),
  },
}));

vi.mock('@codemirror/view', () => {
  const mockViewInstance = {
    destroy: () => {},
    state: { doc: { toString: () => '' } },
    dispatch: () => {},
  };

  const MockEditorView = function () {
    return mockViewInstance;
  };
  MockEditorView.updateListener = { of: () => ({}) };
  MockEditorView.editable = { of: () => ({}) };
  MockEditorView.lineWrapping = {};
  MockEditorView.theme = () => ({});

  return {
    EditorView: MockEditorView,
    keymap: { of: () => ({}) },
    lineNumbers: () => ({}),
    highlightActiveLine: () => ({}),
  };
});

vi.mock('@codemirror/lang-markdown', () => ({
  markdown: () => ({}),
}));

vi.mock('@codemirror/commands', () => ({
  defaultKeymap: [],
  history: () => ({}),
  historyKeymap: [],
  undo: () => true,
  redo: () => true,
  undoDepth: () => 0,
  redoDepth: () => 0,
}));

// highlight.jsのモック
vi.mock('highlight.js', () => ({
  default: {
    highlightElement: () => {},
  },
}));

describe('MarkdownEditor', () => {
  const defaultProps = {
    content: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('ツールバーが表示される', () => {
      render(<MarkdownEditor {...defaultProps} />);
      expect(screen.getByRole('toolbar')).toBeDefined();
    });

    it('Markdownタイトルが表示される', () => {
      render(<MarkdownEditor {...defaultProps} />);
      expect(screen.getByText('Markdown')).toBeDefined();
    });

    it('readOnly=trueの場合、Read Onlyバッジが表示される', () => {
      render(<MarkdownEditor {...defaultProps} readOnly={true} />);
      expect(screen.getByText('Read Only')).toBeDefined();
    });

    it('readOnly=falseの場合、Read Onlyバッジが表示されない', () => {
      render(<MarkdownEditor {...defaultProps} readOnly={false} />);
      expect(screen.queryByText('Read Only')).toBeNull();
    });
  });

  describe('表示モード切り替え', () => {
    it('デフォルトでtextモード（Previewボタン表示）', () => {
      render(<MarkdownEditor {...defaultProps} />);
      expect(screen.getByText('Preview')).toBeDefined();
    });

    it('Previewボタンをクリックするとプレビューモードに切り替わる', () => {
      render(<MarkdownEditor {...defaultProps} content="# Test" />);

      fireEvent.click(screen.getByLabelText('プレビュー表示に切り替え'));

      // プレビューモードではEditボタンが表示される
      expect(screen.getByText('Edit')).toBeDefined();
    });

    it('プレビューモードでEditボタンをクリックするとテキストモードに戻る', () => {
      render(<MarkdownEditor {...defaultProps} content="# Test" />);

      // プレビューモードに切り替え
      fireEvent.click(screen.getByLabelText('プレビュー表示に切り替え'));

      // テキストモードに戻る
      fireEvent.click(screen.getByLabelText('テキスト編集に切り替え'));

      // テキストモードではPreviewボタンが表示される
      expect(screen.getByText('Preview')).toBeDefined();
    });

    it('プレビューモードでMarkdownコンテンツがHTMLとしてレンダリングされる', () => {
      const { container } = render(
        <MarkdownEditor {...defaultProps} content="# タイトル" />
      );

      fireEvent.click(screen.getByLabelText('プレビュー表示に切り替え'));

      // MarkdownPreviewコンポーネントが表示され、h1がレンダリングされる
      const h1 = container.querySelector('h1');
      expect(h1).toBeDefined();
      expect(h1?.textContent).toContain('タイトル');
    });

    it('プレビューモードで複合的なMarkdownが正しくレンダリングされる', () => {
      const markdownContent = `# 見出し

これは**太字**と*イタリック*です。

- 項目1
- 項目2
`;
      const { container } = render(
        <MarkdownEditor {...defaultProps} content={markdownContent} />
      );

      fireEvent.click(screen.getByLabelText('プレビュー表示に切り替え'));

      // markdown-preview内の要素を検索
      const preview = container.querySelector('.markdown-preview');
      expect(preview?.querySelector('h1')?.textContent).toContain('見出し');
      expect(preview?.querySelector('strong')?.textContent).toContain('太字');
      expect(preview?.querySelector('em')?.textContent).toContain('イタリック');
      expect(preview?.querySelectorAll('li')).toHaveLength(2);
    });
  });

  describe('キーボードショートカット', () => {
    it('Ctrl+Shift+Pでプレビューモードに切り替わる', () => {
      render(<MarkdownEditor {...defaultProps} content="# Test" />);

      expect(screen.getByText('Preview')).toBeDefined();

      fireEvent.keyDown(window, {
        key: 'p',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(screen.getByText('Edit')).toBeDefined();
    });

    it('Ctrl+Shift+Pを2回押すとテキストモードに戻る', () => {
      render(<MarkdownEditor {...defaultProps} content="# Test" />);

      // プレビューモードに切り替え
      fireEvent.keyDown(window, {
        key: 'p',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(screen.getByText('Edit')).toBeDefined();

      // テキストモードに戻る
      fireEvent.keyDown(window, {
        key: 'p',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(screen.getByText('Preview')).toBeDefined();
    });

    it('Cmd+Shift+P (Mac) でもプレビューモードに切り替わる', () => {
      render(<MarkdownEditor {...defaultProps} content="# Test" />);

      fireEvent.keyDown(window, {
        key: 'p',
        metaKey: true,
        shiftKey: true,
      });

      expect(screen.getByText('Edit')).toBeDefined();
    });
  });

  describe('コンテンツの保持', () => {
    it('モード切り替え時にコンテンツが保持される', () => {
      const content = '# タイトル\n\n本文テキスト';
      const { container } = render(
        <MarkdownEditor {...defaultProps} content={content} />
      );

      // プレビューモードに切り替え
      fireEvent.click(screen.getByLabelText('プレビュー表示に切り替え'));

      expect(container.querySelector('h1')?.textContent).toContain('タイトル');

      // テキストモードに戻る
      fireEvent.click(screen.getByLabelText('テキスト編集に切り替え'));

      // 再度プレビューモードに切り替え
      fireEvent.click(screen.getByLabelText('プレビュー表示に切り替え'));

      // コンテンツが保持されている
      expect(container.querySelector('h1')?.textContent).toContain('タイトル');
    });
  });

  describe('空コンテンツの処理', () => {
    it('空コンテンツでプレビューモードに切り替えた場合、プレースホルダーが表示される', () => {
      render(<MarkdownEditor {...defaultProps} content="" />);

      fireEvent.click(screen.getByLabelText('プレビュー表示に切り替え'));

      expect(
        screen.getByText('プレビューするコンテンツがありません')
      ).toBeDefined();
    });
  });
});
