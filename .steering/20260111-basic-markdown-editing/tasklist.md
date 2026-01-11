# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: ユーティリティとフックの作成

- [x] markdownCommands.tsを作成
  - [x] `src/renderer/utils/markdownCommands.ts`を作成
  - [x] wrapSelection関数を実装（太字、イタリック、取り消し線用）
  - [x] prependToLine関数を実装（リスト、引用用）
  - [x] toggleHeading関数を実装
  - [x] insertLink関数を実装
  - [x] insertCode関数を実装

- [x] useMarkdownCommandsフックを作成
  - [x] `src/renderer/hooks/useMarkdownCommands.ts`を作成
  - [x] execBold, execItalic, execStrikethrough関数を実装
  - [x] execHeading関数を実装
  - [x] execCode関数を実装
  - [x] execLink関数を実装
  - [x] execBulletList, execNumberedList関数を実装
  - [x] execQuote関数を実装
  - [x] execUndo, execRedo関数を実装
  - [x] canUndo, canRedo状態を実装

## フェーズ2: ツールバーコンポーネントの作成

- [x] EditorToolbarコンポーネントを作成
  - [x] `src/renderer/components/EditorToolbar.tsx`を作成
  - [x] ツールバーのレイアウト実装
  - [x] 書式ボタン（Bold, Italic, Strikethrough）を追加
  - [x] 見出しボタン（H1, H2, H3）を追加
  - [x] コード・リンクボタンを追加
  - [x] リスト・引用ボタンを追加
  - [x] Undo/Redoボタンを追加
  - [x] ツールチップ表示を実装
  - [x] 無効状態のスタイリング

## フェーズ3: MarkdownEditorへの統合

- [x] MarkdownEditorを拡張
  - [x] EditorToolbarコンポーネントを統合
  - [x] useMarkdownCommandsフックを統合
  - [x] キーボードショートカットを追加
  - [x] readOnlyモード時のツールバー無効化

## フェーズ4: テスト作成

- [x] markdownCommandsのテスト
  - [x] `src/renderer/utils/markdownCommands.test.ts`を作成
  - [x] wrapSelection関数のテスト
  - [x] prependToLine関数のテスト
  - [x] toggleHeading関数のテスト

- [x] EditorToolbarのテスト
  - [x] `src/renderer/components/EditorToolbar.test.tsx`を作成
  - [x] ボタン表示のテスト
  - [x] クリックイベントのテスト
  - [x] 無効状態のテスト

## フェーズ5: 品質チェック

- [x] すべてのテストが通ることを確認
  - [x] `npm test`
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] 型エラーがないことを確認
  - [x] `npm run typecheck`

## フェーズ6: ドキュメント更新

- [x] 実装後の振り返り（このファイルの下部に記録）

---

## 実装後の振り返り

### 実装完了日
2026-01-11

### 計画と実績の差分

**計画と異なった点**:
- EditorToolbarのテストで未使用インポートのリントエラーが発生（MarkdownCommand型）
- CodeMirrorのキーマップ作成をuseCallbackでメモ化する必要があった
- **「Maximum update depth exceeded」エラーが発生** - useEffect依存配列の問題

**新たに必要になったタスク**:
- テストファイルの未使用インポート修正
- **無限ループエラーの修正**（下記参照）

**技術的理由でスキップしたタスク**:
- なし（全タスク完了）

### 発生したバグと修正

**Maximum update depth exceeded エラー**:
- 原因:
  1. `markdownKeymap`が毎レンダーで再生成されuseEffectの依存配列に含まれていた
  2. `EditorView.updateListener.reconfigure()`メソッドは存在しない（CodeMirror APIの誤り）
  3. `handleChange`がonChangeに依存し、onChange変更時にエディタを再生成していた
- 修正内容:
  1. `markdownKeymap`を`useMemo`でメモ化
  2. `handleChange`を`onChangeRef`（ref）を使ったパターンに変更
  3. `onChange`変更時のエディタ再設定useEffectを削除
  4. `ViewUpdate`型を正しくインポート

### 学んだこと

**技術的な学び**:
- CodeMirror 6のEditorView.dispatch()でテキスト変更と選択範囲を同時に操作できる
- CodeMirrorのundo/redoDepth関数で履歴の深さを取得できる
- keymapのModキーでCtrl/Cmdを抽象化できる
- EditorSelectionでカーソル位置や選択範囲を細かく制御できる
- **useEffectの依存配列に含まれる関数/オブジェクトはuseMemo/useCallbackでメモ化が必要**
- **コールバックを動的に変更する場合はrefパターンが有効**
- **CodeMirrorのupdateListenerはreconfigure()メソッドを持たない**

**プロセス上の改善点**:
- フェーズ分けによる段階的な実装が効果的だった
- ユーティリティ関数を先に実装してからフック・コンポーネントに統合するアプローチが良かった
- テストを書くことでAPIの設計ミスを早期発見できた
- **実際にアプリを動かしてテストする重要性**（テストは通っていたが実行時エラーが発生）

### 次回への改善提案
- useMarkdownCommandsフックのテストも追加すると良い（今回は時間の関係でmarkdownCommandsとEditorToolbarのみ）
- 複数行選択時の一括書式適用機能を検討
- **useEffectの依存配列に関するレビューを徹底する**
