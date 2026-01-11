# 設計書 (Design)

## 概要
並列ビューア機能の実装設計。既存のFileInputComponentを拡張し、左右分割レイアウトを実現する。

## アーキテクチャ

### コンポーネント構成
```
App.tsx
├── ParallelViewer.tsx (新規)
│   ├── FileViewer.tsx (新規) - 左ペイン
│   ├── Splitter.tsx (新規) - リサイズハンドル
│   └── MarkdownEditor.tsx (新規) - 右ペイン
└── FileInputComponent.tsx (既存) - ファイル選択画面
```

## ファイル構成

### 新規作成ファイル
1. `src/renderer/components/ParallelViewer.tsx` - 並列ビューアのメインコンテナ
2. `src/renderer/components/FileViewer.tsx` - ファイル表示コンポーネント(左ペイン)
3. `src/renderer/components/Splitter.tsx` - リサイズハンドル
4. `src/renderer/components/MarkdownEditor.tsx` - マークダウンエディタ(右ペイン)
5. `src/renderer/components/PageNavigator.tsx` - ページナビゲーション
6. `src/renderer/hooks/useOCR.ts` - OCR処理用カスタムフック
7. `src/renderer/components/ParallelViewer.test.tsx` - テスト

### 変更ファイル
1. `src/renderer/App.tsx` - ParallelViewerの統合
2. `package.json` - CodeMirror依存追加(エディタ用)

## コンポーネント設計

### ParallelViewer
```typescript
interface ParallelViewerProps {
  file: FileInfo;
  onClose: () => void;
}

// 状態管理
interface ParallelViewerState {
  currentPage: number;
  totalPages: number;
  markdownContent: string;
  splitRatio: number; // 0.0 - 1.0
  zoomLevel: number;
  isProcessing: boolean;
  ocrResult: OCRResult | null;
}
```

### FileViewer
```typescript
interface FileViewerProps {
  file: FileInfo;
  currentPage: number;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
}
```

### MarkdownEditor
```typescript
interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}
```

### PageNavigator
```typescript
interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

## 状態フロー

```
1. ファイル選択 (FileInputComponent)
       ↓
2. ParallelViewer表示
       ↓
3. OCR処理実行 (useOCR)
       ↓
4. 結果をMarkdownEditorに表示
       ↓
5. ユーザーが編集
```

## スタイリング

### レイアウト
- Flexboxを使用した左右分割
- Splitterでリサイズ可能
- デフォルト分割比率: 50:50

### カラースキーム(docs/functional-design.mdより)
- プライマリ: #2563eb
- 背景: #f8fafc
- テキスト: #1e293b

## 依存関係

### 新規パッケージ
```json
{
  "dependencies": {
    "@codemirror/state": "^6.0.0",
    "@codemirror/view": "^6.0.0",
    "@codemirror/lang-markdown": "^6.0.0"
  }
}
```

## 既存コードとの整合性

### FileInputComponentパターンの踏襲
- useState/useCallbackの使用
- FileInfoインターフェースの活用
- インラインスタイルのパターン

### IPC通信パターン
- window.electron.ipcRenderer.invokeの使用
- 既存のocrHandlersとの連携

## キーボードショートカット

| 操作 | ショートカット |
|-----|--------------|
| 次のページ | → / PageDown |
| 前のページ | ← / PageUp |
| ズームイン | Ctrl/Cmd + + |
| ズームアウト | Ctrl/Cmd + - |
