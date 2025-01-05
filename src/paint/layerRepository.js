// layerRepository.js
import { dbPromise } from './openDB.js';

export const layerRepository = {
  /**
   * 특정 파일의 모든 레이어를 비동기적으로 불러온다
   * @param {string} fileId
   * @returns {Promise<{ layerId: string, name: string, dataURL: string, width: number, height: number }[]>}
   */
  async getLayers(fileId) {
    const db = await dbPromise;
    return db.getAllFromIndex('layers', 'fileId_idx', fileId) || [];
  },

  /**
   * 특정 파일에 레이어를 추가한다
   * @param {string} fileId
   * @param {{ layerId: string, name: string, dataURL: string, width: number, height: number }} layer
   * @returns {Promise<void>}
   */
  async addLayer(fileId, layer) {
    const db = await dbPromise;
    const record = { ...layer, fileId };
    await db.put('layers', record);
  },

  /**
   * 특정 파일의 모든 레이어를 저장(덮어쓰기)한다
   * @param {string} fileId
   * @param {{ layerId: string, name: string, dataURL: string, width: number, height: number }[]} layers
   * @returns {Promise<void>}
   */
  async setLayers(fileId, layers) {
    const db = await dbPromise;

    const tx = db.transaction('layers', 'readwrite');
    const store = tx.objectStore('layers');
    const index = store.index('fileId_idx');

    // 기존 레이어 삭제
    const keysToDelete = await index.getAllKeys(fileId);
    for (const key of keysToDelete) {
      store.delete(key);
    }

    // 새 레이어 추가
    for (const layer of layers) {
      const record = { ...layer, fileId };
      store.put(record);
    }

    await tx.done;
  },
};