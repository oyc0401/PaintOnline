import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// __dirname을 ES 모듈 방식으로 정의
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));
app.use('/localization', express.static(path.join(__dirname, 'localization')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/help', express.static(path.join(__dirname, 'help')));

// app.use(express.static(path.join(__dirname, 'dist')));
// app.use(express.static(path.join(__dirname, 'localization')));
// app.use(express.static(path.join(__dirname, 'images')));
// app.use(express.static(path.join(__dirname, 'assets')));

// app.use(express.static('localization'));

// 메인 페이지
app.get('/', (req, res) => {
  console.log('??')
  res.sendFile(path.resolve(__dirname, 'dist/index.html'));
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Express server initialized on port " + (process.env.PORT || 3000));
});
