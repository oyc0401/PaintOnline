// paintRepository.js

import { dbPromise } from "./openDB.js";

export const paintRepository = {
  /**
   * 특정 파일의 캔버스 정보를 비동기적으로 불러온다
   * @param {string} paintId
   * @returns {Promise<{ width: number, height: number } | null>}
   */
  async getPaint(paintId) {
    const db = await dbPromise;
    const record = await db.get("paint", paintId);
    return record;
  },

  /**
   * 특정 파일의 캔버스 정보를 비동기적으로 저장(덮어쓰기)한다
   * @param {string} paintId
   * @param {{ width: number, height: number }} canvasInfo
   * @returns {Promise<void>}
   */
  async setPaint(paintId, paintInfo) {
    const db = await dbPromise;
    const { width, height, layerCount } = paintInfo;
    const record = { paintId, width, height, layerCount };
    await db.put("paint", record);
  },
};
