```markdown
# Firebase Authentication 範例（Node server, Admin SDK 暫時移除）

目前此專案提供：
- 前端靜態頁面 (index.html, login.html)
- server.js：提供 /config（由環境變數回傳 client-side Firebase config）與靜態檔案服務

注意
- Firebase Admin SDK（在 server 端使用 service account 進行 token 驗證）已被暫時移除。如果你需要後端驗證 ID token 或其他 Admin 功能，請恢復之前版本的 server.js，並在環境變數中設定 FIREBASE_SERVICE_ACCOUNT（或 FIREBASE_SERVICE_ACCOUNT_PATH）。
- 當前仍需在部署環境（或本地 .env）設定下列環境變數以供前端初始化：
  - FIREBASE_API_KEY
  - FIREBASE_AUTH_DOMAIN
  - FIREBASE_PROJECT_ID
  - FIREBASE_APP_ID
  - (可選) FIREBASE_MEASUREMENT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID

快速測試（本地）
1. 複製 .env.example 為 .env，填入 Firebase Web app config（不要把敏感資料提交到 repo）
2. npm install
3. npm start
4. 開啟 http://localhost:8080/login.html 測試前端登入流程（Google、Email/Password 需在 Firebase Console 啟用）

如果要重新啟用 Admin SDK（步驟概要）
1. 取得 service account key JSON（從 Firebase Console → Service accounts）
2. 以 base64 編碼後設為 FIREBASE_SERVICE_ACCOUNT 環境變數（或上傳 JSON 檔並設 FIREBASE_SERVICE_ACCOUNT_PATH）
3. 恢復 server 端 firebase-admin 初始化與驗證路由，或使用之前版本的 server.js
4. 重新部署 / 重啟伺服器
```