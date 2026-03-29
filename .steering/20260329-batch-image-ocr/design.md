# 設計書

## アーキテクチャ概要

既存のレイヤードアーキテクチャに沿って、各レイヤーにバッチ処理機能を追加する。

```
FileInputComponent (複数画像選択)
    ↓ "Batch OCR" ボタン
App.tsx (バッチモードでParallelViewer起動)
    ↓
ParallelViewer (バッチモード: 複数画像をページとして表示)
    ↓
useOCR.processMultipleFiles()
    ↓ IPC invoke('ocr:processMultiple')
ocrHandlers (ocr:processMultiple)
    ↓
OCRService.processMultipleFiles()
    ↓ ファイル名昇順ソート → 各画像を順次OCR
Mistral OCR API
```

## コンポーネント設計

### 1. OCRService（バックエンド）

**責務**:
- 複数画像ファイルの受け取りとファイル名昇順ソート
- 各画像の順次OCR処理と結果結合

**実装の要点**:
- `processMultipleFiles(filePaths: string[], options?: OCROptions)` メソッド追加
- `path.basename()` でファイル名を取得し `localeCompare` でソート
- 各画像を順次処理（API rate limit 対策）
- 進捗コールバックはIPC経由でイベント送信

### 2. ocrHandlers（IPC）

**責務**:
- `ocr:processMultiple` ハンドラの登録
- 進捗イベント `ocr:processMultiple:progress` の送信

**実装の要点**:
- リクエスト: `{ filePaths: string[], options?: OCROptions }`
- レスポンス: `{ success, result?: OCRResult, error? }`
- 進捗: `event.sender.send('ocr:processMultiple:progress', { current, total, fileName })`

### 3. useOCR（フロントエンド Hook）

**責務**:
- `processMultipleFiles` アクション追加
- バッチ処理の進捗状態管理

**実装の要点**:
- `progress: { current: number, total: number, fileName: string } | null` を state に追加
- IPC `ocr:processMultiple:progress` イベントをリッスン

### 4. App.tsx / FileInputComponent（UI）

**責務**:
- バッチOCRの起動トリガー
- バッチモードでのParallelViewer起動

**実装の要点**:
- `App.tsx` に `batchFiles` state を追加
- `handleBatchOCR(files: FileInfo[])` でバッチモード起動
- ParallelViewerに `batchFiles` prop を渡す

### 5. ParallelViewer（バッチモード対応）

**責務**:
- バッチモード時、複数画像をページとして表示
- 左ペインで各画像のプレビュー、右ペインでOCR結果の編集

**実装の要点**:
- `batchFiles?: FileInfo[]` prop 追加
- バッチモード判定: `batchFiles` が存在する場合
- `totalPages = batchFiles.length`
- 左ペインの FileViewer に `batchFiles[currentPage - 1]` を渡す
- OCR処理は `processMultipleFiles` を使用
- 保存時のメタデータ: `original_file` にディレクトリパスを設定

## データフロー

### バッチOCR処理
```
1. ユーザーが複数画像を選択しファイルリストに表示
2. 「Batch OCR」ボタン押下
3. App.tsxがbatchFilesをセットしParallelViewerを起動
4. ParallelViewerがuseOCR.processMultipleFilesを呼び出し
5. IPC経由でOCRService.processMultipleFilesに到達
6. ファイル名昇順にソートし、各画像を順次OCR
7. 進捗イベントをIPCで送信（UIで進捗表示）
8. 全画像処理完了後、結合されたMarkdownを返却
9. usePageMarkdownで初期化（各画像=1ページ）
10. ユーザーが編集・保存
```

## エラーハンドリング戦略

- 個別画像のOCR失敗時: エラーをスキップせず処理全体を失敗とする
- 既存のOCRError/retryWithBackoff機構をそのまま活用

## テスト戦略

### ユニットテスト
- `OCRService.processMultipleFiles`: ファイル名ソート順の検証、結果結合の検証
- `useOCR`: processMultipleFiles の状態遷移テスト

### 統合テスト
- IPC `ocr:processMultiple` ハンドラの正常系・異常系

## ディレクトリ構造

```
src/
├── main/
│   ├── services/OCRService.ts          # processMultipleFiles追加
│   └── ipc/ocrHandlers.ts             # ocr:processMultiple追加
├── renderer/
│   ├── hooks/useOCR.ts                 # processMultipleFiles追加
│   ├── components/
│   │   ├── App.tsx                     # batchFiles state, handleBatchOCR
│   │   ├── FileInputComponent.tsx      # Batch OCRボタン追加
│   │   └── ParallelViewer.tsx          # batchFiles対応
│   └── services/FileInputService.ts    # 変更なし
└── types/ocr.ts                        # 変更なし（OCRResult再利用）
```

## 実装の順序

1. OCRService.processMultipleFiles（バックエンド基盤）
2. ocrHandlers `ocr:processMultiple`（IPC）
3. useOCR.processMultipleFiles（フロントエンドHook）
4. ParallelViewerバッチモード対応
5. App.tsx / FileInputComponentのUI変更
6. テスト
7. 品質チェック

## パフォーマンス考慮事項

- 画像は順次処理（並列処理はAPI rate limitリスクがある）
- 進捗表示により体感速度を改善
