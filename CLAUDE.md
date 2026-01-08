# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DocFlow is an Electron desktop application that converts PDFs and images to AI-friendly Markdown format using OCR technology. The project uses a **spec-driven development** methodology with extensive Claude Code integration.

## Technology Stack

- **Desktop**: Electron 39.0.0
- **Runtime**: Node.js v24.12.0
- **Language**: TypeScript 5.x
- **OCR**: mistral-ocr-latest (Mistral API)
- **Testing**: Vitest with 80% coverage thresholds
- **Package Manager**: npm

## Common Development Commands

### Setup
```bash
npm install                    # Install dependencies (package.json not yet created)
```

### Testing
```bash
npm test                       # Run all tests with Vitest
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Run tests with coverage report
```

Test files: `src/**/*.{test,spec}.{ts,tsx}` or `tests/**/*.{test,spec}.{ts,tsx}`

Coverage requirement: 80% for branches, functions, lines, and statements.

### Linting and Formatting
```bash
npm run lint                   # Run ESLint
npm run format                 # Run Prettier
```

Configuration:
- ESLint: `eslint.config.js` (TypeScript + Prettier integration)
- Prettier: `.prettierrc` (80 char width, semicolons, single quotes, 2-space tabs)

### Build
```bash
npm run build                  # Compile TypeScript to dist/
```

TypeScript config: `tsconfig.json` (ES2022 target, strict mode, bundler module resolution)

## Architecture Overview

### Core Concept
DocFlow provides a side-by-side viewer showing the original file (PDF/image) alongside the OCR-extracted Markdown text. Users can edit the Markdown while viewing the original, with AI assistance for error correction and structure optimization.

### Key Features (from docs/ideas/initial-requirements.md)
1. **File Input**: PDF (multi-page) and images (JPEG, PNG)
2. **OCR Processing**: Mistral OCR API for text extraction to Markdown
3. **Parallel Viewer**: Original file on left, editable Markdown on right
4. **Navigation**: Page/file navigation with synchronized display
5. **Editing**: Manual editing + AI-assisted correction (error fixing, Markdown structuring)
6. **Export**: Save as Markdown with association to original file

### Directory Structure

```
DocFlow/
├── .claude/              # Claude Code configuration
│   ├── agents/           # Code review agents (doc-reviewer, implementation-validator)
│   ├── commands/         # Custom commands (/setup-project, /add-feature, /review-docs)
│   └── skills/           # Spec-driven development skills
├── .steering/            # Temporary task management (YYYYMMDD-task-name/)
├── docs/                 # Permanent documentation
│   ├── ideas/            # Initial requirements and brainstorming
│   └── [To be created by /setup-project]:
│       ├── product-requirements.md
│       ├── functional-design.md
│       ├── architecture.md
│       ├── repository-structure.md
│       ├── development-guidelines.md
│       └── glossary.md
├── src/                  # Source code (currently empty, awaiting implementation)
└── config/               # Configuration (e.g., .env for API keys)
```

## Spec-Driven Development Workflow

This project uses a **specification-first approach** with Claude Code skills.

### Basic Flow
1. **Define specs** in permanent docs (`docs/`)
2. **Plan work** in steering files (`.steering/YYYYMMDD-task-name/`)
   - `requirements.md`: What to do
   - `design.md`: How to do it
   - `tasklist.md`: Concrete tasks
3. **Implement** following tasklist, updating progress
4. **Validate** with tests and reviews
5. **Update docs** as needed

### Claude Code Custom Commands
```bash
/setup-project              # Create permanent documentation structure (interactive, 6 docs)
/add-feature [feature]      # Feature implementation workflow with steering
/review-docs [path]         # Detailed documentation review
```

### Important Rules for Claude Code

**Before starting any implementation:**
1. Read CLAUDE.md (this file)
2. Read relevant permanent docs in `docs/`
3. Use Grep to search for similar existing implementations
4. Understand existing patterns before coding

**When creating documentation:**
- Create **one file at a time** and wait for user approval before proceeding
- Use the appropriate Claude Code skill (prd-writing, functional-design, architecture-design, etc.)

**When planning/implementing/validating:**
- Use `Skill('steering')` for task management
  - Mode 1: Create steering files (planning)
  - Mode 2: Implementation with tasklist.md updates
  - Mode 3: Retrospective (validation)

## スペック駆動開発の基本原則 (日本語版)

### 基本フロー

1. **ドキュメント作成**: 永続ドキュメント(`docs/`)で「何を作るか」を定義
2. **作業計画**: ステアリングファイル(`.steering/`)で「今回何をするか」を計画
3. **実装**: tasklist.mdに従って実装し、進捗を随時更新
4. **検証**: テストと動作確認
5. **更新**: 必要に応じてドキュメント更新

### 重要なルール

#### ドキュメント作成時

**1ファイルずつ作成し、必ずユーザーの承認を得てから次に進む**

承認待ちの際は、明確に伝える:
```
「[ドキュメント名]の作成が完了しました。内容を確認してください。
承認いただけたら次のドキュメントに進みます。」
```

#### 実装前の確認

新しい実装を始める前に、必ず以下を確認:

1. CLAUDE.mdを読む
2. 関連する永続ドキュメント(`docs/`)を読む
3. Grepで既存の類似実装を検索
4. 既存パターンを理解してから実装開始

#### ステアリングファイル管理

作業ごとに `.steering/[YYYYMMDD]-[タスク名]/` を作成:

- `requirements.md`: 今回の要求内容
- `design.md`: 実装アプローチ
- `tasklist.md`: 具体的なタスクリスト

命名規則: `20250115-add-user-profile` 形式

#### ステアリングファイルの管理

**作業計画・実装・検証時は`steering`スキルを使用してください。**

- **作業計画時**: `Skill('steering')`でモード1(ステアリングファイル作成)
- **実装時**: `Skill('steering')`でモード2(実装とtasklist.md更新管理)
- **検証時**: `Skill('steering')`でモード3(振り返り)

詳細な手順と更新管理のルールはsteeringスキル内に定義されています。

## ディレクトリ構造

### 永続的ドキュメント(`docs/`)

アプリケーション全体の「何を作るか」「どう作るか」を定義:

#### 下書き・アイデア（`docs/ideas/`）
- 壁打ち・ブレインストーミングの成果物
- 技術調査メモ
- 自由形式（構造化は最小限）
- `/setup-project`実行時に自動的に読み込まれる

#### 正式版ドキュメント
- **product-requirements.md** - プロダクト要求定義書
- **functional-design.md** - 機能設計書
- **architecture.md** - 技術仕様書
- **repository-structure.md** - リポジトリ構造定義書
- **development-guidelines.md** - 開発ガイドライン
- **glossary.md** - ユビキタス言語定義

### 作業単位のドキュメント(`.steering/`)

特定の開発作業における「今回何をするか」を定義:

- `requirements.md`: 今回の作業の要求内容
- `design.md`: 変更内容の設計
- `tasklist.md`: タスクリスト

## 開発プロセス

### 初回セットアップ

1. このテンプレートを使用
2. `/setup-project` で永続的ドキュメント作成(対話的に6つ作成)
3. `/add-feature [機能]` で機能実装

### 日常的な使い方

**基本は普通に会話で依頼してください:**

```bash
# ドキュメントの編集
> PRDに新機能を追加してください
> architecture.mdのパフォーマンス要件を見直して
> glossary.mdに新しいドメイン用語を追加

# 機能追加(定型フローはコマンド)
> /add-feature ユーザープロフィール編集

# 詳細レビュー(詳細なレポートが必要なとき)
> /review-docs docs/product-requirements.md
```

**ポイント**: スペック駆動開発の詳細を意識する必要はありません。Claude Codeが適切なスキルを判断してロードします。

## ドキュメント管理の原則

### 永続的ドキュメント(`docs/`)

- 基本設計を記述
- 頻繁に更新されない
- プロジェクト全体の「北極星」

### 作業単位のドキュメント(`.steering/`)

- 特定の作業に特化
- 作業ごとに新規作成
- 履歴として保持