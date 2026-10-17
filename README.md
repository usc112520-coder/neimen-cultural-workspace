# 內門文化地圖｜團隊協作工作區

[網站入口](https://usc112520-coder.github.io/neimen-cultural-workspace/)

GitHub Pages 提供正式系統入口；完整工作台在 Google Apps Script 執行。

## 功能

- 團隊進度報告、看板、評語與控制台。
- 逐層瀏覽 Drive 工作區，指定任一層的素材檔案或資料夾。
- 點選分類入口，到 Google Drive 自行上傳；系統內已取消上傳區與上傳 API。
- 控制台可修改素材庫、參考網址、關鍵字與 SOP 文字，設定獨立儲存到雲端。
- 素材索引手動載入／儲存，含版本衝突檢查與 JSON 備份。

## 檔案

- index.html：公開網站入口。
- Index.html、Code.gs：Apps Script 介面與後端範本。
- appsscript.json：Apps Script 設定參考。

公開範本中的 Drive 識別碼及密碼設定已替換為 CONFIGURE 佔位符。正式部署使用原有私人設定。
Apps Script 以存取者自己的 Google 帳戶執行；使用者必須具有工作資料夾權限。控制台密碼為前端介面鎖，雲端資料權限由 Google Drive 控制。

指南文字以純文字儲存與顯示，http/https 網址自動成為連結。文字設定使用獨立版本，避免覆蓋素材索引。
