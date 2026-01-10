# リポジトリ構造定義書 (Repository Structure Document)

本ドキュメントは、DocFlowプロジェクトのディレクトリ構造と命名規則を定義します。

## プロジェクト構造

```
DocFlow/
├── src/                        # ソースコード
│   ├── main/                   # Electron Mainプロセス
│   ├── renderer/               # Electron Rendererプロセス
│   ├── shared/                 # 共有モジュール
│   └── preload/                # Preloadスクリプト
├── tests/                      # テストコード
│   ├── unit/                   # ユニットテスト
│   ├── integration/            # 統合テスト
│   └── e2e/                    # E2Eテスト
├── docs/                       # プロジェクトドキュメント
│   └── ideas/                  # アイデア・ブレインストーミング
├── config/                     # 設定ファイル
├── scripts/                    # ビルド・開発スクリプト
├── resources/                  # アプリケーションリソース
├── .claude/                    # Claude Code設定
├── .steering/                  # ステアリングファイル（作業管理）
└── .github/                    # GitHub設定
```

## ディレクトリ詳細

### src/ (ソースコードディレクトリ)

#### src/main/ (Mainプロセス)

**役割**: Electronのメインプロセスコード。Node.js APIへのアクセス、システム連携を担当。

**配置ファイル**:
- `index.ts`: アプリケーションエントリーポイント
- `handlers/*.ts`: IPCハンドラー
- `services/*.ts`: Mainプロセス用サービス

**命名規則**:
- ファイル: PascalCase (クラス)、camelCase (関数)
- ディレクトリ: kebab-case

**依存関係**:
- 依存可能: `shared/`
- 依存禁止: `renderer/`, `preload/`

**構造**:
```
src/main/
├── index.ts                    # アプリケーションエントリーポイント
├── handlers/                   # IPCハンドラー
│   ├── fileHandler.ts          # ファイル操作
│   ├── ocrHandler.ts           # OCR処理
│   └── configHandler.ts        # 設定管理
├── services/                   # Mainプロセス用サービス
│   ├── OcrService.ts           # OCRサービス
│   ├── FileService.ts          # ファイルサービス
│   └── ConfigService.ts        # 設定サービス
└── utils/                      # ユーティリティ
    ├── secureStorage.ts        # 暗号化ストレージ
    └── logger.ts               # ログユーティリティ
```

#### src/renderer/ (Rendererプロセス)

**役割**: ReactベースのUIコンポーネント。ユーザーインタラクションを担当。

**配置ファイル**:
- `App.tsx`: ルートコンポーネント
- `components/*.tsx`: UIコンポーネント
- `hooks/*.ts`: カスタムフック
- `stores/*.ts`: 状態管理

**命名規則**:
- コンポーネント: PascalCase.tsx
- フック: use[Name].ts
- ストア: [name]Store.ts

**依存関係**:
- 依存可能: `shared/`
- 依存禁止: `main/`, `preload/`

**構造**:
```
src/renderer/
├── index.tsx                   # Rendererエントリーポイント
├── App.tsx                     # ルートコンポーネント
├── components/                 # UIコンポーネント
│   ├── common/                 # 共通コンポーネント
│   │   ├── Button.tsx
│   │   ├── Dialog.tsx
│   │   └── Tooltip.tsx
│   ├── layout/                 # レイアウトコンポーネント
│   │   ├── MainLayout.tsx
│   │   ├── Toolbar.tsx
│   │   └── StatusBar.tsx
│   ├── viewer/                 # ファイルビューア
│   │   ├── FileViewer.tsx
│   │   ├── PdfViewer.tsx
│   │   └── ImageViewer.tsx
│   └── editor/                 # マークダウンエディタ
│       ├── MarkdownEditor.tsx
│       └── EditorToolbar.tsx
├── hooks/                      # カスタムフック
│   ├── useDocument.ts
│   ├── useOcr.ts
│   └── useAutoSave.ts
├── stores/                     # 状態管理
│   ├── documentStore.ts
│   ├── uiStore.ts
│   └── configStore.ts
├── styles/                     # スタイル
│   ├── global.css
│   └── variables.css
└── utils/                      # Renderer用ユーティリティ
    └── formatters.ts
```

#### src/shared/ (共有モジュール)

**役割**: Main/Renderer両プロセスで使用する共通コード。

**配置ファイル**:
- `types/*.ts`: 型定義
- `constants/*.ts`: 定数定義
- `errors/*.ts`: エラークラス

**命名規則**:
- 型定義: PascalCase
- 定数: UPPER_SNAKE_CASE

**依存関係**:
- 依存可能: なし（依存される側）
- 依存禁止: `main/`, `renderer/`, `preload/`

**構造**:
```
src/shared/
├── types/                      # 型定義
│   ├── document.ts             # ドキュメント関連
│   ├── ocr.ts                  # OCR関連
│   ├── config.ts               # 設定関連
│   └── ipc.ts                  # IPC通信
├── constants/                  # 定数定義
│   ├── fileTypes.ts            # 対応ファイル形式
│   ├── ipcChannels.ts          # IPCチャンネル名
│   └── errors.ts               # エラーコード
└── errors/                     # エラークラス
    ├── OcrError.ts
    ├── FileValidationError.ts
    └── ApiKeyError.ts
```

#### src/preload/ (Preloadスクリプト)

**役割**: contextBridgeによるMain-Renderer間のセキュアな通信インターフェース。

**配置ファイル**:
- `index.ts`: Preloadエントリーポイント
- `api/*.ts`: 公開API定義

**依存関係**:
- 依存可能: `shared/types/`
- 依存禁止: `main/`, `renderer/`

**構造**:
```
src/preload/
├── index.ts                    # Preloadエントリーポイント
└── api/                        # 公開API
    ├── fileApi.ts              # ファイル操作API
    ├── ocrApi.ts               # OCR処理API
    └── configApi.ts            # 設定API
```

### tests/ (テストディレクトリ)

#### tests/unit/

**役割**: ユニットテストの配置

**構造**:
```
tests/unit/
├── main/                       # Mainプロセスのテスト
│   └── services/
│       ├── OcrService.test.ts
│       └── FileService.test.ts
├── renderer/                   # Rendererプロセスのテスト
│   ├── components/
│   │   └── MarkdownEditor.test.tsx
│   └── hooks/
│       └── useDocument.test.ts
└── shared/                     # 共有モジュールのテスト
    └── errors/
        └── OcrError.test.ts
```

**命名規則**:
- パターン: `[テスト対象ファイル名].test.ts`
- 例: `OcrService.ts` → `OcrService.test.ts`

#### tests/integration/

**役割**: 統合テストの配置

**構造**:
```
tests/integration/
├── file-processing/            # ファイル処理フロー
│   ├── pdf-loading.test.ts
│   └── image-loading.test.ts
├── ocr/                        # OCR処理フロー
│   └── ocr-pipeline.test.ts
└── ipc/                        # IPC通信
    └── main-renderer.test.ts
```

#### tests/e2e/

**役割**: E2Eテストの配置

**構造**:
```
tests/e2e/
├── basic-workflow/             # 基本ワークフロー
│   └── open-ocr-save.test.ts
├── navigation/                 # ナビゲーション
│   └── page-navigation.test.ts
└── error-handling/             # エラーハンドリング
    └── network-error.test.ts
```

### docs/ (ドキュメントディレクトリ)

**配置ドキュメント**:
- `product-requirements.md`: プロダクト要求定義書
- `functional-design.md`: 機能設計書
- `architecture.md`: アーキテクチャ設計書
- `repository-structure.md`: リポジトリ構造定義書（本ドキュメント）
- `development-guidelines.md`: 開発ガイドライン
- `glossary.md`: 用語集

**構造**:
```
docs/
├── ideas/                      # アイデア・ブレインストーミング
│   └── initial-requirements.md
├── product-requirements.md
├── functional-design.md
├── architecture.md
├── repository-structure.md
├── development-guidelines.md
└── glossary.md
```

### config/ (設定ファイルディレクトリ)

**役割**: アプリケーション設定と環境変数

**構造**:
```
config/
├── .env.example                # 環境変数テンプレート
└── .env                        # 環境変数（.gitignore対象）
```

### scripts/ (スクリプトディレクトリ)

**役割**: ビルド・開発補助スクリプト

**構造**:
```
scripts/
├── build.ts                    # ビルドスクリプト
├── dev.ts                      # 開発サーバー起動
└── release.ts                  # リリースビルド
```

### resources/ (リソースディレクトリ)

**役割**: アプリケーションリソース（アイコン、画像など）

**構造**:
```
resources/
├── icons/                      # アプリケーションアイコン
│   ├── icon.icns               # macOS
│   ├── icon.ico                # Windows
│   └── icon.png                # Linux
└── images/                     # その他の画像
```

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 命名規則 | 例 |
|------------|--------|---------|-----|
| Mainプロセスサービス | src/main/services/ | PascalCase.ts | OcrService.ts |
| IPCハンドラー | src/main/handlers/ | camelCase.ts | fileHandler.ts |
| Reactコンポーネント | src/renderer/components/ | PascalCase.tsx | FileViewer.tsx |
| カスタムフック | src/renderer/hooks/ | use[Name].ts | useDocument.ts |
| 状態ストア | src/renderer/stores/ | [name]Store.ts | documentStore.ts |
| 型定義 | src/shared/types/ | camelCase.ts | document.ts |
| エラークラス | src/shared/errors/ | PascalCase.ts | OcrError.ts |
| 定数 | src/shared/constants/ | camelCase.ts | ipcChannels.ts |

### テストファイル

| テスト種別 | 配置先 | 命名規則 | 例 |
|-----------|--------|---------|-----|
| ユニットテスト | tests/unit/[対象パス]/ | [対象].test.ts | OcrService.test.ts |
| 統合テスト | tests/integration/[機能]/ | [シナリオ].test.ts | pdf-loading.test.ts |
| E2Eテスト | tests/e2e/[シナリオ]/ | [フロー].test.ts | open-ocr-save.test.ts |

### 設定ファイル

| ファイル種別 | 配置先 | 命名規則 |
|------------|--------|---------|
| 環境変数 | config/ | .env, .env.example |
| TypeScript設定 | プロジェクトルート | tsconfig.json |
| ESLint設定 | プロジェクトルート | eslint.config.js |
| Prettier設定 | プロジェクトルート | .prettierrc |
| Vitest設定 | プロジェクトルート | vitest.config.ts |
| Electron Builder | プロジェクトルート | electron-builder.yml |

## 命名規則

### ディレクトリ名

- **レイヤーディレクトリ**: 複数形、kebab-case
  - 例: `services/`, `handlers/`, `components/`
- **機能ディレクトリ**: 単数形、kebab-case
  - 例: `viewer/`, `editor/`, `layout/`

### ファイル名

- **クラスファイル**: PascalCase
  - 例: `OcrService.ts`, `FileViewer.tsx`
- **関数ファイル**: camelCase
  - 例: `formatMarkdown.ts`, `validateFile.ts`
- **定数ファイル**: camelCase（内部定数はUPPER_SNAKE_CASE）
  - 例: `ipcChannels.ts`（内部: `IPC_CHANNELS`）
- **フック**: use[Name]
  - 例: `useDocument.ts`, `useOcr.ts`
- **ストア**: [name]Store
  - 例: `documentStore.ts`, `configStore.ts`

### テストファイル名

- パターン: `[テスト対象].test.ts` または `[テスト対象].spec.ts`
- 例: `OcrService.test.ts`, `useDocument.test.ts`

## 依存関係のルール

### プロセス間の依存

```
Main Process          Renderer Process
      │                      │
      └──────┬───────────────┘
             │
         Preload
             │
         Shared
```

**許可される依存**:
- Main → Shared (OK)
- Renderer → Shared (OK)
- Preload → Shared/types (OK)

**禁止される依存**:
- Main ↔ Renderer (❌ 直接参照禁止、IPC経由)
- Renderer → Main (❌)
- Main → Preload (❌)

### レイヤー間の依存

```
Components (UI)
      ↓
Hooks / Stores
      ↓
Services (via IPC)
      ↓
Infrastructure (API, FS)
```

**禁止される依存**:
- Services → Components (❌)
- Infrastructure → Services (❌)

### 循環依存の禁止

```typescript
// ❌ 悪い例: 循環依存
// fileA.ts
import { funcB } from './fileB';

// fileB.ts
import { funcA } from './fileA';  // 循環依存！
```

**解決策**:
```typescript
// ✅ 良い例: 共通モジュールの抽出
// shared/types.ts
export interface SharedType { /* ... */ }

// fileA.ts
import { SharedType } from './shared/types';

// fileB.ts
import { SharedType } from './shared/types';
```

## スケーリング戦略

### 機能の追加

新しい機能を追加する際の配置方針:

1. **小規模機能**: 既存ディレクトリに配置
2. **中規模機能**: 機能別サブディレクトリを作成
3. **大規模機能**: 独立したモジュールとして分離

**例: AI誤認識修正機能の追加**
```
src/
├── main/
│   └── services/
│       └── ai/                 # 新機能ディレクトリ
│           ├── AiCorrectionService.ts
│           └── PromptBuilder.ts
└── renderer/
    └── components/
        └── ai-correction/      # 新機能コンポーネント
            ├── CorrectionPanel.tsx
            └── SuggestionList.tsx
```

### ファイルサイズの管理

**ファイル分割の目安**:
- 1ファイル: 300行以下を推奨
- 300-500行: リファクタリングを検討
- 500行以上: 分割を強く推奨

**分割方法**:
```typescript
// 悪い例: 1ファイルに全機能
// OcrService.ts (600行)

// 良い例: 責務ごとに分割
// OcrService.ts (150行) - メインサービス
// OcrRetryHandler.ts (100行) - リトライロジック
// OcrResultTransformer.ts (100行) - 結果変換
```

## 特殊ディレクトリ

### .steering/ (ステアリングファイル)

**役割**: 特定の開発作業における「今回何をするか」を定義

**構造**:
```
.steering/
└── [YYYYMMDD]-[task-name]/
    ├── requirements.md         # 今回の作業の要求内容
    ├── design.md               # 変更内容の設計
    └── tasklist.md             # タスクリスト
```

**命名規則**: `20250115-add-ai-correction` 形式

### .claude/ (Claude Code設定)

**役割**: Claude Code設定とカスタマイズ

**構造**:
```
.claude/
├── commands/                   # スラッシュコマンド
│   ├── setup-project.md
│   ├── add-feature.md
│   └── review-docs.md
├── skills/                     # タスクモード別スキル
│   ├── prd-writing/
│   ├── functional-design/
│   └── architecture-design/
└── agents/                     # サブエージェント定義
    ├── doc-reviewer.md
    └── implementation-validator.md
```

## 除外設定

### .gitignore

```gitignore
# 依存関係
node_modules/

# ビルド成果物
dist/
out/

# 環境変数
config/.env

# ログ
*.log
logs/

# OS固有
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp

# テスト
coverage/

# ステアリングファイル（オプション）
# .steering/

# Electron
release/
```

### .prettierignore, .eslintignore

```
dist/
out/
node_modules/
coverage/
*.min.js
```

## チェックリスト

- [x] ソースコードの配置先が明確に定義されている
- [x] テストファイルの配置規則が定義されている
- [x] 命名規則が具体的である
- [x] 依存関係のルールが明確である
- [x] スケーリング戦略が考慮されている
- [x] 特殊ディレクトリの用途が説明されている
- [x] 除外設定が定義されている
