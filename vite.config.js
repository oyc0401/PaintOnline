// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',   // 메인 페이지
      },
    },
    outDir: 'dist',           // 빌드 결과물을 저장할 폴더
  },
  server: {
    host: true,
  },
});