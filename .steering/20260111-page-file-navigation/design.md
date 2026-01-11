# 設計書

## アーキテクチャ概要

既存のParallelViewerコンポーネントを拡張し、ページごとのMarkdown管理機能と複数ファイル管理機能を追加する。状態管理はReact Hooks（useStateとuseReducer）を使用し、コンポーネント間の状態共有はpropsとコールバックで行う。

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               FileListContext (新規)                  │   │
│  │  - files: FileInfo[]                                 │   │
│  │  - currentFileIndex: number                          │   │
│  │  - addFiles / removeFile / selectFile               │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────┴───────────────────────────┐   │
│  │              ParallelViewer (既存を拡張)              │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │           usePageMarkdown (新規Hook)          │ │   │
│  │  │  - pageMarkdowns: Map<number, string>         │ │   │
│  │  │  - getCurrentPageMarkdown()                   │ │   │
│  │  │  - setPageMarkdown(page, content)             │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │ FileViewer   │  │ Splitter     │  │ Markdown  │ │   │
│  │  │              │  │              │  │ Editor    │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  │                                                       │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │        PageNavigator (既存を拡張)              │ │   │
│  │  │  - ページジャンプ入力フィールド追加             │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              FileNavigator (新規)                      │   │
│  │  - 複数ファイル間のナビゲーション                       │   │
│  │  - ファイルリスト表示                                  │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## コンポーネント設計

### 1. usePageMarkdown (新規Hook)

**責務**:
- ページごとのMarkdown内容を管理
- ページ切り替え時にMarkdown内容を同期
- OCR結果とユーザー編集の両方を管理

**実装の要点**:
- `Map<number, string>`でページ番号をキーにMarkdownを保持
- OCR結果が返ってきたときに該当ページのMarkdownを更新
- ユーザー編集時は即座に保存

```typescript
interface UsePageMarkdownReturn {
  pageMarkdowns: Map<number, string>;
  getCurrentPageMarkdown: () => string;
  setPageMarkdown: (page: number, content: string) => void;
  initializeFromOCR: (ocrResult: string, pageCount: number) => void;
}
```

### 2. PageNavigator (既存拡張)

**責務**:
- ページ間のナビゲーション（既存）
- ページジャンプ機能（新規）

**実装の要点**:
- 入力フィールドを追加してダイレクトジャンプを実装
- 無効なページ番号の入力をバリデーション
- Enterキーでジャンプ実行

### 3. FileNavigator (新規コンポーネント)

**責務**:
- 複数ファイル間のナビゲーション
- ファイルリストの表示
- 現在のファイルのハイライト

**実装の要点**:
- ファイルリストはサイドバーまたはドロップダウンで表示
- 各ファイルのアイコン（PDF/画像）を表示
- ファイル切り替え時はParallelViewerに通知

### 4. useFileList (新規Hook)

**責務**:
- 複数ファイルの状態管理
- ファイルの追加・削除・選択

**実装の要点**:
- ファイル追加時に重複チェック
- 選択状態の管理
- ファイルごとのページ情報保持

## データフロー

### ページ切り替え

```
1. ユーザーがPageNavigatorでページ変更
2. ParallelViewerのcurrentPageが更新
3. usePageMarkdownが新しいページのMarkdownを返す
4. MarkdownEditorの内容が更新
5. FileViewerが新しいページを表示（PDF.js）
```

### ファイル切り替え

```
1. ユーザーがFileNavigatorでファイル選択
2. useFileListが選択状態を更新
3. ParallelViewerに新しいfileが渡される
4. ParallelViewerがOCRを再実行
5. usePageMarkdownがリセットされ、新しいOCR結果で初期化
```

### Markdown編集

```
1. ユーザーがMarkdownEditorで編集
2. handleMarkdownChangeが呼ばれる
3. usePageMarkdown.setPageMarkdownで保存
4. ページを切り替えても編集内容が保持される
```

## エラーハンドリング戦略

### 無効なページ番号

- 範囲外のページ番号は無視
- 入力フィールドで範囲外を入力した場合はエラーメッセージを表示

### ファイル切り替え時のエラー

- OCR処理中にファイル切り替えした場合、処理をキャンセル
- 新しいファイルのOCR処理を開始

## テスト戦略

### ユニットテスト

- usePageMarkdown: ページごとのMarkdown管理ロジック
- useFileList: ファイルリスト管理ロジック
- PageNavigator: ページジャンプ入力のバリデーション

### 統合テスト

- ページ切り替えとMarkdown同期
- ファイル切り替えとOCR再実行
- キーボードナビゲーション

## 依存ライブラリ

新しいライブラリの追加は不要。既存の依存関係で実装可能。

## ディレクトリ構造

```
src/renderer/
├── components/
│   ├── ParallelViewer.tsx      # 既存を拡張
│   ├── PageNavigator.tsx        # 既存を拡張
│   └── FileNavigator.tsx        # 新規
├── hooks/
│   ├── useOCR.ts               # 既存
│   ├── usePageMarkdown.ts      # 新規
│   └── useFileList.ts          # 新規
└── App.tsx                      # 既存を拡張
```

## 実装の順序

1. usePageMarkdownフックを作成
2. ParallelViewerにページごとのMarkdown管理を統合
3. PageNavigatorにページジャンプ機能を追加
4. useFileListフックを作成
5. FileNavigatorコンポーネントを作成
6. App.tsxに複数ファイル管理を統合
7. テストを作成
8. 品質チェック

## セキュリティ考慮事項

- ファイルパスはMainプロセス経由で取得済みのため、追加の検証は不要
- ユーザー入力（ページ番号）は数値バリデーションを実施

## パフォーマンス考慮事項

- ページごとのMarkdownはMapで管理し、O(1)でアクセス
- 大きなPDF（100ページ以上）でもメモリ使用量を抑えるため、文字列のみ保持
- ファイル切り替え時は前のファイルのMarkdownをクリア

## 将来の拡張性

- ページプレビュー（サムネイル）の追加が容易な構造
- ファイルグループ化機能の追加が容易
- 自動保存機能の追加が容易
