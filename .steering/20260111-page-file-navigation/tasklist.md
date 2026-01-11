# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

### 実装可能なタスクのみを計画
- 計画段階で「実装可能なタスク」のみをリストアップ
- 「将来やるかもしれないタスク」は含めない
- 「検討中のタスク」は含めない

### タスクスキップが許可される唯一のケース
以下の技術的理由に該当する場合のみスキップ可能:
- 実装方針の変更により、機能自体が不要になった
- アーキテクチャ変更により、別の実装方法に置き換わった
- 依存関係の変更により、タスクが実行不可能になった

スキップ時は必ず理由を明記:
```markdown
- [x] ~~タスク名~~（実装方針変更により不要: 具体的な技術的理由）
```

### タスクが大きすぎる場合
- タスクを小さなサブタスクに分割
- 分割したサブタスクをこのファイルに追加
- サブタスクを1つずつ完了させる

---

## フェーズ1: ページごとのMarkdown管理

- [x] usePageMarkdownフックを作成
  - [x] `src/renderer/hooks/usePageMarkdown.ts`を作成
  - [x] pageMarkdowns（Map<number, string>）の状態管理を実装
  - [x] setPageMarkdown関数を実装
  - [x] getPageMarkdown関数を実装
  - [x] initializeFromOCR関数を実装（OCR結果からページごとに分割）

- [x] ParallelViewerにusePageMarkdownを統合
  - [x] usePageMarkdownフックを呼び出す
  - [x] ページ切り替え時にMarkdownContentを同期
  - [x] handleMarkdownChangeでsetPageMarkdownを呼び出す
  - [x] OCR結果取得時にinitializeFromOCRを呼び出す

## フェーズ2: ページジャンプ機能

- [x] PageNavigatorを拡張
  - [x] ページ番号入力フィールドを追加
  - [x] 入力値のバリデーション（1〜totalPagesの範囲チェック）
  - [x] Enterキーでジャンプ実行
  - [x] 入力フィールドのスタイル調整

## フェーズ3: ファイルリスト管理

- [x] useFileListフックを作成
  - [x] `src/renderer/hooks/useFileList.ts`を作成
  - [x] files配列の状態管理を実装
  - [x] currentFileIndex状態を実装
  - [x] addFiles関数を実装（重複チェック付き）
  - [x] removeFile関数を実装
  - [x] selectFile関数を実装

- [x] FileNavigatorコンポーネントを作成
  - [x] `src/renderer/components/FileNavigator.tsx`を作成
  - [x] ファイルリスト表示UI
  - [x] 前/次ファイルボタン
  - [x] 現在のファイルのハイライト表示
  - [x] ファイルアイコン（PDF/画像）

- [x] App.tsxに複数ファイル管理を統合
  - [x] useFileListフックを呼び出す
  - [x] FileNavigatorコンポーネントを配置
  - [x] ファイル選択時の処理を実装
  - [x] FileInputComponentとの連携

## フェーズ4: テスト作成

- [x] usePageMarkdownのテスト
  - [x] `src/renderer/hooks/usePageMarkdown.test.ts`を作成
  - [x] 初期化テスト
  - [x] setPageMarkdownテスト
  - [x] ページ切り替え時の保持テスト

- [x] useFileListのテスト
  - [x] `src/renderer/hooks/useFileList.test.ts`を作成
  - [x] ファイル追加テスト
  - [x] ファイル選択テスト
  - [x] 重複チェックテスト

- [x] PageNavigatorのテスト更新
  - [x] ページジャンプ入力のテスト追加
  - [x] バリデーションテスト

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
- テストファイルにvitest環境指定(`@vitest-environment jsdom`)が必要だった
- jest-domマッチャー（toBeInTheDocument等）がvitestでは使用不可のため、標準マッチャーに置換が必要だった
- FileInfo型にmimeTypeプロパティがなく、テストのモック修正が必要だった

**新たに必要になったタスク**:
- テストファイルへのvitest環境指定追加
- jest-domマッチャーからvitestマッチャーへの置換

**技術的理由でスキップしたタスク**:
- なし（全タスク完了）

### 学んだこと

**技術的な学び**:
- Map<number, string>を使ったページごとのMarkdown管理パターン
- useCallbackとuseMemoを活用したパフォーマンス最適化
- vitestのjsdom環境設定方法
- React Testing Libraryでの標準マッチャー活用

**プロセス上の改善点**:
- フェーズ分けによる段階的な実装が効果的だった
- テストファーストでフック実装を進められた
- tasklist.mdの即時更新により進捗が明確になった

### 次回への改善提案
- テスト作成前にvitestの環境設定を確認する
- jest-domを使わない標準マッチャーでテストを書く方針を統一
- 型定義ファイルを先に確認してからモックを作成する
