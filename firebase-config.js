// Firebase 初始化（從 /config 取得 config，server 由環境變數提供）
// 使用方法（在 client module script 中）:
//   import { initialize, onAuthStateChanged, signInWithGoogle, signUp, signIn, logout, getAuthToken } from './firebase-config.js'
//   await initialize(); // 必須先呼叫
//   onAuthStateChanged(user => { ... });
//
// 這樣可以把實際的 Firebase API keys 放在伺服器環境變數，不直接寫到靜態檔案中。
// 注意：Firebase web config 並非機密，但使用 env 的好處是部署時可以在 host 上設定。

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged as _onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as _signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

let app = null;
let auth = null;
let initialized = false;

export async function initialize() {
  if (initialized) return { app, auth };

  // Fetch firebase config from server endpoint
  const res = await fetch('/config', { cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Failed to load firebase config from /config: ' + txt);
  }

  const firebaseConfig = await res.json();

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  initialized = true;

  return { app, auth };
}

// Register onAuthStateChanged listener. Must call await initialize() first.
export function onAuthStateChanged(callback) {
  if (!initialized) throw new Error('Firebase not initialized. Call await initialize() first.');
  return _onAuthStateChanged(auth, callback);
}

// helper: Google 登入（彈跳視窗）
export async function signInWithGoogle() {
  await initialize();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

// helper: Email 註冊（會同時登入）
export async function signUp(email, password) {
  await initialize();
  return createUserWithEmailAndPassword(auth, email, password);
}

// helper: Email 登入
export async function signIn(email, password) {
  await initialize();
  return signInWithEmailAndPassword(auth, email, password);
}

// helper: 登出
export async function logout() {
  await initialize();
  return _signOut(auth);
}

// helper: 取得目前使用者的 ID token（用於呼叫受保護的 server API）
export async function getAuthToken(forceRefresh = false) {
  await initialize();
  if (!auth || !auth.currentUser) return null;
  return auth.currentUser.getIdToken(forceRefresh);
}
