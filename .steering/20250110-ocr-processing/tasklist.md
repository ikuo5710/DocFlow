# タスクリスト (Task List)

## 実装タスク

### 1. 依存パッケージのインストール
- [x] `@mistralai/mistralai` パッケージを追加
- [x] `npm install` 実行

### 2. 型定義の作成
- [x] `src/types/ocr.ts` を作成
  - OCRErrorCode 型
  - OCRError クラス
  - OCRResult インターフェース
  - OCROptions インターフェース

### 3. OCRServiceの実装
- [x] `src/main/services/OCRService.ts` を作成
  - constructor (APIキー取得)
  - processFile メソッド
  - callAPI メソッド
  - retryWithBackoff メソッド
  - getMimeType メソッド

### 4. IPCハンドラーの実装
- [x] `src/main/ipc/ocrHandlers.ts` を作成
- [x] `src/main/ipc/index.ts` に登録追加
- [x] `src/main/preload.ts` にメソッド公開 (既存の汎用invokeで対応可能)

### 5. ユニットテストの作成
- [x] `src/main/services/OCRService.test.ts` を作成
  - 正常系テスト
  - エラー系テスト
  - リトライテスト
  - モック設定

### 6. 検証
- [x] `npm test` でテスト実行 (51テスト全パス)
- [x] `npm run lint` でリント実行 (エラーなし)
- [x] `npm run typecheck` で型チェック実行 (エラーなし)

## 進捗記録

| タスク | ステータス | 完了日時 |
|--------|----------|---------|
| 依存パッケージ | 完了 | 2025-01-10 |
| 型定義 | 完了 | 2025-01-10 |
| OCRService | 完了 | 2025-01-10 |
| IPCハンドラー | 完了 | 2025-01-10 |
| テスト | 完了 | 2025-01-10 |
| 検証 | 完了 | 2025-01-11 |
