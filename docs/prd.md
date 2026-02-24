# 既存サイト ディレクトリマップ自動生成ツール 仕様書（MVP〜拡張想定）

## 1. 目的

既存Webサイトのページ棚卸し（URL一覧・タイトル・ステータス等）を、指定のGoogleスプレッドシート形式で自動出力する共通ツールを構築する。  
複数案件で使い回せるよう、スタンドアロンGAS + Webアプリ + テンプレシート構成とし、開発は clasp + Git で管理する。

補足:
- Apps Script はスタンドアロンプロジェクトとして作成でき、Webアプリとして公開可能。
- clasp によりローカル開発と Git 運用が可能。

## 2. スコープ

### 2.1 対象（MVP）

- 入力された対象ドメインから URL 一覧を取得
- `robots.txt` から `Sitemap:` を検出（複数対応）
- `sitemap.xml` / `sitemap_index.xml` を解析して URL 収集
- 収集した URL を正規化・除外フィルタ適用
- 必要に応じて各 URL のページ情報を取得
  - HTTP ステータス
  - `<title>`
- テンプレシートの指定シートに出力

### 2.2 非対象（MVP外）

- JSレンダリング必須の完全クロール（SPAのDOMレンダリング後解析）
- 認証が必要な会員ページの巡回
- 画像・PDF等の中身解析
- 高度なSEO監査（canonical、h1、meta等の網羅取得）
- 差分比較（前回実行との差分レポート）

## 3. 採用アーキテクチャ

### 3.1 構成概要

#### A. スタンドアロンGAS（共通ロジック）

- ドメイン・設定を受けて処理実行
- Sitemap取得、XML解析、URL整形、ページ情報取得、Sheets出力
- Webアプリのサーバー側処理を担当

補足:
- スタンドアロンGASは特定のSheetに紐づかない独立プロジェクトとして作成できる。

#### B. WebアプリUI（GAS HTML Service）

- 実行画面（案件ごとの入力フォーム）
- 実行結果表示（成功件数 / エラー件数 / ログ）
- 任意で「テンプレシートURL」「対象ドメイン」等を入力

補足:
- Apps Script のWebアプリは `doGet(e)` / `doPost(e)` と HTML Service で提供できる。

#### C. テンプレシート（案件ごとに複製）

- `Config` シート（設定）
- `Pages` シート（出力先）
- `Logs` シート（実行ログ）
- `Rules` シート（除外・分類ルール）

#### D. 開発・デプロイ基盤

- ローカル開発: clasp
- バージョン管理: Git
- デプロイ: `clasp push` / `clasp deploy`

補足:
- clasp はローカル開発・Git管理・デプロイ運用を可能にする公式CLI。

## 4. 想定ユーザー

- Webディレクター（主利用者）
- フロントエンドエンジニア（保守・拡張）
- SEO担当（任意）

## 5. 業務フロー（利用フロー）

1. 案件ごとにテンプレシートを複製
2. `Config` シートに対象ドメイン・除外条件などを記入
3. Webアプリを開く
4. 対象スプレッドシートURL（またはID）を入力して実行
5. ツールが以下を実行
   - `robots.txt` 取得
   - `Sitemap:` 抽出
   - sitemap XML解析
   - URL一覧整形
   - ステータス/タイトル取得（設定ON時）
   - `Pages` シートへ出力
6. 実行結果（件数・エラー）をUIと `Logs` へ記録

補足:
- `robots.txt` に Sitemap の場所を記載できることはGoogleのSearchドキュメントでも案内されている。
- Sitemap XML は `urlset` / `sitemapindex` の構造で定義されている。
- プロトコル仕様は `sitemaps.org` を実装基準とする。

## 6. 機能要件

### 6.1 入力機能

#### 6.1.1 Webアプリ入力項目（MVP）

- 対象スプレッドシートURL or ID（必須）
- 実行モード（必須）
  - `sitemap_only`
  - `sitemap_plus_page_fetch`
- 実行オプション（任意）
  - タイトル取得 ON/OFF
  - ステータス取得 ON/OFF
  - 出力前に既存行クリア ON/OFF

#### 6.1.2 Configシート入力項目（MVP）

`Config` シートで案件ごとに保持（Webアプリから上書き可能）。

| 項目 | 型 | 必須 | 例 | 説明 |
| --- | --- | --- | --- | --- |
| `domain` | string | ○ | `https://example.com` | 対象ドメイン |
| `sitemap_mode` | string | ○ | `auto` / `manual` | Sitemap検出モード |
| `manual_sitemap_urls` | string | △ | 改行区切り | 手動指定Sitemap |
| `output_sheet_name` | string | ○ | `Pages` | 出力先シート名 |
| `log_sheet_name` | string | ○ | `Logs` | ログシート名 |
| `rules_sheet_name` | string | ○ | `Rules` | ルールシート名 |
| `fetch_title` | boolean | ○ | `TRUE` | タイトル取得 |
| `fetch_status` | boolean | ○ | `TRUE` | ステータス取得 |
| `include_query_urls` | boolean | ○ | `FALSE` | `?` 付きURLを含める |
| `include_hash_urls` | boolean | ○ | `FALSE` | `#` 付きURLを含める |
| `max_url_count` | number | ○ | `5000` | 処理上限 |
| `user_agent` | string | △ | `Mozilla...` | 任意（UrlFetch用） |

### 6.2 URL収集機能

#### 6.2.1 robots.txt取得

- `domain + /robots.txt` をGET
- `Sitemap:` 行を抽出（複数可）
- `sitemap_mode=manual` の場合は手動指定を優先

補足:
- 外部HTTP取得は `UrlFetchApp` を利用。

#### 6.2.2 Sitemap解析

- 対応形式
  - `urlset`
  - `sitemapindex`
- `sitemapindex` の場合は子sitemapを再帰展開
- `loc` をURLとして抽出
- 重複URLは除外

補足:
- XML解析は `XmlService` を利用。

#### 6.2.3 URL正規化

- 末尾スラッシュ統一（設定に応じて）
- `http` → `https` 正規化（同一ドメイン時）
- 大文字小文字の扱い（原則そのまま保持）
- `#hash` 除去（設定OFF時）
- クエリ付きURL除外（設定OFF時）
- 同一URL重複除外

### 6.3 ページ情報取得機能（任意）

#### 6.3.1 ステータス取得

- GET or HEAD（実装方針で選択）
- レスポンスコード記録（200/301/404等）
- 失敗時はエラー理由記録

#### 6.3.2 タイトル取得

- HTMLレスポンスから `<title>` を抽出
- 未取得時は空欄
- 非HTML（PDF等）はスキップ

### 6.4 出力機能（Google Sheets）

#### 6.4.1 出力先

- 指定スプレッドシートの `output_sheet_name` シート
- シートがなければ作成（MVPでは作成してよい）

#### 6.4.2 出力形式（MVP標準列）

以下を標準列とし、将来的に案件別カスタムを追加可能にする。

| 列 | 項目名 | 説明 |
| --- | --- | --- |
| A | `No` | 連番 |
| B | `URL` | フルURL |
| C | `Path` | パス部分 |
| D | `Depth` | 階層数 |
| E | `Level1` | 第1階層 |
| F | `Level2` | 第2階層 |
| G | `Level3` | 第3階層 |
| H | `LastSegment` | 末尾セグメント |
| I | `Status` | HTTPステータス |
| J | `Title` | ページタイトル |
| K | `PageType` | ルールベース分類（任意） |
| L | `IncludeFlag` | 移行対象フラグ（初期値 TRUE） |
| M | `ExcludeReason` | 除外理由 |
| N | `Notes` | 備考 |
| O | `SourceSitemap` | 取得元sitemap URL |

補足:
- Sheets操作は `SpreadsheetApp` で実装する。`openByUrl()` / `openById()` を前提。

#### 6.4.3 書き込み方式

- 一括書き込み（2次元配列）
- ヘッダー行固定
- 既存行削除オプション対応
- 実行日時を `Logs` に追記

### 6.5 ルール適用機能（MVP）

#### 6.5.1 Rulesシート仕様

`Rules` シートで除外・分類ルールを管理する。

ルール例:
- `exclude_contains : /wp-admin/`
- `exclude_regex : ^https://example\.com/tag/`
- `page_type_by_path_prefix : /news/ => news`
- `page_type_by_exact : /contact/ => contact`

#### 6.5.2 適用順

1. 除外ルール
2. 分類ルール
3. デフォルト値設定

### 6.6 ログ機能

#### 6.6.1 Logsシート出力項目

- 実行日時
- 実行者（取得可能なら）
- 対象ドメイン
- 対象シートID
- 取得Sitemap数
- 抽出URL数
- 出力URL数
- エラー件数
- 実行結果（SUCCESS / PARTIAL / FAILED）
- メッセージ

#### 6.6.2 Webアプリ画面表示

- 成功件数
- スキップ件数
- 主要エラー一覧（先頭20件程度）

## 7. 非機能要件

### 7.1 パフォーマンス

- 目標URL数（MVP）: 〜5,000 URL
- 大量URL時は以下を実施
  - タイトル取得OFFで高速化
  - ステータス取得を分割実行
  - バッチ処理（将来対応）

補足:
- Apps Script には実行時間や各サービスのクォータ制限があるため、URL数が多い場合は分割戦略が必要。

### 7.2 安定性

- 同時実行を避けるため `LockService` を利用
- 競合時は「現在実行中」メッセージを返す

補足:
- `LockService` は同時実行による衝突防止に使える。

### 7.3 設定保持

- 共通設定（既定値）: Script Properties
- ユーザー設定（任意）: User Properties

補足:
- `PropertiesService` はスクリプト/ユーザー単位のキー・バリュー保存に対応。

### 7.4 セキュリティ

- Webアプリは原則「社内利用のみ」想定
- 実行権限は「実行ユーザーとして実行」を基本
- 対象スプレッドシートへのアクセス権を持つユーザーのみ利用可能にする
- 外部URL取得（UrlFetch）に必要なスコープを明示

補足:
- `UrlFetchApp` 利用時は外部リクエスト権限スコープが必要。

## 8. 画面仕様（Webアプリ）

### 8.1 画面一覧

#### 8.1.1 実行画面（単一画面）

- フォーム入力
- 実行ボタン
- 実行結果エリア
- 直近ログ表示（任意）

### 8.2 入力UI項目

- スプレッドシートURL
- 実行モード（select）
- タイトル取得（checkbox）
- ステータス取得（checkbox）
- 出力前クリア（checkbox）
- 実行ボタン

### 8.3 実行結果UI

- 成功/失敗ステータス
- 件数サマリ
- エラー詳細（折りたたみ）
- `Pages` シートへのリンク（任意）

## 9. データ仕様（テンプレシート）

### 9.1 シート構成

- `Config`
- `Rules`
- `Pages`
- `Logs`

### 9.2 Config シート（例）

| Key | Value | Note |
| --- | --- | --- |
| `domain` | `https://example.com` | 対象ドメイン |
| `sitemap_mode` | `auto` | `auto/manual` |
| `manual_sitemap_urls` |  | 改行区切り |
| `output_sheet_name` | `Pages` |  |
| `log_sheet_name` | `Logs` |  |
| `rules_sheet_name` | `Rules` |  |
| `fetch_title` | `TRUE` |  |
| `fetch_status` | `TRUE` |  |
| `include_query_urls` | `FALSE` |  |
| `include_hash_urls` | `FALSE` |  |
| `max_url_count` | `5000` |  |

### 9.3 Rules シート（例）

| RuleType | Pattern | Value | Enabled | Priority |
| --- | --- | --- | --- | --- |
| `exclude_contains` | `/wp-admin/` |  | `TRUE` | `10` |
| `exclude_regex` | `/tag/` |  | `TRUE` | `20` |
| `page_type_prefix` | `/news/` | `news` | `TRUE` | `30` |
| `page_type_exact` | `/contact/` | `contact` | `TRUE` | `40` |

## 10. 実装構成（clasp / Git前提）

### 10.1 ディレクトリ構成（案）

```text
site-map-automation/
├─ src/
│  ├─ appsscript.json
│  ├─ Code.gs                # エントリーポイント
│  ├─ web/
│  │  ├─ WebApp.gs           # doGet/doPost
│  │  └─ Router.gs
│  ├─ ui/
│  │  ├─ Index.html          # Web UI
│  │  ├─ styles.html
│  │  └─ scripts.html
│  ├─ services/
│  │  ├─ RobotsService.gs
│  │  ├─ SitemapService.gs
│  │  ├─ PageFetchService.gs
│  │  ├─ SheetService.gs
│  │  ├─ RuleService.gs
│  │  └─ LogService.gs
│  ├─ libs/
│  │  ├─ UrlUtil.gs
│  │  ├─ XmlUtil.gs
│  │  └─ ArrayUtil.gs
│  ├─ config/
│  │  ├─ Constants.gs
│  │  └─ Properties.gs
│  └─ models/
│     ├─ types.gs            # JSDoc型定義
│     └─ DTO.gs
├─ tests/                    # 任意（ローカル補助）
├─ .clasp.json
├─ .claspignore
├─ package.json
├─ README.md
└─ docs/
   └─ spec.md
```

### 10.2 開発方針

- Apps Scriptコードは `src/` で管理
- clasp で Push/Pull
- Gitブランチ運用（`main` / `develop`）
- デプロイはタグまたはバージョン番号で管理

補足:
- clasp はローカル編集・Git利用・デプロイを前提にしたワークフローをサポート。

## 11. 関数設計（MVP）

### 11.1 エントリーポイント

- `doGet(e)`
  - WebアプリUI返却
- `runFromWeb(formData)`
  - UIからの実行要求を受けて処理起動

### 11.2 主処理

`executeSiteMapInventory(input)`

1. ロック取得
2. Config読込
3. URL収集
4. ルール適用
5. ページ情報取得（必要時）
6. Sheets出力
7. Logs出力
8. 結果返却

### 11.3 サービス単位

- `RobotsService.getSitemapUrls(domain)`
- `SitemapService.collectUrls(sitemapUrls)`
- `PageFetchService.fetchPageMeta(urls, options)`
- `RuleService.apply(urlRows, rules)`
- `SheetService.writePages(sheetId, rows, options)`
- `LogService.append(logRow)`

## 12. エラーハンドリング仕様

### 12.1 想定エラー

- `robots.txt` 未取得
- Sitemap URLなし
- XMLパース失敗
- スプレッドシートアクセス不可
- UrlFetch タイムアウト / レスポンス失敗
- クォータ超過
- 実行時間超過（途中終了）

補足:
- Apps Scriptはクォータ超過時に例外を投げて停止する。

### 12.2 エラー時の扱い

- 致命的エラー: 実行停止し `FAILED`
- 部分エラー（個別URL失敗）: 継続して `PARTIAL`
- すべて `Logs` に記録
- WebUIに要約表示

## 13. 権限・スコープ

### 13.1 必要サービス

- Spreadsheet service (`SpreadsheetApp`)
- UrlFetch service (`UrlFetchApp`)
- XML service (`XmlService`)
- Properties service (`PropertiesService`)
- Lock service (`LockService`)
- HTML service (`HtmlService`)

補足:
- 各サービスはApps Script公式リファレンスの対象サービスを使用する。

### 13.2 認可方針

- 初回実行時に必要スコープを許可
- 社内運用前提で権限周りをREADMEに明記

## 14. MVP受け入れ条件（Acceptance Criteria）

以下を満たせばMVP完了とする。

- スタンドアロンGASとしてプロジェクトが作成されている
- clasp でローカルから Push/Pull できる
- Webアプリ画面から実行できる
- `robots.txt` から `Sitemap:` を検出してURLを収集できる
- `sitemap_index.xml` を再帰的に処理できる
- `Pages` シートに標準列で出力できる
- `Rules` シートの除外ルールが適用される
- `Logs` シートに実行結果が記録される
- 競合実行時にロックで保護される
- エラー時にUIへ結果が返る

## 15. 拡張ロードマップ（MVP後）

### Phase 2

- 既存出力との差分比較（増減 / 404化）
- CSV出力
- ページ種別の高度分類（正規表現 / ルール優先度）
- 実行ジョブ分割（大量URL対応）

### Phase 3

- 複数ドメイン一括実行
- 案件テンプレートの管理画面化
- Screaming Frog等のCSV取り込み補完
- Search Console API連携（実績URL突合）

## 16. 開発メモ（実装時の注意）

- Apps Scriptの実行時間・UrlFetch回数には制約があるため、URL数が多い案件は分割実行前提で設計する。
- XMLの名前空間付きSitemap（`xmlns` あり）でも読めるように `XmlService` で要素取得実装を慎重に行う。
- Webアプリは公開設定（誰がアクセスできるか）と実行ユーザー設定を明示する。
- Apps Script Web Apps は公開・認可設定に注意が必要。
- clasp 前提なので、READMEに初期セットアップ（ログイン、プロジェクト紐付け、デプロイ手順）を必ず記載する。

## 17. ランタイム方針

### 17.1 実行環境

- Apps Script の V8 ランタイムを前提とする。
- 言語は JavaScript（`.gs` / HTML Service）で実装する。

### 17.2 コード方針

- 関数はサービス単位（`RobotsService` / `SitemapService` など）で分割する。
- 例外は握りつぶさず、`LogService` に記録したうえで上位へ返却する。
- 定数（シート名・既定値・エラーコード）は `config/Constants.gs` に集約する。

### 17.3 URL・XML処理方針

- URL正規化は必ず `UrlUtil` を経由し、処理の一貫性を担保する。
- Sitemap XML は `xmlns` の有無を吸収できる実装とする。
- `sitemapindex` の再帰展開はループ上限を持たせ、無限参照を防ぐ。

## 18. テスト方針

### 18.1 テストレベル

- 単体テスト（ローカル補助）
  - URL正規化
  - ルール適用
  - XMLパース（`urlset` / `sitemapindex`）
- 結合テスト（Apps Script 実行）
  - `runFromWeb(formData)` から `Pages` / `Logs` 出力までの一連動作

### 18.2 最低確認項目（MVP）

1. `robots.txt` から複数 `Sitemap:` を抽出できる。
2. `sitemapindex` を再帰的に辿って URL を収集できる。
3. `Rules` の除外・分類ルールが優先度どおり適用される。
4. `fetch_title` / `fetch_status` の ON/OFF が出力列に反映される。
5. 既存行クリア ON/OFF が意図どおり動作する。
6. 例外時に `Logs` と WebUI の双方へ結果が反映される。

### 18.3 完了条件

- 受け入れ条件（第14章）を満たすこと。
- 重大バグ（実行停止・誤出力・ログ欠落）が未解決で残っていないこと。

## 19. デプロイ手順（確定版）

### 19.1 初期セットアップ

1. `npm install`
2. `clasp login`
3. `clasp create --type standalone`（未作成時）
4. `.clasp.json` に対象 Script ID を設定

### 19.2 開発反映

1. ローカルで実装
2. `clasp push`
3. Apps Script エディタで必要に応じて動作確認

### 19.3 Webアプリデプロイ

1. Apps Script エディタでデプロイ設定を確認（アクセス権・実行ユーザー）
2. `clasp deploy --description \"mvp-<version>\"`
3. 発行されたデプロイID/URLを README と運用メモに記録

### 19.4 リリース運用ルール

- Git タグ（例: `v1.0.0`）と `clasp deploy` の説明文を対応させる。
- 本番反映前に、最低確認項目（第18章）を実行する。
- ロールバック時は直前の安定デプロイIDへ切り戻す。

## 20. エラーコード一覧（UI表示用）

| Code | 区分 | 条件 | ユーザー向け表示 | 処理方針 |
| --- | --- | --- | --- | --- |
| `E001_ROBOTS_FETCH_FAILED` | FATAL | `robots.txt` の取得失敗 | robots.txt を取得できませんでした | 実行停止（FAILED） |
| `E002_SITEMAP_NOT_FOUND` | FATAL | Sitemap URL を1件も特定できない | Sitemap が見つかりませんでした | 実行停止（FAILED） |
| `E003_SITEMAP_PARSE_FAILED` | FATAL | XMLパース失敗 | Sitemap の解析に失敗しました | 実行停止（FAILED） |
| `E004_SHEET_ACCESS_DENIED` | FATAL | Sheet 参照/書込権限がない | スプレッドシートにアクセスできません | 実行停止（FAILED） |
| `E005_URLFETCH_TIMEOUT` | PARTIAL | 個別URL取得タイムアウト | 一部ページの取得がタイムアウトしました | 継続（PARTIAL） |
| `E006_HTTP_FETCH_FAILED` | PARTIAL | 個別URLでHTTP取得失敗 | 一部ページの取得に失敗しました | 継続（PARTIAL） |
| `E007_QUOTA_EXCEEDED` | FATAL | Apps Script クォータ超過 | 実行上限に達しました（クォータ超過） | 実行停止（FAILED） |
| `E008_EXECUTION_TIMEOUT` | FATAL | Apps Script 実行時間超過 | 実行時間の上限を超えました | 実行停止（FAILED） |
| `E009_LOCKED_BY_OTHER_JOB` | FATAL | Lock取得失敗（同時実行中） | 現在ほかの実行が進行中です | 実行停止（FAILED） |
| `E010_UNKNOWN` | FATAL | 想定外例外 | 想定外エラーが発生しました | 実行停止（FAILED） |

運用ルール:
- `Logs` には `Code` / `Message` / `Stack`（取得可能な場合）を保存する。
- WebUI には `Code` と短い要約メッセージを表示する。
