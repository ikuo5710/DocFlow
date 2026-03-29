# タスクリスト

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク（`[ ]`）を残したまま作業を終了しない

---

## フェーズ1: バックエンド実装

- [x] OCRService に processMultipleFiles メソッド追加
  - [x] ファイルパス配列を受け取る
  - [x] path.basename でファイル名昇順にソート
  - [x] 各画像を順次 processFile で処理
  - [x] 結果を PAGE_SEPARATOR で結合し OCRResult を返す
  - [x] 進捗コールバック対応（onProgress）

- [x] ocrHandlers に ocr:processMultiple ハンドラ追加
  - [x] リクエスト型定義（filePaths, options）
  - [x] 進捗イベント送信（ocr:processMultiple:progress）
  - [x] レスポンス返却

## フェーズ2: フロントエンドHook

- [x] useOCR に processMultipleFiles アクション追加
  - [x] progress state 追加（current, total, fileName）
  - [x] IPC invoke('ocr:processMultiple') 呼び出し
  - [x] 進捗イベントリスナー登録・解除

## フェーズ3: UI実装

- [x] ParallelViewer をバッチモード対応
  - [x] batchFiles prop 追加
  - [x] バッチモード時: totalPages = batchFiles.length
  - [x] バッチモード時: FileViewerに現在ページの画像ファイルを渡す
  - [x] バッチモード時: processMultipleFiles で一括OCR
  - [x] バッチモード時: 進捗表示
  - [x] バッチモード時: 保存のデフォルトファイル名（ディレクトリ名_ocr.md）

- [x] FileInputComponent に Batch OCR ボタン追加
  - [x] 画像ファイルが2つ以上の場合に表示
  - [x] onBatchOCR コールバック prop 追加

- [x] App.tsx にバッチモード起動ロジック追加
  - [x] batchFiles state
  - [x] handleBatchOCR ハンドラ
  - [x] ParallelViewer に batchFiles を渡す

## フェーズ4: テスト

- [x] OCRService.processMultipleFiles のユニットテスト
  - [x] ファイル名昇順ソートの検証
  - [x] 結果結合の検証
  - [x] エラーハンドリングの検証

- [x] ocrHandlers ocr:processMultiple の統合テスト

- [x] useOCR processMultipleFiles のテスト

## フェーズ5: 品質チェックと修正

- [x] すべてのテストが通ることを確認
  - [x] `npm test`
- [x] リントエラーがないことを確認
  - [x] `npm run lint`
- [x] 型エラーがないことを確認
  - [x] `npm run typecheck`
- [x] ビルドが成功することを確認
  - [x] `npm run build`

---

## 実装後の振り返り

### 実装完了日
2026-03-29

### 計画と実績の差分

**計画と異なった点**:
- ParallelViewer.tsx の Window インターフェース重複宣言が型エラーを起こしたため削除（FileInputService.tsで既に宣言済み）
- ParallelViewer.test.tsx の既存モックに progress/processMultipleFiles の追加が必要だった
- 既存の loadedFromCache 未使用変数のlintエラーを合わせて修正

**新たに必要になったタスク**:
- 既存テストのモック修正（UseOCRReturn型変更に伴う）

**技術的理由でスキップしたタスク**（該当する場合のみ）:
- なし

### 学んだこと

**技術的な学び**:
- useOCRのインターフェース変更は既存テストへの波及が大きいため、新しいプロパティは optional にすることも検討に値する
- IPC進捗イベントのリスナー登録・解除は ref を使って管理するとクリーンアップが確実

**プロセス上の改善点**:
- 型チェックを早めに実行して既存テストへの影響を事前に把握すべきだった

### 次回への改善提案
- フェーズ実装中に定期的に typecheck を実行し、早期に型エラーを検出する
