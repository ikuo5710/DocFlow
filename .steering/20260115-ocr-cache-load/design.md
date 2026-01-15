# 設計書: OCR結果ファイル自動読み込み機能

## 変更対象ファイル

### Main Process（新規追加）

| ファイル | 変更内容 |
|---------|---------|
| `src/main/handlers/FileHandler.ts` | `checkOCRCacheExists`メソッド、`readOCRCache`メソッド追加 |
| `src/main/main.ts` | 新規IPCハンドラ登録 |
| `src/preload.ts` | 新規API公開 |

### Renderer Process（変更）

| ファイル | 変更内容 |
|---------|---------|
| `src/renderer/components/ParallelViewer.tsx` | キャッシュ読み込みロジック追加 |

### 型定義（追加）

| ファイル | 変更内容 |
|---------|---------|
| `src/types/file.ts` | OCRキャッシュ関連の型追加 |

## 処理フロー

```
ファイル選択 (ParallelViewer)
    │
    ▼
IPC: checkOCRCacheExists(filePath)
    │
    ├─ キャッシュ存在 → IPC: readOCRCache(filePath) → Markdown表示 + Toast通知
    │
    └─ キャッシュなし → 従来のOCR API処理
```

## API設計

### IPC API

```typescript
// キャッシュファイル存在チェック
window.api.checkOCRCache(filePath: string): Promise<{ exists: boolean; cachePath: string }>

// キャッシュファイル読み込み
window.api.readOCRCache(filePath: string): Promise<{ content: string }>
```

### FileHandler メソッド

```typescript
// OCRキャッシュファイルのパスを生成
getOCRCachePath(originalFilePath: string): string

// OCRキャッシュファイルの存在チェック
checkOCRCacheExists(originalFilePath: string): Promise<{ exists: boolean; cachePath: string }>

// OCRキャッシュファイルの読み込み
readOCRCache(originalFilePath: string): Promise<{ content: string }>
```

## キャッシュファイル命名規則

```
入力ファイル: /path/to/document.pdf
キャッシュ:   /path/to/document.pdf_ocr.md
```

- 入力ファイルの**フルネーム（拡張子含む）**に `_ocr.md` を付加
- 同じディレクトリに保存

## YAML Front Matter の処理

既存のキャッシュファイルには以下のFront Matterが含まれる可能性がある:

```yaml
---
original_file: /path/to/document.pdf
processed_at: 2026-01-15T12:00:00.000Z
---
```

読み込み時は:
1. Front Matterを含めて全文読み込み
2. Markdownエディタにそのまま表示（Front Matterも編集可能）

## エラーハンドリング

| エラー | 対処 |
|--------|------|
| キャッシュファイル読み込み失敗 | 従来のOCR処理にフォールバック |
| ファイルアクセス権限なし | エラーToast表示 + OCR処理にフォールバック |

## テスト方針

### 単体テスト

- `FileHandler.checkOCRCacheExists` - 存在する/しない場合
- `FileHandler.readOCRCache` - 正常読み込み/エラー
- `FileHandler.getOCRCachePath` - パス生成

### 統合テスト

- `ParallelViewer` - キャッシュ存在時の動作
