// layerRepository.js
import { dbPromise } from './openDB.js';

export const layerRepository = {
  /**
   * 특정 파일의 모든 레이어를 비동기적으로 불러온다
   * @param {string} paintId
   * @returns {Promise<{ layerId: string, name: string, dataURL: string, width: number, height: number }[]>}
   */
  async getLayers(paintId) {
    const db = await dbPromise;
    const layers = (await db.getAllFromIndex('layers', 'paintId_idx', paintId)) || [];
    return layers.sort((a, b) => a.priority - b.priority); // priority 오름차순 정렬
  },

  /**
   * 특정 파일에 레이어를 추가한다
   * @param {string} paintId
   * @param {{ layerId: string, name: string, dataURL: string, width: number, height: number }} layer
   * @returns {Promise<void>}
   */
  async addLayer(paintId, layer) {
    const db = await dbPromise;
    const record = { ...layer, paintId };
    await db.put('layers', record);
  },

  /**
   * 특정 파일의 모든 레이어를 저장(덮어쓰기)한다
   * @param {string} paintId
   * @param {{ layerId: string, name: string, dataURL: string, width: number, height: number }[]} layers
   * @returns {Promise<void>}
   */
  async setLayers(paintId, layers) {
    const db = await dbPromise;

    const tx = db.transaction('layers', 'readwrite');
    const store = tx.objectStore('layers');
    const index = store.index('paintId_idx');

    // 기존 레이어 삭제
    const keysToDelete = await index.getAllKeys(paintId);
    for (const key of keysToDelete) {
      await store.delete(key);
    }

    // 새 레이어 추가
    for (const layer of layers) {
      const record = { ...layer, paintId };
      await store.put(record);
    }

    await tx.done;
  },
};