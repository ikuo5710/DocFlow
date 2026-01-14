# タスクリスト: Markdown HTMLビューア機能

## フェーズ1: 依存関係インストール

- [x] marked, highlight.js, dompurifyをインストール
- [x] 型定義（@types/dompurify）をインストール

## フェーズ2: MarkdownPreviewコンポーネント作成

- [x] src/renderer/components/MarkdownPreview.tsx を作成
  - [x] markedでMarkdown→HTML変換
  - [x] DOMPurifyでサニタイズ
  - [x] highlight.jsでコードハイライト
  - [x] プレビュー用CSSスタイル
- [x] src/renderer/components/MarkdownPreview.test.tsx を作成
  - [x] 基本的なMarkdown変換テスト
  - [x] XSSサニタイズテスト
  - [x] 空コンテンツテスト

## フェーズ3: EditorToolbar変更

- [x] EditorToolbarにviewModeとonViewModeChangeプロパティを追加
- [x] トグルボタンUIを追加（右端配置）
- [x] トグルボタンのスタイリング
- [x] EditorToolbar.test.tsxにトグルボタンのテストを追加

## フェーズ4: MarkdownEditor統合

- [x] MarkdownEditorにviewMode状態を追加
- [x] viewModeに応じてCodeMirror/MarkdownPreviewを切り替え
- [x] EditorToolbarにviewMode関連propsを渡す
- [x] キーボードショートカット（Ctrl+Shift+P）を追加
- [x] 統合テストを追加

## フェーズ5: 動作確認・PR作成

- [x] npm run devで動作確認（ユーザー確認済み）
- [x] npm testでテスト実行（228テスト全パス）
- [ ] 機能ブランチを作成してコミット
- [ ] PRを作成

---

## 実装後の振り返り

（実装完了後に記入）

- 実装完了日:
- 計画と実績の差分:
- 学んだこと:
- 次回への改善提案:
