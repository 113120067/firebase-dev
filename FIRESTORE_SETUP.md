# Firestore 啟用與測試說明

以下步驟說明如何在 Firebase Console 啟用 Cloud Firestore、套用建議的安全規則，並在本地啟動專案測試筆記功能。

1) 在 Firebase Console 啟用 Firestore
- 前往 https://console.firebase.google.com/ 並選取你的專案
- 左側選單選擇 Firestore Database → 建立資料庫
- 建議先以測試模式啟動（方便開發），但完成後請改回鎖定模式並套用下列 security rules

2) 套用 Firestore 規則
- 在 Firestore 的 Rules 分頁，貼上或上傳專案根目錄中的 firestore.rules 內容，然後發布（Publish）。

3) 在本地環境執行專案（假設你已按照 README 設定 .env）
- npm install
- npm start
- 開啟瀏覽器到 http://localhost:8080/login.html 並使用 Google 登入（或你已有的 auth 流程）
- 登入後前往 http://localhost:8080/notes.html
- 新增一筆筆記（填標題或內容），按下「新增」

4) 驗證 Firestore 是否成功
- 在 Firebase Console → Firestore → Data，檢查是否出現 collection 名為 `notes` 並且該文件的 owner 欄位為你的 Firebase UID
- 或在瀏覽器 DevTools Console 中觀察是否有錯誤訊息，並確認 notes.html 能即時列出新增的筆記

5) 其他注意事項
- 請確保前端 /config 回傳的 firebaseConfig 是指向相同 Firebase 專案（authDomain 與 projectId 正確）
- 不要把敏感金鑰直接放在前端程式碼或版本控制，server 端應透過環境變數管理

如果你要，我可以接著：
- 幫你把本地 JSON 資料遷移到 Firestore 的 script（提供指令與程式碼），或
- 提供一個 PR 的 patch（需要你授權我寫入 repo）以自動加入這些檔案