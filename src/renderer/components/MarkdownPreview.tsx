/**
 * MarkdownPreview - MarkdownをHTMLとしてレンダリングするコンポーネント
 *
 * markedでMarkdownをHTMLに変換し、DOMPurifyでサニタイズして表示する。
 * コードブロックはhighlight.jsでシンタックスハイライトを適用する。
 */
import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

// markedの設定
const renderer = new marked.Renderer();

// リンクを新しいタブで開く設定
renderer.link = function ({ href, title, text }) {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

// markedオプションを設定
marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
});

/**
 * MarkdownをサニタイズされたHTMLに変換する
 */
function parseMarkdown(content: string): string {
  if (!content) {
    return '';
  }

  // Markdownを同期的にHTMLに変換
  const rawHtml = marked.parse(content, { async: false }) as string;

  // DOMPurifyでサニタイズ
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['target', 'rel'],
    ADD_TAGS: ['iframe'],
    ALLOW_DATA_ATTR: true,
  });

  return sanitizedHtml;
}

/**
 * コードブロックにシンタックスハイライトを適用する
 */
function applyHighlighting(container: HTMLElement): void {
  const codeBlocks = container.querySelectorAll('pre code');
  codeBlocks.forEach((block) => {
    hljs.highlightElement(block as HTMLElement);
  });
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  className = '',
}) => {
  // Markdownを変換してメモ化
  const html = useMemo(() => parseMarkdown(content), [content]);

  // ref callbackでハイライトを適用
  const containerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node && html) {
        applyHighlighting(node);
      }
    },
    [html]
  );

  if (!content) {
    return (
      <>
        <style>{previewStyles}</style>
        <div className={`markdown-preview markdown-preview--empty ${className}`}>
          <p className="markdown-preview__placeholder">
            プレビューするコンテンツがありません
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{previewStyles}</style>
      <div
        ref={containerRef}
        className={`markdown-preview ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
};

// プレビュー用スタイル
const previewStyles = `
  .markdown-preview {
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #1f2937;
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
  }

  .markdown-preview--empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .markdown-preview__placeholder {
    color: #9ca3af;
    font-style: italic;
  }

  /* 見出し */
  .markdown-preview h1 {
    font-size: 2em;
    font-weight: 700;
    margin: 0.67em 0;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #e5e7eb;
  }

  .markdown-preview h2 {
    font-size: 1.5em;
    font-weight: 600;
    margin: 0.83em 0;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #e5e7eb;
  }

  .markdown-preview h3 {
    font-size: 1.25em;
    font-weight: 600;
    margin: 1em 0;
  }

  .markdown-preview h4 {
    font-size: 1em;
    font-weight: 600;
    margin: 1.33em 0;
  }

  .markdown-preview h5 {
    font-size: 0.875em;
    font-weight: 600;
    margin: 1.67em 0;
  }

  .markdown-preview h6 {
    font-size: 0.85em;
    font-weight: 600;
    margin: 2.33em 0;
    color: #6b7280;
  }

  /* 段落 */
  .markdown-preview p {
    margin: 1em 0;
  }

  /* リンク */
  .markdown-preview a {
    color: #2563eb;
    text-decoration: none;
  }

  .markdown-preview a:hover {
    text-decoration: underline;
  }

  /* 強調 */
  .markdown-preview strong {
    font-weight: 600;
  }

  .markdown-preview em {
    font-style: italic;
  }

  .markdown-preview del {
    text-decoration: line-through;
    color: #6b7280;
  }

  /* リスト */
  .markdown-preview ul,
  .markdown-preview ol {
    margin: 1em 0;
    padding-left: 2em;
  }

  .markdown-preview li {
    margin: 0.25em 0;
  }

  .markdown-preview li > ul,
  .markdown-preview li > ol {
    margin: 0.25em 0;
  }

  /* 引用 */
  .markdown-preview blockquote {
    margin: 1em 0;
    padding: 0.5em 1em;
    border-left: 4px solid #e5e7eb;
    background-color: #f9fafb;
    color: #4b5563;
  }

  .markdown-preview blockquote p {
    margin: 0.5em 0;
  }

  /* コード */
  .markdown-preview code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.875em;
    background-color: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 4px;
  }

  .markdown-preview pre {
    margin: 1em 0;
    padding: 1em;
    background-color: #1f2937;
    border-radius: 8px;
    overflow-x: auto;
  }

  .markdown-preview pre code {
    background-color: transparent;
    padding: 0;
    font-size: 0.875em;
    color: #e5e7eb;
  }

  /* テーブル */
  .markdown-preview table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
  }

  .markdown-preview th,
  .markdown-preview td {
    padding: 0.75em 1em;
    border: 1px solid #e5e7eb;
    text-align: left;
  }

  .markdown-preview th {
    background-color: #f9fafb;
    font-weight: 600;
  }

  .markdown-preview tr:nth-child(even) {
    background-color: #f9fafb;
  }

  /* 水平線 */
  .markdown-preview hr {
    margin: 2em 0;
    border: none;
    border-top: 1px solid #e5e7eb;
  }

  /* 画像 */
  .markdown-preview img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }

  /* highlight.js テーマ (GitHub Dark風) */
  .markdown-preview pre code.hljs {
    display: block;
    overflow-x: auto;
    padding: 1em;
  }

  .hljs-comment,
  .hljs-quote {
    color: #8b949e;
    font-style: italic;
  }

  .hljs-keyword,
  .hljs-selector-tag,
  .hljs-addition {
    color: #ff7b72;
  }

  .hljs-number,
  .hljs-string,
  .hljs-meta .hljs-meta-string,
  .hljs-literal,
  .hljs-doctag,
  .hljs-regexp {
    color: #a5d6ff;
  }

  .hljs-title,
  .hljs-section,
  .hljs-name,
  .hljs-selector-id,
  .hljs-selector-class {
    color: #7ee787;
  }

  .hljs-attribute,
  .hljs-attr,
  .hljs-variable,
  .hljs-template-variable,
  .hljs-class .hljs-title,
  .hljs-type {
    color: #ffa657;
  }

  .hljs-symbol,
  .hljs-bullet,
  .hljs-subst,
  .hljs-meta,
  .hljs-meta .hljs-keyword,
  .hljs-selector-attr,
  .hljs-selector-pseudo,
  .hljs-link {
    color: #79c0ff;
  }

  .hljs-built_in,
  .hljs-deletion {
    color: #ffa198;
  }

  .hljs-emphasis {
    font-style: italic;
  }

  .hljs-strong {
    font-weight: bold;
  }
`;

export default MarkdownPreview;
