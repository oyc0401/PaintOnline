let dbInstance = null;

/**
 * 내부적으로 DB를 열어서 Object Store를 얻는 헬퍼 함수
 */
function openDB(callback) {
  if (dbInstance) {
    callback(null, dbInstance);
    return;
  }

  const request = indexedDB.open("CanvasDatabase", 1); // 최신 버전으로 설정

  request.onupgradeneeded = (event) => {
    const db = event.target.result;

    // canvas 스토어가 없으면 생성
    if (!db.objectStoreNames.contains("canvas")) {
      db.createObjectStore("canvas", { keyPath: "fileId" });
    }

    // layers 스토어가 없으면 생성
    if (!db.objectStoreNames.contains("layers")) {
      const store = db.createObjectStore("layers", { keyPath: "layerId" });
      // fileId로 검색하기 위한 인덱스 생성
      store.createIndex("fileId_idx", "fileId", { unique: false });
    }

  };

  request.onsuccess = (event) => {
    dbInstance = event.target.result;
    callback(null, dbInstance);
  };

  request.onerror = (event) => {
    callback(event.target.error);
  };
}

export { openDB };
