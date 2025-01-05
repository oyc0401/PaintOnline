// canvasRepository.js

import { dbPromise } from './openDB.js';

export const canvasRepository = {
  /**
   * 특정 파일의 캔버스 정보를 비동기적으로 불러온다
   * @param {string} fileId
   * @returns {Promise<{ width: number, height: number } | null>}
   */
  async getCanvas(fileId) {
    const db = await dbPromise;
    const record = await db.get('canvas', fileId);
    return record ? { width: record.width, height: record.height } : null;
  },

  /**
   * 특정 파일의 캔버스 정보를 비동기적으로 저장(덮어쓰기)한다
   * @param {string} fileId
   * @param {{ width: number, height: number }} canvasInfo
   * @returns {Promise<void>}
   */
  async setCanvas(fileId, canvasInfo) {
    const db = await dbPromise;
    const record = { fileId, width: canvasInfo.width, height: canvasInfo.height };
    await db.put('canvas', record);
  },
};
