import fs from 'fs';
import path from 'path';

// 결합할 파일 경로들을 순서대로 배열에 추가
const files = [
  'lib/jquery-3.4.1.min.js',
  'lib/gif.js/gif.js',
  'lib/pako-2.0.3.min.js',
  'lib/UPNG.js',
  'lib/UTIF.js',
  'lib/bmp.js',
  'lib/pdf.js/build/pdf.js',
  'lib/anypalette-0.6.0.js',
  'lib/FileSaver.js',
  'lib/font-detective.js',
  'lib/libtess.min.js',
  'lib/tracky-mouse/core/tracky-mouse.js',
  'lib/os-gui/parse-theme.js',
  'lib/os-gui/$Window.js',
  'lib/os-gui/MenuBar.js',
  'lib/imagetracer_v1.2.5.js',
  './src/app-localization.js'
];

// 출력 파일 경로
const output = 'dist/bundle.js';

// 출력 디렉토리가 없으면 생성
const outputDir = path.dirname(output);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 파일들을 순서대로 읽어와서 출력 파일에 작성
const writeStream = fs.createWriteStream(output);

files.forEach((file) => {
  const data = fs.readFileSync(file, 'utf8');
  writeStream.write(`\n// ${path.basename(file)}\n`); // 파일 이름 주석
  writeStream.write(data);
});

writeStream.end(() => {
  console.log(`모든 파일이 ${output}에 성공적으로 결합되었습니다.`);
});