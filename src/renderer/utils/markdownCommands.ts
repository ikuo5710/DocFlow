/**
 * Markdown編集コマンドユーティリティ
 *
 * CodeMirror EditorViewに対してMarkdown書式を適用する関数群
 */
import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

/**
 * 選択テキストを指定した接頭辞と接尾辞で囲む
 * 選択がない場合はプレースホルダーを挿入
 */
export function wrapSelection(
  view: EditorView,
  prefix: string,
  suffix: string,
  placeholder = 'text'
): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  const selectedText = state.sliceDoc(from, to);

  if (selectedText) {
    // 選択テキストがある場合は囲む
    view.dispatch({
      changes: { from, to, insert: `${prefix}${selectedText}${suffix}` },
      selection: EditorSelection.cursor(from + prefix.length + selectedText.length + suffix.length),
    });
  } else {
    // 選択がない場合はプレースホルダーを挿入し、プレースホルダーを選択状態にする
    const insertText = `${prefix}${placeholder}${suffix}`;
    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: EditorSelection.range(from + prefix.length, from + prefix.length + placeholder.length),
    });
  }

  view.focus();
  return true;
}

/**
 * 現在の行の先頭に指定した接頭辞を追加
 * すでに同じ接頭辞がある場合は削除（トグル動作）
 */
export function prependToLine(
  view: EditorView,
  prefix: string,
  toggle = true
): boolean {
  const { state } = view;
  const { from } = state.selection.main;
  const line = state.doc.lineAt(from);
  const lineText = line.text;

  if (toggle && lineText.startsWith(prefix)) {
    // すでに接頭辞がある場合は削除
    view.dispatch({
      changes: { from: line.from, to: line.from + prefix.length, insert: '' },
    });
  } else {
    // 接頭辞を追加
    view.dispatch({
      changes: { from: line.from, to: line.from, insert: prefix },
    });
  }

  view.focus();
  return true;
}

/**
 * 見出しレベルを切り替える
 * 既存の見出しを削除してから新しい見出しレベルを追加
 */
export function toggleHeading(
  view: EditorView,
  level: 1 | 2 | 3
): boolean {
  const { state } = view;
  const { from } = state.selection.main;
  const line = state.doc.lineAt(from);
  const lineText = line.text;

  // 既存の見出し記号を検出
  const headingMatch = lineText.match(/^(#{1,6})\s*/);
  const targetPrefix = '#'.repeat(level) + ' ';

  if (headingMatch) {
    const existingPrefix = headingMatch[0];
    if (existingPrefix === targetPrefix) {
      // 同じレベルの場合は見出しを削除
      view.dispatch({
        changes: { from: line.from, to: line.from + existingPrefix.length, insert: '' },
      });
    } else {
      // 異なるレベルの場合は置換
      view.dispatch({
        changes: { from: line.from, to: line.from + existingPrefix.length, insert: targetPrefix },
      });
    }
  } else {
    // 見出しがない場合は追加
    view.dispatch({
      changes: { from: line.from, to: line.from, insert: targetPrefix },
    });
  }

  view.focus();
  return true;
}

/**
 * リンクを挿入
 * 選択テキストがある場合はリンクテキストとして使用
 */
export function insertLink(
  view: EditorView,
  defaultText = 'link text',
  defaultUrl = 'url'
): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  const selectedText = state.sliceDoc(from, to);

  const linkText = selectedText || defaultText;
  const insertString = `[${linkText}](${defaultUrl})`;

  view.dispatch({
    changes: { from, to, insert: insertString },
    // URLを選択状態にする
    selection: EditorSelection.range(
      from + linkText.length + 3,
      from + linkText.length + 3 + defaultUrl.length
    ),
  });

  view.focus();
  return true;
}

/**
 * インラインコードまたはコードブロックを挿入
 * 選択テキストが複数行の場合はコードブロック、それ以外はインラインコード
 */
export function insertCode(view: EditorView): boolean {
  const { state } = view;
  const { from, to } = state.selection.main;
  const selectedText = state.sliceDoc(from, to);

  if (selectedText.includes('\n')) {
    // 複数行の場合はコードブロック
    const codeBlock = '```\n' + selectedText + '\n```';
    view.dispatch({
      changes: { from, to, insert: codeBlock },
      selection: EditorSelection.cursor(from + codeBlock.length),
    });
  } else if (selectedText) {
    // 単一行で選択がある場合はインラインコード
    wrapSelection(view, '`', '`', 'code');
  } else {
    // 選択がない場合はインラインコードのプレースホルダー
    wrapSelection(view, '`', '`', 'code');
  }

  return true;
}

/**
 * 箇条書きリストを切り替え
 */
export function toggleBulletList(view: EditorView): boolean {
  return prependToLine(view, '- ');
}

/**
 * 番号付きリストを切り替え
 */
export function toggleNumberedList(view: EditorView): boolean {
  return prependToLine(view, '1. ');
}

/**
 * 引用を切り替え
 */
export function toggleQuote(view: EditorView): boolean {
  return prependToLine(view, '> ');
}

/**
 * 太字を適用
 */
export function applyBold(view: EditorView): boolean {
  return wrapSelection(view, '**', '**', 'bold text');
}

/**
 * イタリックを適用
 */
export function applyItalic(view: EditorView): boolean {
  return wrapSelection(view, '*', '*', 'italic text');
}

/**
 * 取り消し線を適用
 */
export function applyStrikethrough(view: EditorView): boolean {
  return wrapSelection(view, '~~', '~~', 'strikethrough text');
}
