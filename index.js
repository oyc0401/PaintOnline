import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// __dirname을 ES 모듈 방식으로 정의
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Express server initialized on port " + (process.env.PORT || 3000));
});
