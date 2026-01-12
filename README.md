# DocFlow

PDF や画像をAIフレンドリーな Markdown 形式に変換するデスクトップアプリケーションです。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)

## 特徴

- **高精度OCR** - Mistral OCR API による高精度なテキスト抽出
- **サイドバイサイド表示** - 元ファイルと Markdown を並べて確認・編集
- **リアルタイム編集** - CodeMirror ベースの Markdown エディタ
- **ポータブル** - インストール不要、exe ファイル1つで動作

## スクリーンショット

```
+---------------------------+---------------------------+
|                           |                           |
|     元のPDF/画像          |     Markdown エディタ     |
|                           |                           |
|   [ページナビゲーション]   |   [ツールバー]            |
|                           |                           |
+---------------------------+---------------------------+
```

## ダウンロード

[Releases](https://github.com/ikuo5710/DocFlow/releases) から最新版をダウンロードしてください。

- **DocFlow-x.x.x-portable.exe** - Windows 用ポータブル版

## 必要なもの

- **Mistral API キー** - [Mistral AI](https://mistral.ai/) から取得

## 使い方

### 1. API キーの設定

アプリケーションと同じフォルダに `.env` ファイルを作成し、API キーを記載します。

```
MISTRAL_API_KEY=your_api_key_here
```

### 2. ファイルを開く

- PDF ファイル（複数ページ対応）
- 画像ファイル（JPEG, PNG）

をドラッグ＆ドロップまたはファイル選択で開きます。

### 3. OCR 処理

ファイルを開くと自動的に OCR 処理が開始されます。

### 4. 編集・保存

- 左ペイン: 元ファイルの表示（ズーム、ページ移動）
- 右ペイン: OCR 結果の編集

編集後、「Save」ボタンで Markdown ファイルとして保存できます。

## キーボードショートカット

### エディタ

| ショートカット | 機能 |
|---------------|------|
| `Ctrl+B` | 太字 |
| `Ctrl+I` | 斜体 |
| `Ctrl+K` | リンク挿入 |
| `Ctrl+`` | コード |
| `Ctrl+1/2/3` | 見出し H1/H2/H3 |
| `Ctrl+Z` | 元に戻す |
| `Ctrl+Shift+Z` | やり直し |

### ナビゲーション

| ショートカット | 機能 |
|---------------|------|
| `←` / `→` | 前/次のページ |
| `Home` / `End` | 最初/最後のページ |

## 開発者向け

### 必要環境

- Node.js v24.12.0
- npm

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

### ビルド

```bash
# ポータブル版をビルド
npm run dist
```

出力先: `release/DocFlow-0.1.0-portable.exe`

### テスト

```bash
# テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage
```

## 技術スタック

- **Electron** - デスクトップアプリケーションフレームワーク
- **React** - UI ライブラリ
- **TypeScript** - 型安全な開発
- **CodeMirror** - Markdown エディタ
- **react-pdf** - PDF 表示
- **Mistral OCR API** - OCR 処理
- **Vitest** - テストフレームワーク

## ライセンス

MIT License
