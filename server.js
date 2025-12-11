// server.js
// Classroom MVP - includes file upload and classroom API routes
// 環境變數（至少）:
//   FIREBASE_API_KEY
//   FIREBASE_AUTH_DOMAIN
//   FIREBASE_PROJECT_ID
//   FIREBASE_APP_ID
//   FIREBASE_MEASUREMENT_ID (optional)
//   FIREBASE_SERVICE_ACCOUNT (optional, for Admin SDK)
//
require('dotenv').config();

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

// 檔案上傳設定（限制 1MB，僅允許 .txt）
const upload = multer({
  dest: 'public/uploads/',
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('僅支援 .txt 檔案'));
    }
  }
});

// Helper: build firebase web config from env
function getFirebaseConfigFromEnv() {
  const apiKey = process.env.FIREBASE_API_KEY || '';
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN || '';
  const projectId = process.env.FIREBASE_PROJECT_ID || '';
  const appId = process.env.FIREBASE_APP_ID || '';
  const measurementId = process.env.FIREBASE_MEASUREMENT_ID || undefined;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || undefined;
  const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID || undefined;

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    ...(measurementId ? { measurementId } : {}),
    ...(storageBucket ? { storageBucket } : {}),
    ...(messagingSenderId ? { messagingSenderId } : {})
  };
}

// /config returns client-side firebase config (from env)
app.get('/config', (req, res) => {
  const cfg = getFirebaseConfigFromEnv();
  if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId) {
    return res.status(500).json({
      error: 'Firebase client config not set on server. Please set FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_APP_ID'
    });
  }
  res.json(cfg);
});

// Classroom API Routes

/**
 * POST /api/classroom/create
 * 建立新課堂
 * Body: { classroomName: string }
 * File: .txt file with words (one per line)
 * Headers: Authorization: Bearer <token>
 */
app.post('/api/classroom/create', upload.single('file'), async (req, res) => {
  try {
    // 驗證檔案
    if (!req.file) {
      return res.status(400).json({ error: '請上傳單字檔案' });
    }

    // 驗證課堂名稱
    const { classroomName } = req.body;
    if (!classroomName || classroomName.trim() === '') {
      // 清理上傳的檔案
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: '請輸入課堂名稱' });
    }

    // 讀取並解析單字檔案
    const fileContent = await fs.readFile(req.file.path, 'utf-8');
    const words = fileContent
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);

    // 清理上傳的檔案
    await fs.unlink(req.file.path);

    if (words.length === 0) {
      return res.status(400).json({ error: '檔案中沒有有效的單字' });
    }

    // 回傳資料供前端建立課堂
    res.json({
      success: true,
      classroomName: classroomName.trim(),
      words,
      wordCount: words.length
    });

  } catch (error) {
    console.error('Error in /api/classroom/create:', error);
    // 嘗試清理檔案
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ error: '建立課堂失敗：' + error.message });
  }
});

/**
 * GET /api/classroom/:classroomId
 * 取得課堂資料（由前端直接使用 firebase-classroom.js）
 * 此路由保留供未來需要時使用
 */

/**
 * POST /api/classroom/join
 * 學生加入課堂（由前端直接使用 firebase-classroom.js）
 * 此路由保留供未來需要時使用
 */

// Serve static files from repo root
app.use(express.static(path.join(__dirname, '/')));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});