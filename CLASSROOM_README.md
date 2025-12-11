# Classroom MVP - 使用說明

## 功能概述

Classroom MVP 是一個完整的教室學習管理系統，讓教師能夠建立課堂、學生加入學習、系統自動記錄學習數據並支援教師查看成績。

## 主要功能

### 教師功能
1. **建立課堂** (`classroom-create.html`)
   - 上傳單字檔案（.txt 格式，每行一個單字）
   - 系統自動生成 4 位唯一課堂代碼
   - 查看課堂代碼並分享給學生

2. **教師控制台** (`classroom-teacher.html`)
   - 即時查看學生列表
   - 查看排行榜（依學習時間排序）
   - 查看統計資訊（平均學習時間、最高學習時間、活躍學生數）
   - 點擊學生查看詳細資料

3. **學生詳情** (`student-detail.html`)
   - 查看學生基本資訊
   - 查看單字正確率統計
   - 查看學習記錄歷史

### 學生功能
1. **加入課堂** (`classroom-join.html`)
   - 輸入教師提供的 4 位課堂代碼
   - 輸入學生姓名
   - 自動驗證代碼並加入課堂

2. **學習介面** (`classroom-student.html`)
   - 開始/結束學習（自動計時）
   - 單字練習（知道/不知道）
   - 查看個人排名
   - 查看排行榜 Top 5

## 資料結構

### Firestore Collections

#### classrooms
```javascript
{
  classroomId: "auto_id",
  code: "AB12",                    // 4 位課堂代碼
  name: "高一英文A班",
  teacherId: "firebase_auth_uid",
  words: ["apple", "banana", ...], // 單字列表
  wordCount: 50,
  createdAt: Timestamp,
  archived: false
}
```

#### students
```javascript
{
  studentId: "auto_id",
  classroomId: "classroom_id",
  studentName: "小明",
  totalTime: 1200,                 // 總學習時間（秒）
  totalSessions: 5,                // 學習次數
  lastActive: Timestamp,
  words: ["apple", "banana", ...],
  wordStats: {
    "apple": { correct: 5, wrong: 1 },
    "banana": { correct: 3, wrong: 2 }
  },
  joinedAt: Timestamp
}
```

#### learning_sessions
```javascript
{
  sessionId: "auto_id",
  classroomId: "classroom_id",
  studentId: "student_id",
  studentName: "小明",
  startTime: Timestamp,
  endTime: Timestamp,
  duration: 600,                   // 學習時長（秒）
  practiceCount: 10,               // 練習次數
  correctCount: 8,                 // 正確次數
  accuracy: 0.8                    // 正確率
}
```

## 使用流程

### 教師流程
1. 登入系統
2. 前往「建立課堂」頁面
3. 輸入課堂名稱
4. 上傳單字檔案（.txt 格式，範例：/tmp/sample-words.txt）
5. 取得課堂代碼（例如：AB12）
6. 分享代碼給學生
7. 前往教師控制台查看學生學習狀況

### 學生流程
1. 前往「加入課堂」頁面
2. 輸入教師提供的課堂代碼
3. 輸入自己的姓名
4. 成功加入後進入學習介面
5. 點擊「開始學習」開始計時
6. 練習單字（選擇「知道」或「不知道」）
7. 點擊「結束學習」儲存記錄
8. 查看自己的排名和總學習時間

## 單字檔案格式

單字檔案必須是 `.txt` 格式，每行一個單字，範例：

```
apple
banana
carrot
dog
elephant
```

檔案大小限制：1MB

## 技術架構

### 前端
- Firebase Authentication（使用者登入）
- Firebase Firestore（資料儲存）
- Vanilla JavaScript（ES6 Modules）
- 響應式 CSS（支援手機、平板、桌面）

### 後端
- Node.js + Express
- Multer（檔案上傳）
- dotenv（環境變數管理）

### 即時更新
- Firestore onSnapshot（即時監聽資料變化）
- 教師控制台會即時更新學生列表和排行榜

## API 路由

### POST /api/classroom/create
建立課堂（解析上傳的單字檔案）

**Request:**
- Form Data:
  - `classroomName`: 課堂名稱
  - `file`: 單字檔案（.txt）

**Response:**
```json
{
  "success": true,
  "classroomName": "高一英文A班",
  "words": ["apple", "banana", ...],
  "wordCount": 50
}
```

## 安全性

### Firestore Security Rules
- 課堂：僅教師可建立和修改自己的課堂
- 學生：需登入才能讀取和建立
- 學習記錄：需登入才能建立

### 檔案上傳限制
- 檔案大小：最大 1MB
- 檔案類型：僅允許 `.txt`
- 上傳後自動刪除暫存檔案

## 檔案結構

```
firebase-dev/
├── public/
│   ├── css/
│   │   └── classroom.css          # 共用樣式
│   ├── js/
│   │   └── classroom-utils.js     # 共用工具函數
│   └── uploads/                   # 暫存上傳檔案（已加入 .gitignore）
├── firebase-classroom.js          # Firestore 課堂操作模組
├── classroom-create.html          # 建立課堂頁面
├── classroom-teacher.html         # 教師控制台
├── classroom-join.html            # 加入課堂頁面
├── classroom-student.html         # 學生學習介面
├── student-detail.html            # 學生詳情頁面
├── server.js                      # Express 伺服器
├── firestore.rules                # Firestore 安全規則
└── package.json                   # 專案設定
```

## 開發與測試

### 安裝依賴
```bash
npm install
```

### 啟動開發伺服器
```bash
npm start
```

伺服器將在 `http://localhost:8080` 啟動

### 環境變數設定
建立 `.env` 檔案並設定以下環境變數：
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_APP_ID=your_app_id
```

### 部署 Firestore Rules
```bash
firebase deploy --only firestore:rules
```

## 注意事項

1. **檔案上傳**：單字檔案會暫存在 `public/uploads/` 目錄，處理完後自動刪除
2. **即時更新**：教師控制台使用 Firestore onSnapshot，會即時反映學生學習狀況
3. **響應式設計**：所有頁面支援手機、平板、桌面三種螢幕尺寸
4. **錯誤處理**：所有 API 和 Firestore 操作都有完整的錯誤處理和使用者提示

## 未來改進方向

1. 匯出學生成績報表（CSV/Excel）
2. 支援更多檔案格式（CSV、Excel）
3. 單字發音功能（Text-to-Speech）
4. 學習提醒通知
5. 課堂統計圖表（Chart.js）
6. 多課堂管理介面
7. 學生學習進度追蹤
8. 自訂練習模式（如：拼字測驗、選擇題）

## 授權

MIT License
