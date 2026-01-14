/**
 * @vitest-environment jsdom
 */
/**
 * MarkdownPreview コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkdownPreview from './MarkdownPreview';

// highlight.jsのモック
vi.mock('highlight.js', () => ({
  default: {
    highlightElement: vi.fn(),
  },
}));

describe('MarkdownPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('空のコンテンツでプレースホルダーを表示する', () => {
      render(<MarkdownPreview content="" />);
      expect(
        screen.getByText('プレビューするコンテンツがありません')
      ).toBeDefined();
    });

    it('classNameを適用できる', () => {
      const { container } = render(
        <MarkdownPreview content="test" className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeDefined();
    });
  });

  describe('Markdown変換', () => {
    it('見出しを正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content={'# 見出し1\n\n## 見出し2\n\n### 見出し3'} />
      );
      expect(container.querySelector('h1')).not.toBeNull();
      expect(container.querySelector('h1')?.textContent).toContain('見出し1');
      expect(container.querySelector('h2')).not.toBeNull();
      expect(container.querySelector('h3')).not.toBeNull();
    });

    it('段落を正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content="これは段落です。" />
      );
      expect(container.querySelector('p')).toBeDefined();
    });

    it('太字を正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content="これは**太字**です。" />
      );
      expect(container.querySelector('strong')?.textContent).toContain('太字');
    });

    it('イタリックを正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content="これは*イタリック*です。" />
      );
      expect(container.querySelector('em')?.textContent).toContain('イタリック');
    });

    it('取り消し線を正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content="これは~~取り消し~~です。" />
      );
      expect(container.querySelector('del')?.textContent).toContain('取り消し');
    });

    it('順序なしリストを正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content={'- 項目1\n- 項目2\n- 項目3'} />
      );
      expect(container.querySelector('ul')).not.toBeNull();
      const liElements = container.querySelectorAll('li');
      expect(liElements.length).toBeGreaterThanOrEqual(1);
    });

    it('順序付きリストを正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content={'1. 項目1\n2. 項目2\n3. 項目3'} />
      );
      expect(container.querySelector('ol')).not.toBeNull();
      const liElements = container.querySelectorAll('li');
      expect(liElements.length).toBeGreaterThanOrEqual(1);
    });

    it('引用を正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content="> これは引用です。" />
      );
      expect(container.querySelector('blockquote')).toBeDefined();
    });

    it('インラインコードを正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content="これは`インラインコード`です。" />
      );
      expect(container.querySelector('code')?.textContent).toContain('インラインコード');
    });

    it('コードブロックを正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content="```javascript\nconst x = 1;\n```" />
      );
      expect(container.querySelector('pre')).toBeDefined();
      expect(container.querySelector('pre code')).toBeDefined();
    });

    it('リンクを正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content="[リンク](https://example.com)" />
      );
      const link = container.querySelector('a');
      expect(link?.getAttribute('href')).toBe('https://example.com');
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('画像を正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content="![代替テキスト](https://example.com/image.png)" />
      );
      const img = container.querySelector('img');
      expect(img?.getAttribute('src')).toBe('https://example.com/image.png');
      expect(img?.getAttribute('alt')).toBe('代替テキスト');
    });

    it('テーブルを正しく変換する', () => {
      const tableMarkdown = `
| ヘッダー1 | ヘッダー2 |
|-----------|-----------|
| セル1     | セル2     |
| セル3     | セル4     |
`;
      const { container } = render(<MarkdownPreview content={tableMarkdown} />);
      expect(container.querySelector('table')).toBeDefined();
      expect(container.querySelectorAll('th')).toHaveLength(2);
      expect(container.querySelectorAll('td')).toHaveLength(4);
    });

    it('水平線を正しく変換する', () => {
      const { container } = render(
        <MarkdownPreview content="テキスト\n\n---\n\nテキスト" />
      );
      expect(container.querySelector('hr')).toBeDefined();
    });
  });

  describe('XSSサニタイズ', () => {
    it('scriptタグを除去する', () => {
      const { container } = render(
        <MarkdownPreview content='<script>alert("XSS")</script>' />
      );
      expect(container.querySelector('script')).toBeNull();
    });

    it('onclickイベントを除去する', () => {
      const xssContent = '<div onclick="alert(`XSS`)">クリック</div>';
      const { container } = render(
        <MarkdownPreview content={xssContent} />
      );
      const preview = container.querySelector('.markdown-preview');
      expect(preview?.innerHTML).not.toContain('onclick');
    });

    it('imgタグのonerrorを除去する', () => {
      const xssContent = '<img src="x" onerror="alert(`XSS`)">';
      const { container } = render(
        <MarkdownPreview content={xssContent} />
      );
      const img = container.querySelector('img');
      expect(img?.getAttribute('onerror')).toBeNull();
    });
  });

  describe('特殊ケース', () => {
    it('複合的なMarkdownを正しく変換する', () => {
      const complexMarkdown = `
# タイトル

これは**太字**と*イタリック*を含む段落です。

## リスト

- 項目1
  - ネスト項目
- 項目2

## コード

\`\`\`typescript
const greeting = 'Hello, World!';
console.log(greeting);
\`\`\`

> 引用テキスト

[リンク](https://example.com)
`;
      const { container } = render(
        <MarkdownPreview content={complexMarkdown} />
      );

      const preview = container.querySelector('.markdown-preview');
      expect(preview?.querySelector('h1')).toBeDefined();
      expect(preview?.querySelector('h2')).toBeDefined();
      expect(preview?.querySelector('strong')).toBeDefined();
      expect(preview?.querySelector('em')).toBeDefined();
      expect(preview?.querySelector('ul')).toBeDefined();
      expect(preview?.querySelector('pre')).toBeDefined();
      expect(preview?.querySelector('blockquote')).toBeDefined();
      expect(preview?.querySelector('a')).toBeDefined();
    });
  });
});
