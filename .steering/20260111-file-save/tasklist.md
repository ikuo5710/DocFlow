# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: Main Process - FileHandler拡張

- [x] FileHandlerにsaveMarkdownメソッドを追加
  - [x] メタデータ付きのMarkdown生成（YAML Front Matter形式）
  - [x] ファイルシステムへの書き込み処理
  - [x] エラーハンドリング

- [x] FileHandlerにshowSaveDialogメソッドを追加
  - [x] Electronのdialog.showSaveDialogを使用
  - [x] デフォルトファイル名の設定
  - [x] .mdフィルター設定

## フェーズ2: Main Process - IPCハンドラ追加

- [x] fileHandlers.tsにfile:showSaveDialogハンドラを追加
- [x] fileHandlers.tsにfile:saveハンドラを追加

## フェーズ3: 型定義

- [x] src/types/file.tsに保存関連の型を追加
  - [x] MarkdownMetadata型
  - [x] SaveFileResult型

## フェーズ4: Renderer Process - フック作成

- [x] useFileSaveフックを作成
  - [x] `src/renderer/hooks/useFileSave.ts`を作成
  - [x] 保存処理の状態管理（isSaving, error, savedPath）
  - [x] saveFile関数の実装

## フェーズ5: Renderer Process - Toastコンポーネント

- [x] Toastコンポーネントを作成
  - [x] `src/renderer/components/Toast.tsx`を作成
  - [x] success/error タイプのスタイル
  - [x] 自動消去機能（成功時のみ）

## フェーズ6: ParallelViewerへの統合

- [x] ParallelViewerにuseFileSaveフックを統合
- [x] handleSave関数の実装
- [x] 保存ボタンの状態管理（isSaving中は無効化）
- [x] Toast通知の表示

## フェーズ7: テスト作成

- [x] FileHandler.saveMarkdownのテスト
  - [x] `src/main/handlers/FileHandler.test.ts`に追加
  - [x] 正常保存のテスト
  - [x] メタデータ付き保存のテスト
  - [x] エラーケースのテスト

- [x] Toastコンポーネントのテスト
  - [x] `src/renderer/components/Toast.test.tsx`を作成
  - [x] 表示/非表示のテスト
  - [x] タイプ別スタイルのテスト

## フェーズ8: 品質チェック

- [x] すべてのテストが通ることを確認
  - [x] `npm test`
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] 型エラーがないことを確認
  - [x] `npm run typecheck`

## フェーズ9: ドキュメント更新

- [x] 実装後の振り返り（このファイルの下部に記録）

---

## 実装後の振り返り

### 実装完了日
2026-01-11

### 計画と実績の差分

**計画と異なった点**:
- FileHandler.tsでElectronのdialog.showSaveDialogの呼び出し方を変更。focusedWindowがnullの場合、2引数のオーバーロードではなく1引数のオーバーロード（optionsのみ）を使用するように修正。これは型安全性のための変更。
- Toast.test.tsxでjest-domのマッチャー（toBeInTheDocument, toHaveClass等）を使用せず、既存のテストパターンに合わせてtoBeDefined(), classList.contains()等を使用。

**新たに必要になったタスク**:
- 特になし。計画通りに実装完了。

**技術的理由でスキップしたタスク**:
- なし。すべてのタスクを完了。

### 学んだこと

**技術的な学び**:
1. Electronのdialog.showSaveDialogは複数のオーバーロードがあり、BrowserWindowを第一引数として渡す場合とoptionsのみを渡す場合で型が異なる。nullやundefinedを直接渡すと型エラーになるため、条件分岐で適切なオーバーロードを呼び出す必要がある。
2. VitestでReactコンポーネントをテストする際は`@vitest-environment jsdom`コメントが必要。
3. Window.electronの型定義が既に存在する場合、重複定義はSubsequent property declarationsエラーを引き起こす。

**プロセス上の改善点**:
- テストファイル作成時に既存のテストパターン（使用しているマッチャー、環境設定など）を事前に確認することで、修正の手戻りを減らせる。

### 次回への改善提案
- 新しいReactコンポーネントのテスト作成時は、既存のテストファイル（特に同じディレクトリ内）を参照してパターンを合わせる。
- Electron APIを使用する際は、TypeScriptの型定義を確認し、オーバーロードの選択に注意する。
