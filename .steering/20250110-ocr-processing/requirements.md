# 要求仕様 (Requirements)

## 機能名
OCR処理機能

## 概要
Mistral OCR APIを使用して、PDFおよび画像ファイルからテキストを抽出し、Markdown形式で返す機能を実装する。

## 機能要件

### FR-001: OCRサービスの実装
- Mistral OCR API (`mistral-ocr-latest`モデル) を使用したOCR処理
- 対応ファイル形式: PDF, PNG, JPEG
- 出力形式: Markdown

### FR-002: リトライ機能
- API呼び出し失敗時の自動リトライ (最大3回)
- 指数バックオフ戦略 (1秒 → 2秒 → 4秒)

### FR-003: エラーハンドリング
- OCR専用のエラークラス (`OCRError`) を実装
- エラーコード: `API_ERROR`, `TIMEOUT`, `INVALID_RESPONSE`, `RATE_LIMIT`

### FR-004: IPC統合
- Electron IPC経由でRenderer processからOCR処理を呼び出し可能
- チャンネル名: `ocr:process`

## 非機能要件

### NFR-001: タイムアウト
- API呼び出しタイムアウト: 30秒

### NFR-002: APIキー管理
- 環境変数 `MISTRAL_API_KEY` からAPIキーを取得
- セキュアな管理 (ハードコードしない)

### NFR-003: テスト
- 80%以上のカバレッジ
- ユニットテスト: モック使用
- エラーケースのテスト

## 関連ドキュメント
- [architecture.md](../../../docs/architecture.md) - システムアーキテクチャ
- [functional-design.md](../../../docs/functional-design.md) - 機能設計
