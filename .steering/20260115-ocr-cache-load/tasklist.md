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

- [ ] 機能ブランチを作成してコミット
- [ ] PRを作成

---

## 実装後の振り返り

（実装完了後に記入）

- 実装完了日:
- 計画と実績の差分:
- 学んだこと:
- 次回への改善提案:
