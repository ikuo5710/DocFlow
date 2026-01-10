# 技術仕様書 (Architecture Design Document)

本ドキュメントは、DocFlowアプリケーションの技術アーキテクチャを定義します。

## テクノロジースタック

### 言語・ランタイム

| 技術 | バージョン | 選定理由 |
|------|-----------|----------|
| Node.js | v24.12.0 | LTSによる長期サポート、Electron 39との互換性、非同期I/O処理の優位性 |
| TypeScript | 5.x | 静的型付けによるバグ早期発見、IDEサポート、コード品質向上 |
| npm | 11.x | Node.js標準搭載、依存関係の厳密な管理 |

### フレームワーク・ライブラリ

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|----------|
| Electron | 39.0.0 | デスクトップアプリフレームワーク | クロスプラットフォーム対応、Web技術での開発が可能、豊富なエコシステム |
| React | 18.x | UIライブラリ | コンポーネント指向、仮想DOM、豊富なエコシステム |
| PDF.js | 4.x | PDFレンダリング | Mozilla製で信頼性が高い、ブラウザ互換、オープンソース |
| CodeMirror | 6.x | テキストエディタ | 高性能、マークダウン対応、拡張性、アクセシビリティ |
| Mistral SDK | latest | OCR API連携 | 公式SDK、TypeScript対応、エラーハンドリング統一 |

### 開発ツール

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|----------|
| Vitest | 2.x | テストフレームワーク | 高速、TypeScriptネイティブ対応、Viteエコシステム |
| ESLint | 9.x | 静的解析 | TypeScript対応、カスタマイズ性、Flat Config |
| Prettier | 3.x | コードフォーマット | 一貫したスタイル、ESLint連携 |
| electron-builder | 25.x | アプリケーションビルド | クロスプラットフォームビルド、自動更新対応 |

## アーキテクチャパターン

### Electronアーキテクチャ

DocFlowはElectronの標準的なプロセスモデルを採用します。

```
┌─────────────────────────────────────────────────────────────────┐
│                        Electron アプリケーション                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │     Main Process        │  │     Renderer Process        │  │
│  │  ┌─────────────────┐    │  │  ┌───────────────────────┐  │  │
│  │  │ File Operations │    │  │  │    React Application   │  │  │
│  │  │ System APIs     │◄───┼──┼──┤    - FileViewer       │  │  │
│  │  │ IPC Handler     │    │  │  │    - MarkdownEditor   │  │  │
│  │  │ Native Dialogs  │    │  │  │    - Toolbar          │  │  │
│  │  └─────────────────┘    │  │  └───────────────────────┘  │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                        IPC (contextBridge)                       │
└─────────────────────────────────────────────────────────────────┘
```

**Mainプロセス**:
- Node.js APIへのアクセス（ファイルシステム、暗号化）
- ネイティブダイアログの表示
- 外部APIとの通信
- アプリケーションライフサイクル管理

**Rendererプロセス**:
- React UIのレンダリング
- ユーザーインタラクション処理
- 状態管理

**IPC通信**:
- contextBridge経由の安全な通信
- 非同期メッセージング

### レイヤードアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│   React Components, Hooks, Event Handlers                    │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
│   Controllers, IPC Handlers, State Management                │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                            │
│   Services, Business Logic, Domain Models                    │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                       │
│   External APIs, File System, Configuration                  │
└─────────────────────────────────────────────────────────────┘
```

#### Presentation Layer (プレゼンテーション層)

- **責務**: ユーザー入力の受付、UI描画、イベントハンドリング
- **許可される操作**: Application Layerの呼び出し
- **禁止される操作**: Domain/Infrastructure Layerへの直接アクセス

```typescript
// プレゼンテーション層の例
function FileViewerComponent() {
  // OK: Application Layer (IPC) を経由
  const handleOpenFile = async () => {
    const result = await window.api.openFile();
    setDocument(result);
  };

  // NG: Infrastructure Layer に直接アクセス
  // const file = await fs.readFile(path); // ❌
}
```

#### Application Layer (アプリケーション層)

- **責務**: ユースケースの調整、IPC通信、状態管理
- **許可される操作**: Domain Layerの呼び出し、IPC通信
- **禁止される操作**: Infrastructure Layerへの直接アクセス

```typescript
// アプリケーション層の例
class DocumentController {
  async openFile(): Promise<Document> {
    // OK: Domain Layer を呼び出す
    const filepath = await this.dialogService.showOpenDialog();
    return this.documentService.load(filepath);
  }
}
```

#### Domain Layer (ドメイン層)

- **責務**: ビジネスロジックの実装、ドメインモデルの管理
- **許可される操作**: Infrastructure Layerの呼び出し
- **禁止される操作**: Presentation/Application Layerへの依存

```typescript
// ドメイン層の例
class OcrService {
  async processPage(page: Page): Promise<OcrResult> {
    // ビジネスロジック: リトライ、エラーハンドリング
    const result = await this.ocrClient.process(page.content);
    return this.transformResult(result);
  }
}
```

#### Infrastructure Layer (インフラストラクチャ層)

- **責務**: 外部システムとの通信、データ永続化
- **許可される操作**: 外部API、ファイルシステムへのアクセス
- **禁止される操作**: ビジネスロジックの実装

```typescript
// インフラストラクチャ層の例
class MistralOcrClient {
  async process(imageData: Uint8Array): Promise<RawOcrResult> {
    // 純粋なAPI呼び出しのみ
    return this.client.ocr.process({ image: imageData });
  }
}
```

## データ永続化戦略

### ストレージ方式

| データ種別 | ストレージ | フォーマット | 理由 |
|-----------|----------|-------------|------|
| アプリケーション設定 | ローカルファイル | JSON | 人間が読みやすい、デバッグ容易 |
| APIキー | Electron safeStorage | 暗号化バイナリ | OS標準の暗号化機構を使用 |
| 一時ファイル | システム一時ディレクトリ | バイナリ | 自動クリーンアップ |
| 自動保存データ | ユーザーデータディレクトリ | JSON | クラッシュ時の復元用 |

### ファイル配置

```
~/.docflow/                      # macOS/Linux
%APPDATA%\DocFlow\               # Windows
├── config.json                  # アプリケーション設定
├── autosave/                    # 自動保存データ
│   └── {document-id}.json       # ドキュメントごとの自動保存
└── logs/                        # ログファイル
    └── app.log                  # アプリケーションログ
```

### 自動保存戦略

- **頻度**: 30秒ごと、または変更検知時
- **保存先**: `autosave/` ディレクトリ
- **世代管理**: 最新3世代を保持
- **復元方法**: アプリ起動時に未保存データを検出し、復元を提案

```typescript
interface AutoSaveData {
  documentId: string;
  filepath: string;
  pages: {
    pageNumber: number;
    markdownContent: string;
    lastModified: Date;
  }[];
  savedAt: Date;
}
```

## パフォーマンス要件

### レスポンスタイム

| 操作 | 目標時間 | 測定環境 |
|------|---------|---------|
| アプリケーション起動 | 3秒以内 | Core i5相当、8GB RAM、SSD |
| ファイル読み込み (10MB PDF) | 3秒以内 | 同上 |
| ページ切り替え | 100ms以内 | 同上 |
| エディタのキー入力反映 | 50ms以内 | 同上 |
| OCR処理 (1ページ) | 5秒以内 | API側の処理時間依存 |
| ファイル保存 | 1秒以内 | 同上 |

### リソース使用量

| リソース | 上限 | 理由 |
|---------|------|------|
| メモリ | 1GB | 大きなPDF（100ページ）でも快適に動作 |
| CPU | 50%平均 | バックグラウンド処理中も他作業に影響しない |
| ディスク | 100MB (アプリ本体) | 一般的なデスクトップアプリの範囲内 |

### 最適化戦略

#### PDF処理の最適化

```typescript
// 遅延読み込み: 表示中のページのみレンダリング
class PdfViewerOptimizer {
  private cache = new Map<number, RenderedPage>();
  private prefetchRange = 2; // 前後2ページをプリフェッチ

  async getPage(pageNumber: number): Promise<RenderedPage> {
    if (this.cache.has(pageNumber)) {
      return this.cache.get(pageNumber)!;
    }

    const page = await this.renderPage(pageNumber);
    this.cache.set(pageNumber, page);

    // プリフェッチ
    this.prefetchPages(pageNumber);

    // メモリ管理: キャッシュサイズ制限
    this.evictOldPages(pageNumber);

    return page;
  }
}
```

#### メモリ管理

```typescript
// 大きなPDFのメモリ管理
const CACHE_SIZE_LIMIT = 10; // 最大10ページをキャッシュ

function evictOldPages(currentPage: number): void {
  const pages = Array.from(cache.keys()).sort((a, b) => a - b);

  while (pages.length > CACHE_SIZE_LIMIT) {
    // 現在のページから最も遠いページを削除
    const farthest = pages.reduce((prev, curr) =>
      Math.abs(curr - currentPage) > Math.abs(prev - currentPage) ? curr : prev
    );
    cache.delete(farthest);
    pages.splice(pages.indexOf(farthest), 1);
  }
}
```

## セキュリティアーキテクチャ

### データ保護

#### APIキーの暗号化

```typescript
// Electron safeStorage APIを使用
import { safeStorage } from 'electron';

class SecureStorage {
  private static KEY_NAME = 'mistral_api_key';

  static saveApiKey(key: string): void {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(key);
      // 暗号化されたバイナリを保存
      fs.writeFileSync(this.getKeyPath(), encrypted);
    } else {
      throw new Error('暗号化が利用できません');
    }
  }

  static getApiKey(): string {
    const encrypted = fs.readFileSync(this.getKeyPath());
    return safeStorage.decryptString(encrypted);
  }
}
```

#### ファイルアクセス制御

```typescript
// ファイルパーミッションの設定
import { chmod } from 'fs/promises';

async function secureFile(filepath: string): Promise<void> {
  // 所有者のみ読み書き可能
  await chmod(filepath, 0o600);
}
```

### 入力検証

```typescript
// ファイル検証
function validateFile(filepath: string): ValidationResult {
  const errors: string[] = [];

  // 1. パストラバーサル攻撃の防止
  const normalized = path.normalize(filepath);
  if (normalized.includes('..')) {
    errors.push('不正なファイルパスです');
  }

  // 2. ファイル形式の検証
  const ext = path.extname(filepath).toLowerCase();
  if (!['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
    errors.push('サポートされていないファイル形式です');
  }

  // 3. ファイルサイズの検証
  const stats = fs.statSync(filepath);
  if (stats.size > MAX_FILE_SIZE) {
    errors.push(`ファイルサイズが上限(${MAX_FILE_SIZE_MB}MB)を超えています`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### Electronセキュリティ設定

```typescript
// BrowserWindowの安全な設定
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,        // Node.jsを無効化
    contextIsolation: true,        // コンテキスト分離を有効化
    sandbox: true,                 // サンドボックスを有効化
    preload: path.join(__dirname, 'preload.js'),
  },
});

// CSPの設定
mainWindow.webContents.session.webRequest.onHeadersReceived(
  (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        ],
      },
    });
  }
);
```

## スケーラビリティ設計

### データ増加への対応

- **想定データ量**: 100ページのPDF、10ファイル同時処理
- **パフォーマンス劣化対策**:
  - 遅延読み込み
  - ページキャッシュの制限
  - ストリーミング読み込み

### 機能拡張性

#### プラグインシステム（将来構想）

```typescript
// プラグインインターフェース（将来の拡張用）
interface DocFlowPlugin {
  name: string;
  version: string;

  // フック: OCR処理後の追加処理
  onOcrComplete?(result: OcrResult): Promise<OcrResult>;

  // フック: 保存前の追加処理
  onBeforeSave?(content: string): Promise<string>;
}
```

#### 設定のカスタマイズ

```typescript
interface AppConfig {
  // OCR設定
  ocr: {
    model: 'mistral-ocr-latest';
    timeout: number;
    retryCount: number;
  };

  // エディタ設定
  editor: {
    fontSize: number;
    fontFamily: string;
    lineNumbers: boolean;
    wordWrap: boolean;
    theme: 'light' | 'dark';
  };

  // ビューア設定
  viewer: {
    defaultZoom: number;
    splitRatio: number;
  };

  // 保存設定
  save: {
    defaultPath: string;
    autoSaveEnabled: boolean;
    autoSaveInterval: number;
  };
}
```

## テスト戦略

### ユニットテスト

- **フレームワーク**: Vitest
- **対象**: サービス層、ユーティリティ関数、ドメインモデル
- **カバレッジ目標**: 80%（開発ガイドラインに準拠）

```typescript
// ユニットテストの例
describe('OcrService', () => {
  it('正常にOCR処理を実行できる', async () => {
    const mockClient = createMockOcrClient();
    const service = new OcrService(mockClient);

    const result = await service.processPage(mockPage);

    expect(result.text).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });
});
```

### 統合テスト

- **方法**: IPC通信を含むMain-Renderer間のテスト
- **対象**: ファイル読み込みからOCR処理までのフロー

```typescript
// 統合テストの例
describe('File Processing Flow', () => {
  it('PDFを読み込んでOCR処理ができる', async () => {
    const document = await fileHandler.loadFile('test.pdf');
    const ocrResult = await ocrService.processPage(document.pages[0]);

    expect(document.totalPages).toBe(5);
    expect(ocrResult.markdown).toContain('# ');
  });
});
```

### E2Eテスト

- **ツール**: Playwright + @playwright/electron
- **シナリオ**: ユーザーの基本操作フロー

```typescript
// E2Eテストの例
test('ファイルを開いてOCR処理し保存する', async () => {
  const app = await launchElectronApp();

  // ファイルを開く
  await app.click('[data-testid="open-file-button"]');
  await app.setInputFiles('input[type="file"]', 'test.pdf');

  // OCR実行
  await app.click('[data-testid="run-ocr-button"]');
  await app.waitForSelector('[data-testid="ocr-complete"]');

  // 保存
  await app.click('[data-testid="save-button"]');
  await app.waitForSelector('[data-testid="save-complete"]');

  // 検証
  const savedContent = await fs.readFile('output.md', 'utf-8');
  expect(savedContent).toContain('# ');
});
```

## 技術的制約

### 環境要件

- **OS**: Windows 10以降、macOS 11以降、Ubuntu 20.04以降
- **最小メモリ**: 4GB（推奨8GB）
- **必要ディスク容量**: 200MB（アプリケーション + 依存関係）
- **ネットワーク**: OCR処理時にインターネット接続が必要

### パフォーマンス制約

- PDFの最大ページ数: 500ページ（それ以上は分割推奨）
- 画像の最大サイズ: 50MB/ファイル
- 同時処理ファイル数: 10ファイルまで

### セキュリティ制約

- APIキーはローカルに暗号化して保存（クラウド同期なし）
- 元ファイルはOCR処理以外でクラウドに送信しない
- ログにAPIキーや機密情報を出力しない

## 依存関係管理

| ライブラリ | 用途 | バージョン管理方針 |
|-----------|------|-------------------|
| electron | デスクトップフレームワーク | 固定（メジャーバージョン） |
| react | UIライブラリ | ^（マイナーバージョンまで許可） |
| pdfjs-dist | PDFレンダリング | 固定（破壊的変更のリスク） |
| @codemirror/\* | テキストエディタ | ^（マイナーバージョンまで許可） |
| typescript | 型システム | ~（パッチバージョンのみ） |
| vitest | テスト | ^（devDependencies） |
| eslint | 静的解析 | ^（devDependencies） |

### バージョン管理方針

```json
{
  "dependencies": {
    "electron": "39.0.0",           // 完全固定
    "react": "^18.2.0",             // マイナーまで許可
    "pdfjs-dist": "4.0.0"           // 完全固定
  },
  "devDependencies": {
    "typescript": "~5.3.0",         // パッチのみ許可
    "vitest": "^2.0.0"              // マイナーまで許可
  }
}
```

## チェックリスト

- [x] すべての技術選定に理由が記載されている
- [x] レイヤードアーキテクチャが明確に定義されている
- [x] パフォーマンス要件が測定可能である
- [x] セキュリティ考慮事項が記載されている
- [x] スケーラビリティが考慮されている
- [x] 自動保存戦略が定義されている
- [x] 依存関係管理のポリシーが明確である
- [x] テスト戦略が定義されている
