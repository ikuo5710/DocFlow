# 設計書

## 機能名
ファイル保存

## 設計概要

既存のElectron IPC通信パターンに従い、ファイル保存機能を実装する。

## アーキテクチャ

### コンポーネント構成

```
Renderer Process                    Main Process
┌────────────────┐                 ┌────────────────┐
│ ParallelViewer │                 │   IPC Handler  │
│   handleSave() │────invoke───────│ file:save      │
└────────────────┘                 └────────────────┘
                                          │
                                          ▼
                                   ┌────────────────┐
                                   │  FileHandler   │
                                   │  saveMarkdown()│
                                   └────────────────┘
                                          │
                                          ▼
                                   ┌────────────────┐
                                   │  File System   │
                                   └────────────────┘
```

## データフロー

### 保存シーケンス

1. ユーザーが保存ボタンをクリック
2. Renderer: 保存ダイアログ表示をMain Processに依頼
3. Main: Electronのダイアログを表示、パスを返却
4. Renderer: パスが取得できたら保存処理をMain Processに依頼
5. Main: ファイルシステムに書き込み
6. Main: 結果をRendererに返却
7. Renderer: 成功/失敗メッセージを表示

## インターフェース設計

### IPC チャンネル

#### file:showSaveDialog
保存ダイアログを表示し、選択されたパスを返す

```typescript
// Request
interface ShowSaveDialogRequest {
  defaultFileName: string;  // デフォルトファイル名
}

// Response
interface ShowSaveDialogResponse {
  canceled: boolean;
  filePath?: string;
}
```

#### file:save
ファイルを保存する

```typescript
// Request
interface SaveFileRequest {
  filePath: string;
  content: string;
  metadata?: {
    originalFilePath: string;
    processedAt: string;
  };
}

// Response
interface SaveFileResponse {
  success: boolean;
  error?: string;
}
```

### FileHandler拡張

```typescript
// 追加メソッド
class FileHandler {
  // 既存メソッド...

  /**
   * 保存ダイアログを表示
   */
  async showSaveDialog(defaultFileName: string): Promise<{
    canceled: boolean;
    filePath?: string;
  }>;

  /**
   * Markdownファイルを保存
   */
  async saveMarkdown(
    filePath: string,
    content: string,
    metadata?: MarkdownMetadata
  ): Promise<void>;
}

interface MarkdownMetadata {
  originalFilePath: string;
  processedAt: string;
}
```

## Markdownファイル形式

保存されるMarkdownファイルは以下の形式:

```markdown
---
original_file: /path/to/original.pdf
processed_at: 2026-01-11T12:00:00.000Z
---

# OCR結果の内容...
```

メタデータはYAML Front Matter形式で埋め込む。

## UI設計

### 保存ボタン状態

| 状態 | 表示 | クリック可否 |
|------|------|-------------|
| 通常 | Save | 可 |
| 保存中 | Saving... | 不可 |
| OCR処理中 | Save | 不可 |
| コンテンツなし | Save | 不可 |

### トースト通知

- 成功: 「ファイルを保存しました: {filename}」（緑色、3秒で消える）
- 失敗: 「保存に失敗しました: {error}」（赤色、手動で閉じる）

## エラーハンドリング

| エラー種別 | 処理 | メッセージ |
|-----------|------|-----------|
| ダイアログキャンセル | 何もしない | なし |
| 書き込み権限エラー | エラー通知 | 「保存先への書き込み権限がありません」 |
| ディスク容量不足 | エラー通知 | 「ディスク容量が不足しています」 |
| その他のエラー | エラー通知 | 「保存に失敗しました: {詳細}」 |

## 既存コードとの統合ポイント

### 変更が必要なファイル

1. `src/main/handlers/FileHandler.ts`
   - showSaveDialog メソッド追加
   - saveMarkdown メソッド追加

2. `src/main/ipc/fileHandlers.ts`
   - file:showSaveDialog ハンドラ追加
   - file:save ハンドラ追加

3. `src/main/preload.ts`
   - 既存のinvoke関数で対応可能（変更不要）

4. `src/renderer/components/ParallelViewer.tsx`
   - handleSave関数の実装
   - 保存中状態の追加
   - トースト通知の追加

### 新規作成ファイル

1. `src/renderer/components/Toast.tsx`
   - トースト通知コンポーネント

2. `src/renderer/hooks/useFileSave.ts`
   - ファイル保存ロジックをカプセル化したフック

## テスト計画

### ユニットテスト

1. FileHandler.saveMarkdown
   - 正常保存
   - メタデータ付き保存
   - エラーハンドリング

2. useFileSave フック
   - 保存処理の状態管理
   - エラー状態の管理

### 統合テスト

1. IPC通信
   - file:showSaveDialog
   - file:save

### E2Eテスト（手動）

1. 保存ダイアログの表示
2. ファイルの保存
3. 保存されたファイルの内容確認
