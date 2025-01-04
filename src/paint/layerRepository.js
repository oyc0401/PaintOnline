// layerRepository.js
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
 * 헬퍼 함수: IndexedDB 트랜잭션을 프로미스로 변환
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

/**
 * 레이어 저장소
 * - DB 이름: "MyDatabase"
 * - Object Store: "layers"
 *   - keyPath: "layerId"
 *   - 데이터 구조: { layerId, fileId, name, dataURL, width, height }
 */
export const layerRepository = {
  /**
   * 특정 파일의 모든 레이어를 비동기적으로 불러온다
   * @param {string} fileId
   * @returns {Promise<{ layerId: string, name: string, dataURL: string, width: number, height: number }[]>}
   */
  async getLayers(fileId) {
    const db = await openDB();
    const tx = db.transaction('layers', 'readonly');
    const store = tx.objectStore('layers');
    const index = store.index('fileId_idx');
    const getReq = index.getAll(IDBKeyRange.only(fileId));

    const layers = await promisifyRequest(getReq);
    await promisifyTransaction(tx);
    return layers || [];
  },

  /**
   * 특정 파일에 레이어를 추가한다
   * @param {string} fileId
   * @param {{ layerId: string, name: string, dataURL: string, width: number, height: number }} layer
   * @returns {Promise<void>}
   */
  async addLayer(fileId, layer) {
    const db = await openDB();
    const tx = db.transaction('layers', 'readwrite');
    const store = tx.objectStore('layers');
    const record = { ...layer, fileId };
    const putReq = store.put(record);

    await promisifyRequest(putReq);
    await promisifyTransaction(tx);
  },

  /**
   * 특정 파일의 모든 레이어를 저장(덮어쓰기)한다
   * @param {string} fileId
   * @param {{ layerId: string, name: string, dataURL: string, width: number, height: number }[]} layers
   * @returns {Promise<void>}
   */
  async setLayers(fileId, layers) {
    const db = await openDB();
    const tx = db.transaction('layers', 'readwrite');
    const store = tx.objectStore('layers');
    const index = store.index('fileId_idx');

    // 기존 레이어 삭제
    const cursorReq = index.openCursor(IDBKeyRange.only(fileId));
    const cursor = await promisifyRequest(cursorReq);
    while (cursor) {
      cursor.delete();
      cursor = await promisifyRequest(cursorReq);
    }

    // 새 레이어 추가
    for (const layer of layers) {
      const record = { ...layer, fileId };
      const putReq = store.put(record);
      await promisifyRequest(putReq);
    }

    await promisifyTransaction(tx);
  },
};
