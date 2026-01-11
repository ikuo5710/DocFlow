# Tasklist - ファイル入力機能

作成日: 2026-01-08

## 🚨 タスク完全完了の原則

**このファイルの全タスクが完了するまで作業を継続すること**

### 必須ルール
- **全てのタスクを`[x]`にすること**
- 「時間の都合により別タスクとして実施予定」は禁止
- 「実装が複雑すぎるため後回し」は禁止
- 未完了タスク(`[ ]`)を残したまま作業を終了しない

### 実装可能なタスクのみを計画
- 計画段階で「実装可能なタスク」のみをリストアップ
- 「将来やるかもしれないタスク」は含めない
- 「検討中のタスク」は含めない

### タスクスキップが許可される唯一のケース
以下の技術的理由に該当する場合のみスキップ可能:
- 実装方針の変更により、機能自体が不要になった
- アーキテクチャ変更により、別の実装方法に置き換わった
- 依存関係の変更により、タスクが実行不可能になった

スキップ時は必ず理由を明記:
```markdown
- [x] ~~タスク名~~(実装方針変更により不要: 具体的な技術的理由)
```

### タスクが大きすぎる場合
- タスクを小さなサブタスクに分割
- 分割したサブタスクをこのファイルに追加
- サブタスクを1つずつ完了させる

---

## フェーズ1: プロジェクトセットアップ

- [x] package.jsonを作成
  - [x] プロジェクトメタデータを設定
  - [x] 依存関係を定義(electron, react, typescript等)
  - [x] scriptsを定義(dev, build, test, lint等)

- [x] TypeScript設定を作成
  - [x] tsconfig.jsonを作成
  - [x] ES2022 target、strictモード、bundlerモジュール解決を設定

- [x] ESLint設定を作成
  - [x] eslint.config.jsを作成
  - [x] TypeScript + Prettier連携を設定

- [x] Prettier設定を作成
  - [x] .prettierrcを作成
  - [x] 80文字幅、セミコロンあり、シングルクォート、2スペースタブを設定

- [x] Vitest設定を作成
  - [x] vitest.config.tsを作成
  - [x] 80%カバレッジしきい値を設定

- [x] Electronビルド設定を作成
  - [x] electron-builderまたはelectron-forgeの設定
  - [x] main.tsとpreload.tsのエントリーポイント設定

## フェーズ2: 基本的なElectronアプリケーション

- [x] Main Processの基本実装
  - [x] src/main/main.tsを作成
  - [x] BrowserWindowを作成
  - [x] アプリケーションライフサイクル管理(ready, window-all-closedイベント)

- [x] Preload Scriptの実装
  - [x] src/main/preload.tsを作成
  - [x] contextBridgeでelectron APIを公開

- [x] Renderer Processの基本実装
  - [x] src/renderer/App.tsxを作成
  - [x] Reactのエントリーポイント(index.tsx)を作成
  - [x] index.htmlを作成

- [x] IPC通信の基本実装
  - [x] src/main/ipc/index.tsを作成
  - [x] ipcMain.handleで基本的なハンドラーを登録

## フェーズ3: 型定義

- [x] 共有型定義を作成
  - [x] src/types/file.tsを作成
  - [x] FileInfo, FileType, FileInputError型を定義

## フェーズ4: ファイルハンドラー(Main Process)

- [x] FileHandlerクラスの実装
  - [x] src/main/handlers/FileHandler.tsを作成
  - [x] validateFile()メソッドを実装(拡張子チェック、MIMEタイプチェック)
  - [x] readFile()メソッドを実装(fs.readFileでファイル読み込み)
  - [x] extractPDFMetadata()メソッドを実装(pdf-parseでメタデータ抽出)

- [x] FileHandlerのエラーハンドリング
  - [x] FileInputErrorクラスを実装
  - [x] サポート外形式のエラーハンドリング
  - [x] ファイル破損のエラーハンドリング
  - [x] ファイル読み込み失敗のエラーハンドリング

- [x] IPCハンドラーの実装
  - [x] src/main/ipc/fileHandlers.tsを作成
  - [x] 'file:validate'ハンドラーを実装
  - [x] 'file:read'ハンドラーを実装
  - [x] 'file:metadata'ハンドラーを実装

## フェーズ5: ファイル入力サービス(Renderer Process)

- [x] FileInputServiceの実装
  - [x] src/renderer/services/FileInputService.tsを作成
  - [x] validateFile()メソッド(IPCでMain Processに委譲)
  - [x] readFile()メソッド(IPCでMain Processに委譲)
  - [x] handleFileSelect()メソッド(ファイル選択ダイアログの処理)
  - [x] handleFileDrop()メソッド(ドラッグ&ドロップの処理)

## フェーズ6: ファイル入力UI(Renderer Process)

- [x] FileInputComponentの基本実装
  - [x] src/renderer/components/FileInputComponent.tsxを作成
  - [x] Reactコンポーネントの骨格を作成

- [x] ドラッグ&ドロップエリアの実装
  - [x] onDragOverハンドラーを実装(preventDefault()でデフォルト動作を抑制)
  - [x] onDropハンドラーを実装(ファイルを取得してFileInputServiceに渡す)
  - [x] ドラッグ中の視覚的フィードバック(ハイライト表示)

- [x] ファイル選択ボタンの実装
  - [x] `<input type="file">`要素を作成
  - [x] accept属性で.pdf,.png,.jpg,.jpegを指定
  - [x] multiple属性を設定(複数ファイル選択対応)
  - [x] onChangeハンドラーでFileInputServiceに渡す

## フェーズ7: ファイルプレビュー

- [x] 画像プレビューの実装
  - [x] 画像ファイルの場合、`<img>`タグで表示
  - [x] 表示倍率を調整(ウィンドウに収まるように)

- [x] PDFプレビューの実装
  - [x] react-pdfを使用
  - [x] 最初のページをプレビュー表示
  - [x] 表示倍率を調整(ウィンドウに収まるように)

## フェーズ8: エラーハンドリングUI

- [x] エラーメッセージの表示
  - [x] エラー状態のReact stateを管理
  - [x] サポート外形式エラーの表示
  - [x] ファイル破損エラーの表示
  - [x] ファイル読み込み失敗エラーの表示

## フェーズ9: テスト実装

- [x] FileHandlerのユニットテスト
  - [x] src/main/handlers/FileHandler.test.tsを作成
  - [x] validateFile()のテスト(正常系、異常系)
  - [x] readFile()のテスト(正常系、異常系)
  - [x] extractPDFMetadata()のテスト(正常系、異常系)

- [x] FileInputServiceのユニットテスト
  - [x] src/renderer/services/FileInputService.test.tsを作成
  - [x] handleFileSelect()のテスト
  - [x] handleFileDrop()のテスト

- [x] FileInputComponentのユニットテスト
  - [x] src/renderer/components/FileInputComponent.test.tsxを作成
  - [x] ドラッグ&ドロップ機能のテスト
  - [x] ファイル選択ダイアログ機能のテスト
  - [x] プレビュー表示のテスト

## フェーズ10: 品質チェックと修正

- [x] すべてのテストが通ることを確認
  - [x] `npm test`を実行
  - [x] カバレッジ80%以上を確認

- [x] リントエラーがないことを確認
  - [x] `npm run lint`を実行
  - [x] エラーがあれば修正

- [x] 型エラーがないことを確認
  - [x] `npm run typecheck`を実行(tsc --noEmit)
  - [x] エラーがあれば修正

- [x] ビルドが成功することを確認
  - [x] `npm run build`を実行
  - [x] エラーがあれば修正

## フェーズ11: ドキュメント更新

- [x] 実装後の振り返り(このファイルの下部に記録)

---

## 実装後の振り返り

### 実装完了日
2026-01-08

### 計画と実績の差分

**計画と異なった点**:
- tasklist.mdでは一部のタスクが完了とマークされていたが、実際のファイル(FileInputComponent.tsx)が存在しなかった
- ESLintの設定がフラット設定(eslint.config.js)に変更されていたため、package.jsonのlintスクリプトを更新した
- typescript-eslintパッケージを追加し、ESLint 9にアップグレードした
- tsconfig.jsonにJSXとDOMの設定が不足していたため追加した

**新たに必要になったタスク**:
- package.jsonに`"type": "module"`を追加
- File型にElectron固有のpathプロパティを追加する型拡張

**技術的理由でスキップしたタスク**(該当する場合のみ):
- なし（すべてのタスクを完了）

**⚠️ 注意**: 「時間の都合」「難しい」などの理由でスキップしたタスクはここに記載しないこと。全タスク完了が原則。

### 学んだこと

**技術的な学び**:
- react-pdfを使用したPDFプレビューの実装方法
- ESLint 9のフラット設定とtypescript-eslintの連携
- Electronアプリケーションでの型定義の拡張（File.pathの追加）
- vitestのjsdom環境でのReactコンポーネントテスト

**プロセス上の改善点**:
- tasklist.mdの状態と実際のファイル状態の整合性を確認する必要がある
- 中断した作業を再開する際は、必ず現在のファイル状態を確認する

### 次回への改善提案
- バンドルサイズの最適化（現在533KB、コード分割を検討）
- react-pdfのworkerをローカルにバンドルすることを検討
