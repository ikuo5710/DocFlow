# Design - ファイル入力機能

作成日: 2026-01-08

## アーキテクチャ概要

Electronアプリケーションとして、メインプロセスとレンダラープロセスの2層構造を採用します。

```
┌─────────────────────────────────────┐
│      Renderer Process (UI)          │
│  ┌───────────────────────────────┐  │
│  │  FileInputComponent           │  │
│  │  - DragDropArea               │  │
│  │  - FileSelectButton           │  │
│  │  - FilePreview                │  │
│  └───────────────────────────────┘  │
│              │                       │
│              ↓ IPC                   │
│  ┌───────────────────────────────┐  │
│  │  FileInputService             │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
              │
              ↓ IPC
┌─────────────────────────────────────┐
│       Main Process                  │
│  ┌───────────────────────────────┐  │
│  │  FileHandler                  │  │
│  │  - validateFile()             │  │
│  │  - readFile()                 │  │
│  │  - extractPDFMetadata()       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## コンポーネント設計

### 1. FileInputComponent (Renderer Process)

**責務**:
- ユーザーインターフェースの表示と操作
- ドラッグ&ドロップのイベントハンドリング
- ファイル選択ダイアログの表示
- ファイルプレビューの表示

**実装の要点**:
- Reactコンポーネントとして実装(TypeScript + React)
- ドラッグ&ドロップイベント: `onDragOver`, `onDrop`
- ファイル選択: `<input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple />`
- プレビュー: PDFは`pdf.js`を使用、画像は`<img>`タグで表示

### 2. FileInputService (Renderer Process)

**責務**:
- ファイル入力ロジックの管理
- メインプロセスとのIPC通信
- ファイル状態の管理(React state/context)

**実装の要点**:
- TypeScriptクラスとして実装
- IPC通信: `window.electron.ipcRenderer.invoke('file:validate', filePath)`
- エラーハンドリングを含む

### 3. FileHandler (Main Process)

**責務**:
- ファイルバリデーション(形式チェック、破損チェック)
- ファイル読み込み(fs.readFile)
- PDFメタデータ抽出(ページ数など)

**実装の要点**:
- TypeScriptモジュールとして実装
- `pdf-parse`または`pdfjs-dist`を使用してPDF解析
- セキュリティ: ファイルパスのサニタイゼーション

## データフロー

### ファイル読み込みフロー
```
1. ユーザーがファイルをドラッグ&ドロップまたはファイル選択
2. FileInputComponent → FileInputService へファイルパスを渡す
3. FileInputService → Main Process (FileHandler) へIPCで送信
4. FileHandler がファイルバリデーションを実行
5. FileHandler がファイル読み込み・メタデータ抽出を実行
6. FileHandler → FileInputService へ結果を返す
7. FileInputService → FileInputComponent へ結果を渡す
8. FileInputComponent がプレビューを表示
```

## エラーハンドリング戦略

### カスタムエラークラス

```typescript
class FileInputError extends Error {
  constructor(
    message: string,
    public code: 'UNSUPPORTED_FORMAT' | 'FILE_CORRUPTED' | 'FILE_TOO_LARGE' | 'READ_ERROR'
  ) {
    super(message);
    this.name = 'FileInputError';
  }
}
```

### エラーハンドリングパターン

- **サポート外形式**: `UNSUPPORTED_FORMAT` エラーを投げ、UIに「対応していないファイル形式です」と表示
- **破損ファイル**: `FILE_CORRUPTED` エラーを投げ、UIに「ファイルが破損しています」と表示
- **ファイル読み込み失敗**: `READ_ERROR` エラーを投げ、UIに「ファイルの読み込みに失敗しました」と表示

## テスト戦略

### ユニットテスト
- FileInputService: ファイルバリデーションロジック
- FileHandler: ファイル読み込み、メタデータ抽出

### 統合テスト
- End-to-End: ドラッグ&ドロップからプレビュー表示まで
- End-to-End: ファイル選択ダイアログからプレビュー表示まで
- エラーケース: サポート外形式、破損ファイル

### テストファイル
- `src/renderer/components/FileInputComponent.test.tsx`
- `src/renderer/services/FileInputService.test.ts`
- `src/main/handlers/FileHandler.test.ts`

## 依存ライブラリ

```json
{
  "dependencies": {
    "electron": "39.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "pdf-parse": "^1.1.1"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/pdf-parse": "^1.1.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

## ディレクトリ構造

```
src/
├── main/
│   ├── handlers/
│   │   └── FileHandler.ts
│   ├── ipc/
│   │   └── fileHandlers.ts        # IPC handlers
│   └── main.ts
├── renderer/
│   ├── components/
│   │   ├── FileInputComponent.tsx
│   │   └── FileInputComponent.test.tsx
│   ├── services/
│   │   ├── FileInputService.ts
│   │   └── FileInputService.test.ts
│   └── App.tsx
└── types/
    └── file.ts                    # Shared types
```

## 実装の順序

1. **プロジェクトセットアップ**
   - package.jsonの作成
   - TypeScript、ESLint、Prettierの設定
   - Electronのボイラープレート作成

2. **基本的なElectronアプリケーション**
   - Main Processの基本実装
   - Renderer Processの基本実装(React)
   - IPC通信の基本実装

3. **ファイルハンドラー(Main Process)**
   - FileHandlerの実装
   - ファイルバリデーションロジック
   - PDF/画像の読み込みロジック

4. **ファイル入力UI(Renderer Process)**
   - FileInputComponentの実装
   - ドラッグ&ドロップ機能
   - ファイル選択ダイアログ機能

5. **ファイルプレビュー**
   - PDFプレビューの実装
   - 画像プレビューの実装

6. **エラーハンドリング**
   - カスタムエラークラスの実装
   - エラーメッセージの表示

7. **テスト**
   - ユニットテストの実装
   - 統合テストの実装

8. **品質チェック**
   - Lint、TypeCheck、Test実行

## セキュリティ考慮事項

- ファイルパスのサニタイゼーション: パストラバーサル攻撃を防ぐ
- ファイルサイズ制限: メモリ枯渇を防ぐため、100MB以上のファイルは警告を表示
- ファイル形式検証: MIMEタイプと拡張子の両方をチェック

## パフォーマンス考慮事項

- PDFのメタデータ抽出: 全ページを読み込まず、最初のページのみプレビュー表示
- 大容量ファイル: ストリーミング読み込みを検討(将来的な拡張)
- プレビュー画像: キャッシュして再描画コストを削減

## 将来の拡張性

- 複数ファイルの同時プレビュー表示
- ファイルのドラッグ&ドロップによる並び替え
- ファイル履歴の保存と復元
- クラウドストレージからのファイル読み込み(Phase 3以降)
