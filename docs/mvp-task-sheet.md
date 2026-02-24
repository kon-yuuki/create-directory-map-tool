# MVPタスクシート

## 0. 使い方

- 本シートは `docs/prd.md` の「14. MVP受け入れ条件」を満たすための実行タスク一覧。
- `Status` は `TODO / DOING / BLOCKED / DONE` で管理する。
- 各タスク完了時に「成果物」と「確認方法」を必ず記録する。

## 1. マイルストーン

| ID | マイルストーン | 完了条件 | Status |
| --- | --- | --- | --- |
| M1 | 基盤セットアップ完了 | clasp + スタンドアロンGAS + Git運用開始 | BLOCKED |
| M2 | URL収集基盤完了 | robots + sitemap 再帰処理でURL収集可能 | DOING |
| M3 | 出力・ルール・ログ完了 | Pages/Rules/Logs が仕様どおり動作 | DOING |
| M4 | Webアプリ実行完了 | UIから実行して結果を返却可能 | DOING |
| M5 | 受け入れ試験完了 | 受け入れ条件10項目すべてPASS | TODO |

## 2. 実装タスク（MVP）

| ID | タスク | 詳細 | 成果物 | 確認方法 | Status |
| --- | --- | --- | --- | --- | --- |
| T01 | プロジェクト初期化 | スタンドアロンGAS作成、`clasp` 紐付け、`src` 構成作成 | `.clasp.json`, `src/` | `clasp pull/push` が通る | BLOCKED |
| T02 | `appsscript.json` 設定 | 必要スコープ、V8、Webアプリ前提設定 | `src/appsscript.json` | Apps Script側で認可要求が想定どおり | DONE |
| T03 | エントリーポイント実装 | `doGet(e)`, `runFromWeb(formData)` を実装 | `Code.gs`, `web/WebApp.gs` | UI表示と実行呼び出しが可能 | DONE |
| T04 | Config読込実装 | Configシートのキー読込・型変換・既定値適用 | `services/ConfigService.gs` 等 | 不足値時のデフォルト適用を確認 | DONE |
| T05 | robots取得実装 | `robots.txt` 取得、`Sitemap:` 複数抽出 | `services/RobotsService.gs` | 複数Sitemap抽出テストPASS | DONE |
| T06 | Sitemap解析実装 | `urlset` / `sitemapindex` 解析、再帰展開、重複排除 | `services/SitemapService.gs` | index再帰でURL収集できる | DONE |
| T07 | URL正規化実装 | hash/query除外、http→https、重複除去 | `libs/UrlUtil.gs` | サンプルURLの期待値一致 | DONE |
| T08 | ルール適用実装 | `Rules` シート読込、除外→分類→デフォルト適用 | `services/RuleService.gs` | 優先順どおり適用される | DONE |
| T09 | ページ情報取得実装 | ステータス・タイトル取得（ON/OFF対応） | `services/PageFetchService.gs` | ON/OFFで出力差分を確認 | DONE |
| T10 | Pages出力実装 | 標準列A〜Oへ一括書込、既存行クリア対応 | `services/SheetService.gs` | 列定義どおり出力される | DONE |
| T11 | Logs出力実装 | 実行結果、件数、メッセージ記録 | `services/LogService.gs` | 実行ごとに1行追加される | DONE |
| T12 | ロック制御実装 | `LockService` で同時実行を抑止 | 実行制御ロジック | 同時実行時に排他動作を確認 | DONE |
| T13 | エラー処理実装 | FATAL/PARTIAL判定、UI返却整形 | 例外ハンドリング一式 | エラー時にUIへ要約返却 | DONE |
| T14 | Web UI実装 | 入力フォーム、実行ボタン、結果表示、エラー表示 | `ui/Index.html` 他 | UIから実行〜結果表示まで完了 | DONE |
| T15 | README整備 | セットアップ、実行、デプロイ、権限を記載 | `README.md` | 新規メンバーが手順どおり実行可能 | DONE |

## 3. 受け入れ条件トレーサビリティ

| AC | 受け入れ条件（PRD第14章） | 対応タスク | 判定 | Status |
| --- | --- | --- | --- | --- |
| AC01 | スタンドアロンGASとしてプロジェクトが作成されている | T01 | 実体確認 | BLOCKED |
| AC02 | claspでローカルからPush/Pullできる | T01 | `clasp push/pull` 成功 | BLOCKED |
| AC03 | Webアプリ画面から実行できる | T03, T14 | UI実行成功 | DOING |
| AC04 | robots.txtからSitemapを検出しURL収集できる | T05, T06 | テストPASS | DOING |
| AC05 | sitemap_index.xmlを再帰処理できる | T06 | テストPASS | DOING |
| AC06 | Pagesシートに標準列で出力できる | T10 | A〜O列確認 | DOING |
| AC07 | Rulesシートの除外ルールが適用される | T08 | テストPASS | DOING |
| AC08 | Logsシートに実行結果が記録される | T11 | 行追加確認 | DOING |
| AC09 | 競合実行時にロックで保護される | T12 | 同時実行テストPASS | DOING |
| AC10 | エラー時にUIへ結果が返る | T13, T14 | エラー表示確認 | DOING |

## 4. テストタスク（最低）

| ID | テスト観点 | 事前条件 | 期待結果 | Status |
| --- | --- | --- | --- | --- |
| TS01 | 複数Sitemap抽出 | `robots.txt` に複数 `Sitemap:` | 全件抽出される | TODO |
| TS02 | 再帰Sitemap展開 | `sitemapindex` 配下に複数子sitemap | URL収集が完了する | TODO |
| TS03 | 除外ルール | `Rules` に `exclude_*` 設定 | 対象URLが除外される | TODO |
| TS04 | タイトル/ステータスON/OFF | Config切替 | 出力列が設定どおり | TODO |
| TS05 | 既存行クリア | 出力先に既存データあり | ON時削除、OFF時追記 | TODO |
| TS06 | 異常系UI表示 | URL取得失敗を意図的に発生 | 要約エラーがUI表示される | TODO |
| TS07 | 同時実行制御 | 2実行を同時開始 | 片方がロックメッセージ | TODO |

## 5. 運用メモ（実行時）

- 大量URL案件は `fetch_title=FALSE` で先に棚卸しを完了させる。
- クォータ超過時は対象URL数を分割して再実行する。
- 本番運用前にデプロイIDとGitタグの対応を記録する。
