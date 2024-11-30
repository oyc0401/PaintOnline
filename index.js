import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import { handler } from './build/handler.js'; // 빌드된 SvelteKit 핸들러를 가져옵니다.


const app = express();

// __dirname을 ES 모듈 방식으로 정의
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('static'));

// app.use(express.static(path.join(__dirname, 'dist')));
// app.use(express.static(path.join(__dirname, 'localization')));
// app.use(express.static(path.join(__dirname, 'images')));
// app.use(express.static(path.join(__dirname, 'assets')));

// app.use(express.static('localization'));
app.use(handler);

// // 여러 언어별 경로 매핑
// const languages = ['ko', 'en', 'fr', 'de'];

// // 각 언어 경로에 대해 동일한 index.html 반환
// languages.forEach(lang => {
//   app.get(`/${lang}`, (req, res) => {
//     console.log(`페이지 열기: ${lang}`);
//     res.sendFile(path.resolve(__dirname, 'dist/index.html'));
//   });
// });


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



