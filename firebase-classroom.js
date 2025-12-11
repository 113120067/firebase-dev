// firebase-classroom.js
// Firestore 課堂操作模組
// 使用方法：import { createClassroom, getClassroom, ... } from './firebase-classroom.js'

import { initialize } from './firebase-config.js';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

let db = null;

/**
 * 確保 Firestore 已初始化
 * @returns {Promise<Firestore>} Firestore instance
 */
async function ensureDb() {
  if (db) return db;
  const { app } = await initialize();
  db = getFirestore(app);
  return db;
}

/**
 * 生成唯一的 4 位課堂代碼
 * @returns {string} 4 位英數字代碼（大寫）
 */
function generateClassroomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 建立新課堂
 * @param {string} teacherId - 教師 Firebase Auth UID
 * @param {string} name - 課堂名稱
 * @param {string[]} words - 單字列表
 * @returns {Promise<{classroomId: string, code: string}>} 課堂 ID 和代碼
 */
export async function createClassroom(teacherId, name, words) {
  try {
    const db = await ensureDb();
    const code = generateClassroomCode();
    
    // 檢查代碼是否已存在（機率很低，但仍需檢查）
    const classroomsRef = collection(db, 'classrooms');
    const q = query(classroomsRef, where('code', '==', code));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // 如果代碼已存在，遞迴重新生成
      return createClassroom(teacherId, name, words);
    }
    
    const classroomData = {
      code,
      name,
      teacherId,
      words,
      wordCount: words.length,
      createdAt: serverTimestamp(),
      archived: false
    };
    
    const docRef = await addDoc(classroomsRef, classroomData);
    return { classroomId: docRef.id, code };
  } catch (error) {
    console.error('Error creating classroom:', error);
    throw error;
  }
}

/**
 * 取得課堂資料
 * @param {string} classroomId - 課堂 ID
 * @returns {Promise<Object|null>} 課堂資料
 */
export async function getClassroom(classroomId) {
  try {
    const db = await ensureDb();
    const classroomRef = doc(db, 'classrooms', classroomId);
    const classroomDoc = await getDoc(classroomRef);
    
    if (!classroomDoc.exists()) {
      return null;
    }
    
    return { id: classroomDoc.id, ...classroomDoc.data() };
  } catch (error) {
    console.error('Error getting classroom:', error);
    throw error;
  }
}

/**
 * 透過代碼取得課堂
 * @param {string} code - 課堂代碼
 * @returns {Promise<Object|null>} 課堂資料
 */
export async function getClassroomByCode(code) {
  try {
    const db = await ensureDb();
    const classroomsRef = collection(db, 'classrooms');
    const q = query(classroomsRef, where('code', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const classroomDoc = snapshot.docs[0];
    return { id: classroomDoc.id, ...classroomDoc.data() };
  } catch (error) {
    console.error('Error getting classroom by code:', error);
    throw error;
  }
}

/**
 * 學生加入課堂
 * @param {string} classroomId - 課堂 ID
 * @param {string} studentName - 學生姓名
 * @returns {Promise<string>} 學生 ID
 */
export async function addStudent(classroomId, studentName) {
  try {
    const db = await ensureDb();
    
    // 先取得課堂資料，獲取單字列表
    const classroom = await getClassroom(classroomId);
    if (!classroom) {
      throw new Error('Classroom not found');
    }
    
    const studentsRef = collection(db, 'students');
    const studentData = {
      classroomId,
      studentName,
      totalTime: 0,
      totalSessions: 0,
      lastActive: serverTimestamp(),
      words: classroom.words,
      wordStats: {},
      joinedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(studentsRef, studentData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
}

/**
 * 取得課堂的所有學生
 * @param {string} classroomId - 課堂 ID
 * @returns {Promise<Array>} 學生列表
 */
export async function getClassroomStudents(classroomId) {
  try {
    const db = await ensureDb();
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, where('classroomId', '==', classroomId));
    const snapshot = await getDocs(q);
    
    const students = [];
    snapshot.forEach(doc => {
      students.push({ id: doc.id, ...doc.data() });
    });
    
    return students;
  } catch (error) {
    console.error('Error getting classroom students:', error);
    throw error;
  }
}

/**
 * 監聽課堂學生變化（即時更新）
 * @param {string} classroomId - 課堂 ID
 * @param {Function} callback - 回調函數
 * @returns {Function} 取消監聽的函數
 */
export function onClassroomStudentsChanged(classroomId, callback) {
  ensureDb().then(db => {
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, where('classroomId', '==', classroomId), orderBy('totalTime', 'desc'));
    
    return onSnapshot(q, snapshot => {
      const students = [];
      snapshot.forEach(doc => {
        students.push({ id: doc.id, ...doc.data() });
      });
      callback(students);
    }, error => {
      console.error('Students snapshot error:', error);
    });
  }).catch(error => {
    console.error('Error setting up students listener:', error);
  });
}

/**
 * 開始學習階段
 * @param {string} studentId - 學生 ID
 * @param {string} classroomId - 課堂 ID
 * @returns {Promise<string>} 學習階段 ID
 */
export async function startLearningSession(studentId, classroomId) {
  try {
    const db = await ensureDb();
    
    // 取得學生資料
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    
    const studentData = studentDoc.data();
    
    const sessionsRef = collection(db, 'learning_sessions');
    const sessionData = {
      classroomId,
      studentId,
      studentName: studentData.studentName,
      startTime: serverTimestamp(),
      endTime: null,
      duration: 0,
      practiceCount: 0,
      correctCount: 0,
      accuracy: 0
    };
    
    const docRef = await addDoc(sessionsRef, sessionData);
    return docRef.id;
  } catch (error) {
    console.error('Error starting learning session:', error);
    throw error;
  }
}

/**
 * 結束學習階段
 * @param {string} sessionId - 學習階段 ID
 * @param {Object} practiceData - 練習資料 {duration, practiceCount, correctCount}
 * @returns {Promise<boolean>} 成功與否
 */
export async function endLearningSession(sessionId, practiceData) {
  try {
    const db = await ensureDb();
    const sessionRef = doc(db, 'learning_sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }
    
    const { duration, practiceCount, correctCount } = practiceData;
    const accuracy = practiceCount > 0 ? correctCount / practiceCount : 0;
    
    // 更新學習階段
    await updateDoc(sessionRef, {
      endTime: serverTimestamp(),
      duration,
      practiceCount,
      correctCount,
      accuracy
    });
    
    // 更新學生總學習時間
    const sessionData = sessionDoc.data();
    const studentRef = doc(db, 'students', sessionData.studentId);
    await updateDoc(studentRef, {
      totalTime: increment(duration),
      totalSessions: increment(1),
      lastActive: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error ending learning session:', error);
    throw error;
  }
}

/**
 * 記錄單字練習
 * @param {string} studentId - 學生 ID
 * @param {string} word - 單字
 * @param {boolean} correct - 是否正確
 * @returns {Promise<boolean>} 成功與否
 */
export async function recordPractice(studentId, word, correct) {
  try {
    const db = await ensureDb();
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    
    const studentData = studentDoc.data();
    const wordStats = studentData.wordStats || {};
    
    if (!wordStats[word]) {
      wordStats[word] = { correct: 0, wrong: 0 };
    }
    
    if (correct) {
      wordStats[word].correct += 1;
    } else {
      wordStats[word].wrong += 1;
    }
    
    await updateDoc(studentRef, {
      wordStats
    });
    
    return true;
  } catch (error) {
    console.error('Error recording practice:', error);
    throw error;
  }
}

/**
 * 取得排行榜
 * @param {string} classroomId - 課堂 ID
 * @returns {Promise<Array>} 排行榜資料
 */
export async function getLeaderboard(classroomId) {
  try {
    const db = await ensureDb();
    const studentsRef = collection(db, 'students');
    const q = query(
      studentsRef, 
      where('classroomId', '==', classroomId),
      orderBy('totalTime', 'desc')
    );
    const snapshot = await getDocs(q);
    
    const leaderboard = [];
    snapshot.forEach((doc, index) => {
      leaderboard.push({
        rank: index + 1,
        id: doc.id,
        ...doc.data()
      });
    });
    
    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

/**
 * 取得學生詳細資料
 * @param {string} studentId - 學生 ID
 * @returns {Promise<Object|null>} 學生詳細資料
 */
export async function getStudentDetail(studentId) {
  try {
    const db = await ensureDb();
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      return null;
    }
    
    const studentData = { id: studentDoc.id, ...studentDoc.data() };
    
    // 取得學習記錄
    const sessionsRef = collection(db, 'learning_sessions');
    const q = query(
      sessionsRef,
      where('studentId', '==', studentId),
      orderBy('startTime', 'desc')
    );
    const sessionsSnapshot = await getDocs(q);
    
    const sessions = [];
    sessionsSnapshot.forEach(doc => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    
    studentData.sessions = sessions;
    
    return studentData;
  } catch (error) {
    console.error('Error getting student detail:', error);
    throw error;
  }
}
