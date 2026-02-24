# create-directory-map-tool

Google Apps Script で既存サイトの URL 棚卸しを行い、Google Sheets に出力する MVP 実装です。

## セットアップ

1. `npm install`（必要なら）
2. `clasp login`
3. `.clasp.json` に Script ID を設定
4. `clasp push`

## 実行

- Web アプリで `Spreadsheet URL/ID` を入力して実行
- `Config` / `Rules` / `Pages` / `Logs` シートを利用

## デプロイ

- `clasp deploy --description "mvp-<version>"`

## 必要スコープ

- Spreadsheet
- UrlFetch
- User email（ログ用途）

## 参考

- 仕様: `docs/prd.md`
- タスク: `docs/mvp-task-sheet.md`
- 手動作業: `docs/mvp-manual-task-sheet.md`
# create-directory-map-tool
