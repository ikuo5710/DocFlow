# タスクリスト: OCR結果ファイル自動読み込み機能

## フェーズ1: Main Process実装

- [x] FileHandler.tsに`getOCRCachePath`メソッド追加
- [x] FileHandler.tsに`checkOCRCacheExists`メソッド追加
- [x] FileHandler.tsに`readOCRCache`メソッド追加
- [x] FileHandler.test.tsにテスト追加

## フェーズ2: IPC設定

- [x] src/types/file.tsにOCRキャッシュ関連の型追加
- [x] src/main/ipc/fileHandlers.tsにIPCハンドラ登録
- [x] src/main/preload.ts（既存の汎用invoke経由でアクセス可能、追加不要）

## フェーズ3: Renderer Process実装

- [x] ParallelViewer.tsxにキャッシュチェック・読み込みロジック追加
- [x] キャッシュ読み込み成功時のToast通知実装
- [x] エラー時のフォールバック処理実装

## フェーズ4: テスト・検証

- [x] npm testでテスト実行（235テスト全パス）
- [ ] npm run devで動作確認（ユーザー確認待ち）
  - [ ] キャッシュファイルがある場合: OCR APIがコールされずキャッシュ内容が表示される
  - [ ] キャッシュファイルがない場合: 従来通りOCR処理が実行される
  - [ ] 保存機能が正常に動作する

## フェーズ5: PR作成

- [x] 機能ブランチを作成してコミット（feature/issue-5-ocr-cache-load）
- [x] PRを作成（https://github.com/ikuo5710/DocFlow/pull/6）
- [x] PRフィードバック対応: キャッシュファイル命名規則変更（拡張子を除去）
- [x] PRマージ完了

---

## 実装後の振り返り

- 実装完了日: 2026-01-15
- 計画と実績の差分:
  - preload.tsの変更は不要だった（既存の汎用invoke経由でアクセス可能）
  - PRレビューでキャッシュファイルの命名規則変更が必要になった
    - 変更前: `document.pdf_ocr.md`
    - 変更後: `document_ocr.md`（拡張子を除去してから`_ocr.md`を付加）
- 学んだこと:
  - Electron IPCの汎用的なinvoke設計により、新しいチャネル追加が容易
  - テスト環境でのwindow.electronモックの重要性
  - PRレビューでの命名規則に関するフィードバックは早期に対応すべき
- 次回への改善提案:
  - 命名規則はdesign.mdの段階で明確に定義しておく
  - npm run devでの動作確認もタスクリストに含めて実施する
