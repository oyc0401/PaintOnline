// openDB.js

let dbInstance = null;
let dbPromise = null;

/**
 * 내부적으로 DB를 열어서 Object Store를 얻는 비동기 헬퍼 함수
 * @returns {Promise<IDBDatabase>}
 */
export async function openDB() {
  if (dbInstance) {
    return dbInstance;
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open("CanvasDatabase", 1); // 최신 버전으로 설정

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // "canvas" Object Store 생성
      if (!db.objectStoreNames.contains("canvas")) {
        db.createObjectStore("canvas", { keyPath: "fileId" });
      }

      // "layers" Object Store 생성 및 인덱스 추가
      if (!db.objectStoreNames.contains("layers")) {
        const store = db.createObjectStore("layers", { keyPath: "layerId" });
        store.createIndex("fileId_idx", "fileId", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;

      // DB 연결 종료 시 dbInstance 초기화
      dbInstance.onclose = () => {
        dbInstance = null;
        dbPromise = null;
      };

      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });

  return dbPromise;
}
