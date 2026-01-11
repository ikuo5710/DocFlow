# 設計書 (Design)

## 概要
OCR処理機能の実装設計。既存の`FileHandler`パターンに従い、`OCRService`クラスを実装する。

## アーキテクチャ

### レイヤー構成
```
Renderer Process
    ↓ IPC (ocr:process)
Main Process
    ↓
OCRService (src/main/services/OCRService.ts)
    ↓
Mistral API
```

## ファイル構成

### 新規作成ファイル
1. `src/types/ocr.ts` - OCR関連の型定義
2. `src/main/services/OCRService.ts` - OCRサービス実装
3. `src/main/ipc/ocrHandlers.ts` - IPC ハンドラー
4. `src/main/services/OCRService.test.ts` - ユニットテスト

### 変更ファイル
1. `package.json` - `@mistralai/mistralai` パッケージ追加
2. `src/main/ipc/index.ts` - OCRハンドラーの登録追加
3. `src/main/preload.ts` - OCR関連メソッドの公開

## 型定義 (src/types/ocr.ts)

```typescript
export type OCRErrorCode =
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'RATE_LIMIT';

export class OCRError extends Error {
  constructor(
    message: string,
    public code: OCRErrorCode
  ) {
    super(message);
    this.name = 'OCRError';
  }
}

export interface OCRResult {
  markdown: string;
  pageCount?: number;
}

export interface OCROptions {
  timeout?: number; // デフォルト: 30000ms
  maxRetries?: number; // デフォルト: 3
}
```

## OCRService設計 (src/main/services/OCRService.ts)

### クラス構成
```typescript
export class OCRService {
  private client: Mistral;
  private readonly DEFAULT_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 3;

  constructor(apiKey?: string);

  async processFile(filePath: string, options?: OCROptions): Promise<OCRResult>;

  private async callAPI(base64Data: string, mimeType: string): Promise<string>;

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T>;

  private getMimeType(filePath: string): string;
}
```

### リトライ戦略
- 指数バックオフ: 1秒 × 2^(retry-1)
- 最大3回リトライ
- リトライ対象: ネットワークエラー、タイムアウト、Rate Limit (429)

## IPC設計

### チャンネル定義
| チャンネル名 | 入力 | 出力 |
|-------------|------|------|
| `ocr:process` | `{ filePath: string, options?: OCROptions }` | `OCRResult` |

### エラーハンドリング
- `OCRError`をRenderer processにシリアライズして返却
- エラーコードにより適切なユーザーメッセージを表示

## 依存関係

### 新規パッケージ
```json
{
  "dependencies": {
    "@mistralai/mistralai": "^1.0.0"
  }
}
```

## セキュリティ考慮事項

1. **APIキー管理**
   - 環境変数から取得
   - Renderer processには公開しない
   - ログに出力しない

2. **入力検証**
   - ファイルパスの検証 (既存のFileHandlerを利用)
   - ファイルサイズの制限 (100MB)

## 既存コードとの整合性

### FileHandlerパターンの踏襲
- 静的定数でパラメータ管理
- カスタムエラークラスの使用
- async/await での非同期処理
- 明確なエラーメッセージ

### FileInputErrorとの関係
- OCR固有のエラーは`OCRError`を使用
- ファイル読み込みエラーは`FileInputError`をそのまま使用
