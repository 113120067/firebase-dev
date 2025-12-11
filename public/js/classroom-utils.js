// classroom-utils.js
// 共用工具函數

/**
 * 生成 4 位隨機課堂代碼（大寫英數字）
 * 使用 crypto.getRandomValues() 提供更安全的隨機性
 * @returns {string} 課堂代碼
 */
export function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomValues = new Uint8Array(4);
  crypto.getRandomValues(randomValues);
  
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(randomValues[i] % chars.length);
  }
  return code;
}

/**
 * 從檔案內容解析單字（每行一個單字）
 * @param {string} fileContent - 檔案內容
 * @returns {string[]} 單字陣列
 */
export function parseWordsFromFile(fileContent) {
  return fileContent
    .split('\n')
    .map(word => word.trim())
    .filter(word => word.length > 0);
}

/**
 * 格式化時間顯示（秒 -> XX 分 XX 秒）
 * @param {number} seconds - 秒數
 * @returns {string} 格式化的時間字串
 */
export function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes} 分 ${secs} 秒`;
}

/**
 * 顯示載入動畫
 */
export function showLoading() {
  let loader = document.getElementById('loading-overlay');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'loading-overlay';
    loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
}

/**
 * 隱藏載入動畫
 */
export function hideLoading() {
  const loader = document.getElementById('loading-overlay');
  if (loader) {
    loader.style.display = 'none';
  }
}

/**
 * 顯示錯誤訊息
 * @param {string} message - 錯誤訊息
 * @param {string} containerId - 容器 ID（選填）
 */
export function showError(message, containerId = null) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(errorDiv);
    } else {
      document.body.insertBefore(errorDiv, document.body.firstChild);
    }
  } else {
    document.body.insertBefore(errorDiv, document.body.firstChild);
  }
  
  // 5 秒後自動移除
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

/**
 * 顯示成功訊息
 * @param {string} message - 成功訊息
 * @param {string} containerId - 容器 ID（選填）
 */
export function showSuccess(message, containerId = null) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  
  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(successDiv);
    } else {
      document.body.insertBefore(successDiv, document.body.firstChild);
    }
  } else {
    document.body.insertBefore(successDiv, document.body.firstChild);
  }
  
  // 3 秒後自動移除
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

/**
 * 顯示資訊訊息
 * @param {string} message - 資訊訊息
 * @param {string} containerId - 容器 ID（選填）
 */
export function showInfo(message, containerId = null) {
  const infoDiv = document.createElement('div');
  infoDiv.className = 'info-message';
  infoDiv.textContent = message;
  
  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(infoDiv);
    } else {
      document.body.insertBefore(infoDiv, document.body.firstChild);
    }
  } else {
    document.body.insertBefore(infoDiv, document.body.firstChild);
  }
  
  // 3 秒後自動移除
  setTimeout(() => {
    infoDiv.remove();
  }, 3000);
}

/**
 * 計算正確率
 * @param {number} correct - 正確次數
 * @param {number} total - 總次數
 * @returns {number} 正確率（0-1）
 */
export function calculateAccuracy(correct, total) {
  if (total === 0) return 0;
  return correct / total;
}

/**
 * 格式化正確率為百分比字串
 * @param {number} accuracy - 正確率（0-1）
 * @returns {string} 百分比字串
 */
export function formatAccuracy(accuracy) {
  return `${(accuracy * 100).toFixed(1)}%`;
}

/**
 * 取得正確率的 CSS class
 * @param {number} accuracy - 正確率（0-1）
 * @returns {string} CSS class name
 */
export function getAccuracyClass(accuracy) {
  if (accuracy >= 0.8) return 'accuracy-high';
  if (accuracy >= 0.5) return 'accuracy-medium';
  return 'accuracy-low';
}

/**
 * 格式化日期時間
 * @param {Date|Timestamp} timestamp - 時間戳記
 * @returns {string} 格式化的日期時間字串
 */
export function formatDateTime(timestamp) {
  let date;
  if (timestamp && timestamp.toDate) {
    // Firestore Timestamp
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return '未知時間';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 隨機打亂陣列
 * @param {Array} array - 要打亂的陣列
 * @returns {Array} 打亂後的陣列（新陣列）
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 從 URL 取得查詢參數
 * @param {string} param - 參數名稱
 * @returns {string|null} 參數值
 */
export function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * 檢查使用者是否已登入
 * @param {Function} onAuthenticated - 已登入時的回調函數
 * @param {Function} onUnauthenticated - 未登入時的回調函數
 */
export async function checkAuth(onAuthenticated, onUnauthenticated) {
  try {
    const { initialize, onAuthStateChanged } = await import('/firebase-config.js');
    await initialize();
    
    onAuthStateChanged(user => {
      if (user) {
        onAuthenticated(user);
      } else {
        onUnauthenticated();
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    onUnauthenticated();
  }
}
