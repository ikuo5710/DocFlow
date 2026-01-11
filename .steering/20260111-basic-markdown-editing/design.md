# 設計

## 概要

既存のMarkdownEditorコンポーネントを拡張し、書式設定ツールバーとキーボードショートカットを追加します。CodeMirror 6のAPIを活用して、選択範囲への書式適用とコマンド実行を実装します。

## アーキテクチャ

### コンポーネント構成

```
MarkdownEditor/
├── MarkdownEditor.tsx        # メインコンポーネント（既存を拡張）
├── EditorToolbar.tsx         # 新規：書式設定ツールバー
├── useMarkdownCommands.ts    # 新規：Markdown編集コマンドフック
└── markdownCommands.ts       # 新規：書式変換ユーティリティ
```

### データフロー

```
┌──────────────────────────────────────────────────────────────┐
│                    MarkdownEditor                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   EditorToolbar                          │ │
│  │  [B] [I] [S] [H1] [H2] [H3] [Code] [Link] [-] [1.] [>]  │ │
│  │  [Undo] [Redo]                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                  │
│                   onCommand(commandType)                     │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               useMarkdownCommands                        │ │
│  │  - execBold()                                           │ │
│  │  - execItalic()                                         │ │
│  │  - execHeading(level)                                   │ │
│  │  - execCode()                                           │ │
│  │  - execLink()                                           │ │
│  │  - execList(type)                                       │ │
│  │  - execQuote()                                          │ │
│  │  - execUndo()                                           │ │
│  │  - execRedo()                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                  │
│               EditorView.dispatch(changes)                   │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   CodeMirror Editor                      │ │
│  │                   (テキスト編集領域)                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 詳細設計

### EditorToolbar コンポーネント

```typescript
interface EditorToolbarProps {
  onCommand: (command: MarkdownCommand) => void;
  canUndo: boolean;
  canRedo: boolean;
  disabled?: boolean;
}

type MarkdownCommand =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'strikethrough' }
  | { type: 'heading'; level: 1 | 2 | 3 }
  | { type: 'code' }
  | { type: 'link' }
  | { type: 'bulletList' }
  | { type: 'numberedList' }
  | { type: 'quote' }
  | { type: 'undo' }
  | { type: 'redo' };
```

### useMarkdownCommands フック

```typescript
interface UseMarkdownCommandsReturn {
  // 書式コマンド
  execBold: () => void;
  execItalic: () => void;
  execStrikethrough: () => void;
  execHeading: (level: 1 | 2 | 3) => void;
  execCode: () => void;
  execLink: () => void;
  execBulletList: () => void;
  execNumberedList: () => void;
  execQuote: () => void;

  // Undo/Redo
  execUndo: () => void;
  execRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function useMarkdownCommands(view: EditorView | null): UseMarkdownCommandsReturn;
```

### markdownCommands ユーティリティ

```typescript
// 選択テキストを囲む書式（太字、イタリックなど）
function wrapSelection(
  view: EditorView,
  prefix: string,
  suffix: string
): void;

// 行頭に追加する書式（見出し、リスト、引用など）
function prependToLine(
  view: EditorView,
  prefix: string
): void;

// 見出しのトグル（既存の見出しを除去してから追加）
function toggleHeading(
  view: EditorView,
  level: 1 | 2 | 3
): void;

// リンク挿入
function insertLink(
  view: EditorView,
  text?: string,
  url?: string
): void;
```

### キーボードショートカット

CodeMirrorのkeymapに追加するショートカット:

```typescript
const markdownKeymap = keymap.of([
  { key: 'Mod-b', run: () => execBold() },
  { key: 'Mod-i', run: () => execItalic() },
  { key: 'Mod-`', run: () => execCode() },
  { key: 'Mod-k', run: () => execLink() },
  { key: 'Mod-1', run: () => execHeading(1) },
  { key: 'Mod-2', run: () => execHeading(2) },
  { key: 'Mod-3', run: () => execHeading(3) },
]);
```

## UI設計

### ツールバーレイアウト

```
┌────────────────────────────────────────────────────────────────┐
│ [B] [I] [S] │ [H1] [H2] [H3] │ [<>] [🔗] │ [•] [1.] [❝] │ [↩] [↪] │
└────────────────────────────────────────────────────────────────┘
  書式        見出し           コード/リンク リスト/引用   Undo/Redo
```

### ボタン仕様

| ボタン | アイコン | ツールチップ | ショートカット表示 |
|--------|---------|-------------|------------------|
| Bold | B | 太字 | Ctrl+B |
| Italic | I | イタリック | Ctrl+I |
| Strikethrough | S | 取り消し線 | - |
| H1 | H1 | 見出し1 | Ctrl+1 |
| H2 | H2 | 見出し2 | Ctrl+2 |
| H3 | H3 | 見出し3 | Ctrl+3 |
| Code | </> | コード | Ctrl+` |
| Link | 🔗 | リンク | Ctrl+K |
| Bullet List | • | 箇条書き | - |
| Numbered List | 1. | 番号付きリスト | - |
| Quote | ❝ | 引用 | - |
| Undo | ↩ | 元に戻す | Ctrl+Z |
| Redo | ↪ | やり直し | Ctrl+Shift+Z |

### スタイル

- ツールバー背景: `#f8fafc`
- ボタンサイズ: 28px × 28px
- ボタン間隔: 4px
- セクション区切り: 1px solid #e5e7eb
- ホバー時: 背景色 `#e5e7eb`
- アクティブ時: 背景色 `#dbeafe`

## エラーハンドリング

- エディタが未初期化の場合: コマンドを無視
- 選択範囲がない場合: カーソル位置にプレースホルダーを挿入
- readOnlyモードの場合: ツールバーを無効化

## テスト方針

### ユニットテスト

1. `markdownCommands.ts` - 各書式変換関数のテスト
   - 選択テキストがある場合の動作
   - 選択テキストがない場合の動作
   - 複数行選択時の動作

2. `useMarkdownCommands.ts` - フックのテスト
   - 各コマンド関数の呼び出し
   - canUndo/canRedoの状態

### コンポーネントテスト

1. `EditorToolbar.test.tsx`
   - ボタンの表示
   - クリックイベント
   - 無効状態の表示

2. `MarkdownEditor.test.tsx` の拡張
   - ツールバーの表示
   - キーボードショートカット
