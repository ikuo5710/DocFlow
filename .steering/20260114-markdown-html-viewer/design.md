# 設計書: Markdown HTMLビューア機能

## 技術選定

### 使用ライブラリ

| ライブラリ | 用途 | 選定理由 |
|-----------|------|----------|
| `marked` | Markdown→HTMLパース | 高速、軽量、広く使われている |
| `highlight.js` | シンタックスハイライト | 多言語対応、軽量 |
| `dompurify` | HTMLサニタイズ | 業界標準、XSS対策 |

## コンポーネント設計

### 変更対象

```
src/renderer/components/
├── MarkdownEditor.tsx      # 変更: viewMode状態管理、プレビュー表示切り替え
├── EditorToolbar.tsx       # 変更: トグルボタン追加
└── MarkdownPreview.tsx     # 新規: HTMLプレビューコンポーネント
```

### 型定義

```typescript
// 表示モード
type EditorViewMode = 'text' | 'preview';

// MarkdownPreviewのProps
interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

// EditorToolbarへの追加Props
interface EditorToolbarProps {
  // 既存のProps...
  viewMode: EditorViewMode;
  onViewModeChange: (mode: EditorViewMode) => void;
}
```

## 実装方針

### 1. MarkdownPreviewコンポーネント

- `marked`でMarkdownをHTMLに変換
- `DOMPurify`でサニタイズ
- `highlight.js`でコードブロックをハイライト
- `dangerouslySetInnerHTML`で安全にレンダリング

### 2. EditorToolbar変更

- 右端にトグルボタンを追加
- アイコン表示: テキストモード時は目のアイコン、プレビュー時は編集アイコン
- ツールチップ表示

### 3. MarkdownEditor変更

- `viewMode`状態を追加
- プレビューモード時はCodeMirrorを非表示、MarkdownPreviewを表示
- キーボードショートカット`Ctrl+Shift+P`で切り替え

## UI設計

### トグルボタン配置

```
┌─────────────────────────────────────────────────────┐
│ [B][I][S] │ [H1][H2][H3] │ ... │ [↩][↪] │ [Edit|Preview] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  （テキストまたはプレビュー表示）                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### プレビュースタイル

- 背景色: #ffffff
- パディング: 24px
- 最大幅: 800px（中央寄せ）
- フォント: システムフォント
- コードブロック: highlight.js のテーマ適用

## テスト方針

### ユニットテスト

1. MarkdownPreview
   - 各Markdown構文の正しいHTML変換
   - XSSサニタイズの確認
   - 空コンテンツの処理

2. EditorToolbar
   - トグルボタンのクリックイベント
   - viewMode表示の切り替え

3. MarkdownEditor
   - viewMode状態管理
   - キーボードショートカット

## セキュリティ考慮

- すべてのHTML出力をDOMPurifyでサニタイズ
- リンクのtarget属性を`_blank`に、`rel="noopener noreferrer"`を付与
- スクリプトタグの完全除去
