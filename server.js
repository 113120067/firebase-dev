// server.js (Admin SDK temporarily removed)
// - 現在只回傳 /config 並提供靜態檔案
// - 若未來要啟用 Admin SDK，請參考之前版本並把 service account 初始化邏輯放回來
//
// 環境變數（至少）:
//   FIREBASE_API_KEY
//   FIREBASE_AUTH_DOMAIN
//   FIREBASE_PROJECT_ID
//   FIREBASE_APP_ID
//   FIREBASE_MEASUREMENT_ID (optional)
//
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

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

// NOTE:
// Admin SDK and related routes have been temporarily removed.
// If you need server-side token verification later, re-add firebase-admin initialization
// (using FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH) and the protected routes.

// Serve static files from repo root
app.use(express.static(path.join(__dirname, '/')));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});