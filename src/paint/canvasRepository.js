import {openDB} from'./openDB.js';

// canvasRepository.js

/**
 * 캔버스 저장소
 * - DB 이름: "MyDatabase"
 * - Object Store: "canvas"
 *   - keyPath: "fileId"
 *   - 데이터 구조: { fileId, width, height }
 */

export const canvasRepository = {
  /**
   * 특정 파일의 캔버스 정보를 불러온다
   * @param {string} fileId
   * @param {(error: Error|null, canvasInfo?: { width: number, height: number }) => void} callback
   */
  getCanvas(fileId, callback) {
    openDB((err, db) => {
      if (err) {
        return callback(err);
      }
      const tx = db.transaction("canvas", "readonly");
      const store = tx.objectStore("canvas");
      const getReq = store.get(fileId);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (record) {
          callback(null, { width: record.width, height: record.height });
        } else {
          // 해당 fileId에 대한 기록이 없으면 null
          callback(null, null);
        }
      };
      getReq.onerror = () => {
        callback(getReq.error);
      };
    });
  },

  /**
   * 특정 파일의 캔버스 정보를 저장(덮어쓰기)
   * @param {string} fileId
   * @param {{ width: number, height: number }} canvasInfo
   * @param {(error: Error|null) => void} callback
   */
  setCanvas(fileId, canvasInfo, callback) {
    openDB((err, db) => {
      if (err) {
        return callback(err);
      }
      const tx = db.transaction("canvas", "readwrite");
      const store = tx.objectStore("canvas");
      const record = { fileId, width: canvasInfo.width, height: canvasInfo.height };
      const putReq = store.put(record);
      putReq.onsuccess = () => callback(null);
      putReq.onerror = () => callback(putReq.error);
    });
  },
};
