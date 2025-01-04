import {openDB} from'./openDB.js';
// layerRepository.js

/**
 * 레이어 저장소
 * - DB 이름: "MyDatabase"
 * - Object Store: "layers"
 *   - keyPath: "layerId"
 *   - 데이터 구조: { layerId, fileId, name, dataURL, width, height }
 */

export const layerRepository = {
  /**
   * 특정 파일의 모든 레이어를 불러온다
   * @param {string} fileId
   * @param {(error: Error|null, layers?: { layerId: string, name: string, dataURL: string, width: number, height: number }[]) => void} callback
   */
  getLayers(fileId, callback) {
    openDB((err, db) => {
      if (err) {
        return callback(err);
      }
      const tx = db.transaction("layers", "readonly");
      const store = tx.objectStore("layers");
      const index = store.index("fileId_idx");
      const getReq = index.getAll(IDBKeyRange.only(fileId));
      getReq.onsuccess = () => {
        const records = getReq.result;
        callback(null, records || []);
      };
      getReq.onerror = () => {
        callback(getReq.error);
      };
    });
  },

  /**
   * 특정 파일에 레이어를 추가한다
   * @param {string} fileId
   * @param {{ layerId: string, name: string, dataURL: string, width: number, height: number }} layer
   * @param {(error: Error|null) => void} callback
   */
  addLayer(fileId, layer, callback) {
    openDB((err, db) => {
      if (err) {
        return callback(err);
      }
      const tx = db.transaction("layers", "readwrite");
      const store = tx.objectStore("layers");
      const record = { ...layer, fileId };
      const putReq = store.put(record);
      putReq.onsuccess = () => callback(null);
      putReq.onerror = () => callback(putReq.error);
    });
  },

  /**
   * 특정 파일의 모든 레이어를 저장(덮어쓰기)
   * @param {string} fileId
   * @param {{ layerId: string, name: string, dataURL: string, width: number, height: number }[]} layers
   * @param {(error: Error|null) => void} callback
   */
  setLayers(fileId, layers, callback) {
    openDB((err, db) => {
      if (err) {
        return callback(err);
      }
      const tx = db.transaction("layers", "readwrite");
      const store = tx.objectStore("layers");
      // 먼저 기존 레이어 삭제
      const deleteReq = store.index("fileId_idx").openCursor(IDBKeyRange.only(fileId));
      deleteReq.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // 모든 기존 레이어 삭제 완료 후, 새 레이어 추가
          let completed = 0;
          const total = layers.length;
          if (total === 0) {
            return callback(null);
          }
          layers.forEach((layer) => {
            const record = { ...layer, fileId };
            const putReq = store.put(record);
            putReq.onsuccess = () => {
              completed++;
              if (completed === total) {
                callback(null);
              }
            };
            putReq.onerror = () => {
              callback(putReq.error);
            };
          });
        }
      };
      deleteReq.onerror = () => {
        callback(deleteReq.error);
      };
    });
  },
};
