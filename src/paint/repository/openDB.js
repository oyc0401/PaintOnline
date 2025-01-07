import { openDB } from 'idb';

export let dbPromise;

// 클라이언트에서만 실행
if (typeof window !== 'undefined') {
  dbPromise = openDB('PaintDatabase', 1, {
    upgrade(db) {
      // "canvas" Object Store 생성
      if (!db.objectStoreNames.contains('paint')) {
        db.createObjectStore('paint', { keyPath: 'paintId' });
      }

      // "layers" Object Store 생성 및 인덱스 추가
      if (!db.objectStoreNames.contains('layers')) {
        const store = db.createObjectStore('layers', { keyPath: 'layerId' });
        store.createIndex('paintId_idx', 'paintId', { unique: false });
      }
    },
  });
} else {
  console.warn('IndexedDB is not available on the server.');
}