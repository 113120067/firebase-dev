// server.js - 使用 Firebase Admin SDK 驗證前端 ID token，並提供 /config 給前端初始化 SDK
// 使用 dotenv 在本機載入 .env
//
// 環境變數（見 .env.example）:
//   FIREBASE_API_KEY
//   FIREBASE_AUTH_DOMAIN
//   FIREBASE_PROJECT_ID
//   FIREBASE_APP_ID
//   FIREBASE_MEASUREMENT_ID (optional)
//   FIREBASE_SERVICE_ACCOUNT (base64 encoded JSON) OR FIREBASE_SERVICE_ACCOUNT_PATH (path to JSON file)
//
require('dotenv').config();

const express = require('express');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

// Initialize Firebase Admin using service account JSON from env (base64) or from file path
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Service account provided as base64-encoded JSON (recommended for env-based deploys)
    try {
      const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
      const jsonStr = Buffer.from(b64, 'base64').toString('utf8');
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT (base64 JSON).', err);
      throw err;
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Service account file path (e.g., mounted secret)
    try {
      // Use require to load JSON file
      const svc = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
      return svc;
    } catch (err) {
      console.error('Failed to load service account from FIREBASE_SERVICE_ACCOUNT_PATH.', err);
      throw err;
    }
  }

  return null;
}

const serviceAccount = loadServiceAccount();

if (!serviceAccount) {
  console.warn('No Firebase service account provided. Admin SDK will not be initialized. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH.');
} else {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized.');
}

// Helper: build firebase web config from env
function getFirebaseConfigFromEnv() {
  const apiKey = process.env.FIREBASE_API_KEY || '';
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN || '';
  const projectId = process.env.FIREBASE_PROJECT_ID || '';
  const appId = process.env.FIREBASE_APP_ID || '';
  const measurementId = process.env.FIREBASE_MEASUREMENT_ID || undefined;

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    ...(measurementId ? { measurementId } : {})
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

// POST /verify-token - verify ID token using Admin SDK and return decoded token
// body: { idToken: "<ID_TOKEN>" }
app.post('/verify-token', async (req, res) => {
  const idToken = req.body && req.body.idToken;
  if (!idToken) return res.status(400).json({ error: 'idToken required in body' });
  if (!admin.apps.length) return res.status(500).json({ error: 'Admin SDK not initialized on server' });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return res.json({ ok: true, decoded });
  } catch (err) {
    console.error('verifyIdToken error:', err);
    return res.status(401).json({ ok: false, error: 'Invalid ID token' });
  }
});

// Middleware to protect API routes by verifying Bearer idToken
async function verifyBearerToken(req, res, next) {
  if (!admin.apps.length) return res.status(500).json({ error: 'Admin SDK not initialized on server' });

  const authHeader = req.get('Authorization') || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  const token = match ? match[1] : null;
  if (!token) return res.status(401).json({ error: 'Authorization header missing or malformed. Use Bearer <token>' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('verifyBearerToken error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Example protected endpoint that returns user info (requires Authorization: Bearer <idToken>)
app.get('/protected-data', verifyBearerToken, (req, res) => {
  res.json({
    message: 'This is protected data from server',
    uid: req.user.uid,
    email: req.user.email || null,
    firebase_claims: req.user
  });
});

// Serve static files from repo root
app.use(express.static(path.join(__dirname, '/')));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
