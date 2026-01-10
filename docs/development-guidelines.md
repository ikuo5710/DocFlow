# 開発ガイドライン (Development Guidelines)

本ドキュメントは、DocFlowプロジェクトにおけるコーディング規約と開発プロセスを定義します。

## 技術スタック概要

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| ランタイム | Node.js | v24.12.0 |
| デスクトップフレームワーク | Electron | 39.0.0 |
| 言語 | TypeScript | 5.x |
| テストフレームワーク | Vitest | 2.x |
| OCR API | Mistral OCR | mistral-ocr-latest |
| リンター | ESLint | 9.x |
| フォーマッター | Prettier | 3.x |

## コーディング規約

### 命名規則

#### 変数・関数

```typescript
// 変数: camelCase、名詞または名詞句
const userProfileData = fetchUserProfile();
const ocrProcessingStatus = 'completed';
const markdownContent = '';

// 関数: camelCase、動詞で始める
function extractTextFromPdf(file: File): Promise<string> { }
function validateApiKey(key: string): boolean { }
function convertToMarkdown(ocrResult: OcrResult): string { }

// Boolean: is, has, should, can で始める
const isProcessing = true;
const hasUnsavedChanges = false;
const shouldShowPreview = true;
const canExportFile = false;
```

#### クラス・インターフェース

```typescript
// クラス: PascalCase、名詞
class OcrService { }
class MarkdownEditor { }
class FileViewerController { }

// インターフェース: PascalCase
interface OcrResult {
  text: string;
  confidence: number;
  pageNumber: number;
}

interface ViewerConfig {
  zoomLevel: number;
  splitRatio: number;
}

// 型エイリアス: PascalCase
type FileType = 'pdf' | 'image';
type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';
type PageNumber = number;
```

#### 定数

```typescript
// UPPER_SNAKE_CASE
const MAX_FILE_SIZE_MB = 100;
const API_TIMEOUT_MS = 30000;
const DEFAULT_ZOOM_LEVEL = 1.0;

// 設定オブジェクトの場合
const OCR_CONFIG = {
  model: 'mistral-ocr-latest',
  timeout: 30000,
  retryCount: 3,
} as const;
```

#### ファイル名

```
// コンポーネント・クラス: PascalCase
OcrService.ts
MarkdownEditor.tsx
FileViewer.tsx

// ユーティリティ: camelCase
formatMarkdown.ts
validateFile.ts

// 定数: kebab-case
api-endpoints.ts
error-messages.ts

// テスト: 対象ファイル名 + .test または .spec
OcrService.test.ts
formatMarkdown.spec.ts
```

### コードフォーマット

Prettierの設定に従います (`.prettierrc`):

- **インデント**: 2スペース
- **行の長さ**: 最大80文字
- **セミコロン**: 必須
- **クォート**: シングルクォート
- **末尾カンマ**: ES5互換 (配列・オブジェクトの最終要素に付与)

```typescript
// フォーマット例
import { OcrService } from './services/OcrService';
import { MarkdownEditor } from './components/MarkdownEditor';

interface ProcessingOptions {
  pageRange?: { start: number; end: number };
  outputFormat: 'markdown' | 'plain';
  preserveFormatting: boolean;
}

async function processDocument(
  file: File,
  options: ProcessingOptions
): Promise<string> {
  const ocrService = new OcrService();
  const result = await ocrService.extract(file, options);
  return result.text;
}
```

### 型定義

#### 明示的な型注釈

```typescript
// 関数の引数と戻り値には型を明記
function calculateProgress(
  processedPages: number,
  totalPages: number
): number {
  return (processedPages / totalPages) * 100;
}

// 複雑なオブジェクトはインターフェースで定義
interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
  processingTime: number;
}

// ユニオン型で状態を明確に
type ViewerMode = 'side-by-side' | 'original-only' | 'markdown-only';
```

#### ジェネリクスの活用

```typescript
// 汎用的なResult型
interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

// 使用例
async function loadFile(path: string): Promise<Result<FileData>> {
  try {
    const data = await fs.readFile(path);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### 関数設計

#### 単一責務の原則

```typescript
// 良い例: 単一の責務
function extractPdfPages(file: File): Promise<PdfPage[]> {
  // PDFからページを抽出する処理のみ
}

function runOcrOnPage(page: PdfPage): Promise<OcrResult> {
  // 1ページのOCR処理のみ
}

function formatAsMarkdown(ocrResult: OcrResult): string {
  // マークダウン形式への変換のみ
}

// 悪い例: 複数の責務を持つ
function processAndFormatPdf(file: File): Promise<string> {
  // ファイル読み込み + OCR + フォーマット (責務が多すぎる)
}
```

#### 関数の長さ

- **目標**: 20行以内
- **許容**: 50行以内
- **要リファクタリング**: 100行以上

#### パラメータ設計

```typescript
// 良い例: オプションオブジェクトでまとめる
interface SaveOptions {
  path: string;
  filename?: string;
  format?: 'md' | 'txt';
  includeMetadata?: boolean;
}

function saveDocument(content: string, options: SaveOptions): Promise<void> {
  // 実装
}

// 悪い例: パラメータが多すぎる
function saveDocument(
  content: string,
  path: string,
  filename: string,
  format: string,
  includeMetadata: boolean,
  overwrite: boolean
): Promise<void> {
  // 実装
}
```

### エラーハンドリング

#### カスタムエラークラス

```typescript
// アプリケーション固有のエラークラス
class OcrError extends Error {
  constructor(
    message: string,
    public pageNumber?: number,
    public cause?: Error
  ) {
    super(message);
    this.name = 'OcrError';
  }
}

class FileValidationError extends Error {
  constructor(
    message: string,
    public filename: string,
    public reason: 'size' | 'format' | 'corrupted'
  ) {
    super(message);
    this.name = 'FileValidationError';
  }
}

class ApiKeyError extends Error {
  constructor(message: string = 'Invalid or missing API key') {
    super(message);
    this.name = 'ApiKeyError';
  }
}
```

#### エラーハンドリングパターン

```typescript
// 適切なエラーハンドリング
async function processFile(file: File): Promise<OcrResult> {
  // 入力検証
  if (!isValidFileType(file)) {
    throw new FileValidationError(
      `Unsupported file type: ${file.type}`,
      file.name,
      'format'
    );
  }

  try {
    const result = await ocrService.process(file);
    return result;
  } catch (error) {
    if (error instanceof ApiKeyError) {
      // APIキーエラー: ユーザーに設定を促す
      throw error;
    }

    // 予期しないエラー: ラップして上位に伝播
    throw new OcrError(
      `Failed to process file: ${file.name}`,
      undefined,
      error as Error
    );
  }
}
```

#### エラーメッセージ

```typescript
// 良い例: 具体的で解決策を示す
throw new FileValidationError(
  'ファイルサイズが上限(100MB)を超えています。ファイルを分割するか、' +
    '小さいファイルを選択してください。',
  file.name,
  'size'
);

// 悪い例: 曖昧で役に立たない
throw new Error('Invalid file');
```

### 非同期処理

#### async/await の使用

```typescript
// 推奨: async/await
async function loadAndProcessPdf(path: string): Promise<ProcessedDocument> {
  const file = await loadFile(path);
  const pages = await extractPages(file);
  const results = await Promise.all(pages.map((page) => runOcr(page)));
  return combineResults(results);
}

// 並列処理
async function processMultipleFiles(files: File[]): Promise<OcrResult[]> {
  // 同時実行数を制限する場合
  const CONCURRENCY_LIMIT = 3;
  const results: OcrResult[] = [];

  for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
    const batch = files.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((file) => processFile(file))
    );
    results.push(...batchResults);
  }

  return results;
}
```

### コメント規約

#### TSDoc形式

```typescript
/**
 * PDFファイルからテキストを抽出する
 *
 * @param file - 処理対象のPDFファイル
 * @param options - 抽出オプション
 * @returns 抽出されたテキストとメタデータ
 * @throws {FileValidationError} ファイルが無効な場合
 * @throws {OcrError} OCR処理に失敗した場合
 *
 * @example
 * ```typescript
 * const result = await extractText(pdfFile, {
 *   pageRange: { start: 1, end: 5 },
 *   preserveFormatting: true,
 * });
 * console.log(result.text);
 * ```
 */
async function extractText(
  file: File,
  options?: ExtractOptions
): Promise<ExtractResult> {
  // 実装
}
```

#### インラインコメント

```typescript
// 良い例: なぜそうするかを説明
// Mistral APIは1リクエストあたり20ページまでの制限があるため、
// 大きなPDFは分割して処理する
const PAGES_PER_REQUEST = 20;

// 悪い例: コードの内容を繰り返すだけ
// ページ数を20に設定
const PAGES_PER_REQUEST = 20;

// TODO/FIXMEの活用
// TODO: バッチ処理機能を実装 (Issue #XX)
// FIXME: 大きなPDFでメモリ使用量が増加する問題 (Issue #XX)
```

### セキュリティ

#### APIキーの管理

```typescript
// 良い例: 環境変数または設定ファイルから読み込み
function getApiKey(): string {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new ApiKeyError(
      'Mistral APIキーが設定されていません。' +
        '設定画面からAPIキーを入力してください。'
    );
  }
  return apiKey;
}

// 悪い例: ハードコード
const API_KEY = 'sk-xxxxxxxx'; // 絶対にしない！
```

#### 入力検証

```typescript
// ファイル検証
function validateFile(file: File): void {
  // サイズチェック
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new FileValidationError(
      `ファイルサイズが上限(${MAX_FILE_SIZE_MB}MB)を超えています`,
      file.name,
      'size'
    );
  }

  // フォーマットチェック
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    throw new FileValidationError(
      `サポートされていないファイル形式です: ${file.type}`,
      file.name,
      'format'
    );
  }
}
```

## Git運用ルール

### ブランチ戦略 (Git Flow)

```
main (本番環境)
└── develop (開発・統合環境)
    ├── feature/* (新機能開発)
    ├── fix/* (バグ修正)
    └── refactor/* (リファクタリング)
```

**運用ルール**:

- **main**: 本番リリース済みの安定版コードのみ。タグでバージョン管理
- **develop**: 次期リリースに向けた最新の開発コード
- **feature/***、**fix/***: developから分岐し、PRでdevelopへマージ
- **直接コミット禁止**: すべてのブランチでPRレビューを必須とする
- **マージ方針**: feature→develop は squash merge、develop→main は merge commit

**ブランチ命名例**:

```
feature/ocr-processing
feature/markdown-editor
fix/file-loading-error
refactor/viewer-component
```

### コミットメッセージ規約 (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type一覧**:

| Type | 説明 | バージョン影響 |
|------|------|---------------|
| feat | 新機能 | minor |
| fix | バグ修正 | patch |
| docs | ドキュメント | - |
| style | フォーマット | - |
| refactor | リファクタリング | - |
| perf | パフォーマンス改善 | patch |
| test | テスト追加・修正 | - |
| build | ビルドシステム | - |
| ci | CI/CD設定 | - |
| chore | その他 | - |

**例**:

```
feat(ocr): Mistral OCR APIとの連携を実装

PDFファイルからテキストを抽出する機能を追加しました。

実装内容:
- OcrServiceクラスの作成
- APIキー設定機能
- エラーハンドリング（リトライ、タイムアウト）

Closes #12
```

### プルリクエストプロセス

#### 作成前のチェック

- [ ] 全てのテストがパス (`npm test`)
- [ ] Lintエラーがない (`npm run lint`)
- [ ] 型チェックがパス (`npm run typecheck`)
- [ ] コードフォーマット済み (`npm run format`)
- [ ] 競合が解決されている

#### PRテンプレート

```markdown
## 概要
[変更内容の簡潔な説明]

## 変更理由
[なぜこの変更が必要か]

## 変更内容
- [変更点1]
- [変更点2]

## テスト
- [ ] ユニットテスト追加
- [ ] 統合テスト追加
- [ ] 手動テスト実施

## スクリーンショット(該当する場合)
[画像]

## 関連Issue
Closes #[Issue番号]
```

#### レビュープロセス

1. セルフレビュー
2. 自動テスト実行 (CI)
3. レビュアーアサイン
4. レビューフィードバック対応
5. 承認後マージ

## テスト戦略

### テストピラミッド

```
       /\
      /E2E\       10% (遅い、高コスト)
     /------\
    / 統合   \     20% (中程度)
   /----------\
  / ユニット   \   70% (速い、低コスト)
 /--------------\
```

### カバレッジ目標

CLAUDE.mdで定義された閾値に従います:

| 指標 | 目標 |
|------|------|
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |
| Statements | 80% |

**重要なビジネスロジック** (services/, utils/) は **90%以上** を目指します。

### テストの書き方 (Given-When-Then)

```typescript
describe('OcrService', () => {
  describe('process', () => {
    it('PDFファイルからテキストを抽出できる', async () => {
      // Given: 準備
      const service = new OcrService(mockApiClient);
      const pdfFile = createMockPdfFile('test.pdf', 2);

      // When: 実行
      const result = await service.process(pdfFile);

      // Then: 検証
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].text).toBeDefined();
      expect(result.pages[0].confidence).toBeGreaterThan(0);
    });

    it('APIエラー時にOcrErrorをスローする', async () => {
      // Given: 準備
      const service = new OcrService(mockApiClientWithError);
      const pdfFile = createMockPdfFile('test.pdf', 1);

      // When/Then: 実行と検証
      await expect(service.process(pdfFile)).rejects.toThrow(OcrError);
    });
  });
});
```

### テスト命名規則

日本語でテストの意図を明確に記述します:

```typescript
describe('MarkdownEditor', () => {
  it('入力したテキストがリアルタイムで反映される', () => { });
  it('Ctrl+Zで直前の編集を元に戻せる', () => { });
  it('未保存の変更がある場合、警告を表示する', () => { });
});
```

### モック・スタブの使用

```typescript
// 外部依存はモック化
const mockApiClient: MistralApiClient = {
  ocr: vi.fn(),
  chat: vi.fn(),
};

// ファイルシステムはモック化
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

// サービスは実装を使用
const service = new OcrService(mockApiClient);
```

## コードレビュー基準

### レビューポイント

**機能性**:
- [ ] 要件を満たしているか
- [ ] エッジケースが考慮されているか
- [ ] エラーハンドリングが適切か

**可読性**:
- [ ] 命名が明確か
- [ ] コメントが適切か
- [ ] 複雑なロジックが説明されているか

**保守性**:
- [ ] 重複コードがないか
- [ ] 責務が明確に分離されているか
- [ ] 変更の影響範囲が限定的か

**パフォーマンス**:
- [ ] 不要な計算がないか
- [ ] メモリリークの可能性がないか
- [ ] 大きなファイルでも問題なく動作するか

**セキュリティ**:
- [ ] 入力検証が適切か
- [ ] 機密情報がハードコードされていないか
- [ ] APIキーが安全に管理されているか

### レビューコメントの書き方

**優先度の明示**:

```markdown
[必須] セキュリティ: APIキーがログに出力されています
[推奨] パフォーマンス: ループ内でのAPI呼び出しを避けましょう
[提案] 可読性: この関数名をもっと明確にできませんか？
[質問] この処理の意図を教えてください
```

**建設的なフィードバック**:

```markdown
# 良い例
この実装だと、大きなPDFで処理時間が長くなる可能性があります。
ページを並列処理することで改善できます:

```typescript
const results = await Promise.all(pages.map(page => processPage(page)));
```

# 悪い例
この書き方は良くないです。
```

## 開発環境セットアップ

### 必要なツール

| ツール | バージョン | インストール方法 |
|--------|-----------|-----------------|
| Node.js | v24.12.0 | https://nodejs.org/ |
| npm | (Node.jsに付属) | - |
| Git | 最新版 | https://git-scm.com/ |
| VSCode | 最新版 | https://code.visualstudio.com/ |

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd DocFlow

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定
cp .env.example .env
# .envファイルにMISTRAL_API_KEYを設定

# 4. 開発サーバーの起動
npm run dev
```

### 推奨VSCode拡張機能

- **ESLint**: コードの静的解析
- **Prettier**: コードフォーマット
- **TypeScript Importer**: 自動インポート
- **Error Lens**: インラインエラー表示

### npm scripts

```bash
npm run dev        # 開発サーバー起動
npm run build      # TypeScriptコンパイル
npm test           # テスト実行
npm run test:watch # テスト (watchモード)
npm run test:coverage # カバレッジレポート生成
npm run lint       # ESLint実行
npm run format     # Prettier実行
npm run typecheck  # 型チェック (tsc --noEmit)
```

## 品質自動化

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
      - run: npm run build
```

### Pre-commit フック (Husky + lint-staged)

```json
// package.json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npm run lint-staged
npm run typecheck
```

## チェックリスト

実装完了前に確認:

### コード品質
- [ ] 命名が明確で一貫している
- [ ] 関数が単一の責務を持っている
- [ ] マジックナンバーがない
- [ ] 型注釈が適切に記載されている
- [ ] エラーハンドリングが実装されている

### セキュリティ
- [ ] 入力検証が実装されている
- [ ] 機密情報がハードコードされていない
- [ ] APIキーが安全に管理されている

### パフォーマンス
- [ ] 適切なデータ構造を使用している
- [ ] 不要な計算を避けている
- [ ] 大きなファイルでも問題なく動作する

### テスト
- [ ] ユニットテストが書かれている
- [ ] テストがパスする
- [ ] カバレッジ目標(80%)を達成している

### ドキュメント
- [ ] 関数・クラスにTSDocコメントがある
- [ ] 複雑なロジックにコメントがある
- [ ] TODOやFIXMEが記載されている(該当する場合)

### ツール
- [ ] Lintエラーがない
- [ ] 型チェックがパスする
- [ ] フォーマットが統一されている
