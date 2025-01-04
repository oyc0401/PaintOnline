// canvasRepository.js

import { openDB } from './openDB.js';

/**
 * 헬퍼 함수: IDBRequest를 프로미스로 변환
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 캔버스 저장소
 * - DB 이름: "CanvasDatabase"
 * - Object Store: "canvas"
 *   - keyPath: "fileId"
 *   - 데이터 구조: { fileId, width, height }
 */
export const canvasRepository = {
  /**
   * 특정 파일의 캔버스 정보를 비동기적으로 불러온다
   * @param {string} fileId
   * @returns {Promise<{ width: number, height: number } | null>}
   */
  async getCanvas(fileId) {
    try {
      const db = await openDB();
      const tx = db.transaction("canvas", "readonly");
      const store = tx.objectStore("canvas");
      const getReq = store.get(fileId);
      const record = await promisifyRequest(getReq);
      await promisifyTransaction(tx);
      return record ? { width: record.width, height: record.height } : null;
    } catch (error) {
      console.error("Failed to retrieve canvas info:", error);
      throw error;
    }
  },

  /**
   * 특정 파일의 캔버스 정보를 비동기적으로 저장(덮어쓰기)한다
   * @param {string} fileId
   * @param {{ width: number, height: number }} canvasInfo
   * @returns {Promise<void>}
   */
  async setCanvas(fileId, canvasInfo) {
    try {
      const db = await openDB();
      const tx = db.transaction("canvas", "readwrite");
      const store = tx.objectStore("canvas");
      const record = { fileId, width: canvasInfo.width, height: canvasInfo.height };
      const putReq = store.put(record);
      await promisifyRequest(putReq);
      await promisifyTransaction(tx);
    } catch (error) {
      console.error("Failed to set canvas info:", error);
      throw error;
    }
  },
};

/**
 * 헬퍼 함수: IDBTransaction를 프로미스로 변환
 * @param {IDBTransaction} tx
 * @returns {Promise<void>}
 */
function promisifyTransaction(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}
