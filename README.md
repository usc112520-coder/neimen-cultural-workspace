# 內門文化地圖｜公開共編工作區

[進入工作區](https://usc112520-coder.github.io/neimen-cultural-workspace/)

知道連結即可閱讀、編輯進度報告，支援自訂成員與進度狀態、雲端自動儲存及多層素材資料夾瀏覽。

控制台使用密碼進入；評語、分類與指南設定的儲存由後端驗證控制台階段。正式密碼與 Drive 識別碼未放入此公開範本。

Google Apps Script 以擁有者身分執行，網頁存取設定為所有人（包含匿名）。Google Drive 原始檔案分享權限維持原設定；進入 Drive 上傳或開啟原檔仍依照其權限。

- `index.html`：公開入口。
- `Index.html`、`Code.gs`：已移除私人設定的 Apps Script 範本。
- `appsscript.json`：部署設定參考。

公開範本的 `CONFIGURE` 佔位符需先填入私人設定。控制台後端使用 SHA-256 雜湊及短期驗證階段；前端含既有密碼驗證。共編資料採版本檢查以避免覆蓋其他人的更新。
