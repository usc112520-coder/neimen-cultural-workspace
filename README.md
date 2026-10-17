# 內門文化地圖｜團隊協作工作區

團隊進度報告、老師控制台與 Google Drive 素材管理。

## 使用版本

- `index.html`：GitHub Pages 靜態工作台，資料儲存在瀏覽器。
- `Index.html`、`Code.gs`：Apps Script 雲端工作台；以各使用者自己的 Google 權限操作 Drive。
- `appsscript.json`：Apps Script 設定參考。

## 主要功能

- 新增及編輯精簡進度報告、看板與素材篩選。
- 指定工作區內任意深度的資料夾或檔案，顯示完整路徑。
- 檔案依分類批次上傳，建立對應素材索引。
- 雲端索引採手動載入與儲存，具有版本衝突檢查。
- JSON 備份、格式驗證、單步復原。

## 雲端使用

Google Drive 功能必須從 Apps Script 部署網址使用；GitHub Pages 不會提供 `google.script.run`。
使用者需登入 Google 並擁有指定 Drive 工作資料夾的權限。本程式不變更資料夾分享設定。
部署執行身分為「存取網頁應用程式的使用者」。

## 注意事項

控制台密碼僅為前端介面鎖；實際 Drive 存取由 Google 帳戶與分享權限控制。
不包含 OAuth 憑證或明文密碼。不會公開雲端工作區內的檔案內容或現有素材索引。
示範資料僅隨前端提供；首次載入雲端索引可能為空，請先匯出本機備份。

## 驗證

通過 JavaScript 語法與模擬測試：儲存、復原、匯入驗證、連結限制、版本衝突、上傳資料映射、深層路徑及工作區外存取拒絕。

## 正式系統

[開啟正式系統](https://script.google.com/macros/s/AKfycbzK2idrX4BGqpbS13XeP_P9BwtuOxeaFO93gp0EXv6_v2QzsQDZ6wjrk37m69T7pg9S/exec)

公開原始碼中的 Drive 識別碼與密碼驗證設定已替換為 CONFIGURE 佔位符。部署自己的版本前請填入自己的設定。正式部署保留原有設定，不會從公開範本自動讀取設定。
