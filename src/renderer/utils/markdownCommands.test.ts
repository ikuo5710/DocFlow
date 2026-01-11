/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  wrapSelection,
  prependToLine,
  toggleHeading,
  insertLink,
  insertCode,
  toggleBulletList,
  toggleNumberedList,
  toggleQuote,
  applyBold,
  applyItalic,
  applyStrikethrough,
} from './markdownCommands';

describe('markdownCommands', () => {
  let container: HTMLDivElement;
  let view: EditorView;

  const createEditor = (content: string, selectionFrom = 0, selectionTo = 0): EditorView => {
    const state = EditorState.create({
      doc: content,
      selection: { anchor: selectionFrom, head: selectionTo },
    });
    return new EditorView({
      state,
      parent: container,
    });
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (view) {
      view.destroy();
    }
    document.body.removeChild(container);
  });

  describe('wrapSelection', () => {
    it('選択テキストがある場合、接頭辞と接尾辞で囲む', () => {
      view = createEditor('hello world', 0, 5);

      wrapSelection(view, '**', '**', 'text');

      expect(view.state.doc.toString()).toBe('**hello** world');
    });

    it('選択がない場合、プレースホルダーを挿入', () => {
      view = createEditor('hello world', 6, 6);

      wrapSelection(view, '**', '**', 'bold');

      expect(view.state.doc.toString()).toBe('hello **bold**world');
    });

    it('空のドキュメントでも動作する', () => {
      view = createEditor('', 0, 0);

      wrapSelection(view, '*', '*', 'text');

      expect(view.state.doc.toString()).toBe('*text*');
    });
  });

  describe('prependToLine', () => {
    it('行頭に接頭辞を追加する', () => {
      view = createEditor('hello world', 5, 5);

      prependToLine(view, '- ');

      expect(view.state.doc.toString()).toBe('- hello world');
    });

    it('既に接頭辞がある場合は削除する（トグル動作）', () => {
      view = createEditor('- hello world', 5, 5);

      prependToLine(view, '- ');

      expect(view.state.doc.toString()).toBe('hello world');
    });

    it('toggle=falseの場合は常に追加', () => {
      view = createEditor('- hello', 5, 5);

      prependToLine(view, '- ', false);

      expect(view.state.doc.toString()).toBe('- - hello');
    });

    it('複数行の途中でも現在の行のみに適用', () => {
      view = createEditor('line1\nline2\nline3', 8, 8);

      prependToLine(view, '> ');

      expect(view.state.doc.toString()).toBe('line1\n> line2\nline3');
    });
  });

  describe('toggleHeading', () => {
    it('見出しがない行に見出しを追加', () => {
      view = createEditor('hello world', 0, 0);

      toggleHeading(view, 1);

      expect(view.state.doc.toString()).toBe('# hello world');
    });

    it('H1をH2に変更', () => {
      view = createEditor('# hello world', 5, 5);

      toggleHeading(view, 2);

      expect(view.state.doc.toString()).toBe('## hello world');
    });

    it('同じレベルの見出しを削除（トグル）', () => {
      view = createEditor('## hello world', 5, 5);

      toggleHeading(view, 2);

      expect(view.state.doc.toString()).toBe('hello world');
    });

    it('H3を適用できる', () => {
      view = createEditor('hello world', 0, 0);

      toggleHeading(view, 3);

      expect(view.state.doc.toString()).toBe('### hello world');
    });
  });

  describe('insertLink', () => {
    it('選択テキストがない場合、デフォルトのリンクを挿入', () => {
      view = createEditor('hello world', 6, 6);

      insertLink(view);

      expect(view.state.doc.toString()).toBe('hello [link text](url)world');
    });

    it('選択テキストをリンクテキストとして使用', () => {
      view = createEditor('click here for more', 6, 10);

      insertLink(view);

      expect(view.state.doc.toString()).toBe('click [here](url) for more');
    });
  });

  describe('insertCode', () => {
    it('選択がない場合、インラインコードのプレースホルダーを挿入', () => {
      view = createEditor('hello world', 6, 6);

      insertCode(view);

      expect(view.state.doc.toString()).toBe('hello `code`world');
    });

    it('単一行の選択でインラインコード', () => {
      view = createEditor('var x = 1', 0, 9);

      insertCode(view);

      expect(view.state.doc.toString()).toBe('`var x = 1`');
    });

    it('複数行の選択でコードブロック', () => {
      view = createEditor('line1\nline2', 0, 11);

      insertCode(view);

      expect(view.state.doc.toString()).toBe('```\nline1\nline2\n```');
    });
  });

  describe('toggleBulletList', () => {
    it('箇条書きリストを追加', () => {
      view = createEditor('item', 0, 0);

      toggleBulletList(view);

      expect(view.state.doc.toString()).toBe('- item');
    });

    it('箇条書きリストを削除', () => {
      view = createEditor('- item', 3, 3);

      toggleBulletList(view);

      expect(view.state.doc.toString()).toBe('item');
    });
  });

  describe('toggleNumberedList', () => {
    it('番号付きリストを追加', () => {
      view = createEditor('item', 0, 0);

      toggleNumberedList(view);

      expect(view.state.doc.toString()).toBe('1. item');
    });

    it('番号付きリストを削除', () => {
      view = createEditor('1. item', 4, 4);

      toggleNumberedList(view);

      expect(view.state.doc.toString()).toBe('item');
    });
  });

  describe('toggleQuote', () => {
    it('引用を追加', () => {
      view = createEditor('quote text', 0, 0);

      toggleQuote(view);

      expect(view.state.doc.toString()).toBe('> quote text');
    });

    it('引用を削除', () => {
      view = createEditor('> quote text', 5, 5);

      toggleQuote(view);

      expect(view.state.doc.toString()).toBe('quote text');
    });
  });

  describe('applyBold', () => {
    it('太字を適用', () => {
      view = createEditor('hello world', 0, 5);

      applyBold(view);

      expect(view.state.doc.toString()).toBe('**hello** world');
    });
  });

  describe('applyItalic', () => {
    it('イタリックを適用', () => {
      view = createEditor('hello world', 0, 5);

      applyItalic(view);

      expect(view.state.doc.toString()).toBe('*hello* world');
    });
  });

  describe('applyStrikethrough', () => {
    it('取り消し線を適用', () => {
      view = createEditor('hello world', 0, 5);

      applyStrikethrough(view);

      expect(view.state.doc.toString()).toBe('~~hello~~ world');
    });
  });
});
