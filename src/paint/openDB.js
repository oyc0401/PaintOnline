import { openDB } from 'idb';

export let dbPromise;

// 클라이언트에서만 실행
if (typeof window !== 'undefined') {
  dbPromise = openDB('CanvasDatabase', 1, {
    upgrade(db) {
      // "canvas" Object Store 생성
      if (!db.objectStoreNames.contains('canvas')) {
        db.createObjectStore('canvas', { keyPath: 'fileId' });
      }

      // "layers" Object Store 생성 및 인덱스 추가
      if (!db.objectStoreNames.contains('layers')) {
        const store = db.createObjectStore('layers', { keyPath: 'layerId' });
        store.createIndex('fileId_idx', 'fileId', { unique: false });
      }
    },
  });
} else {
  console.warn('IndexedDB is not available on the server.');
}