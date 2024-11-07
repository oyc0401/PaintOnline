// webpack.config.js
const path = require('path');

module.exports = {
  entry: [
    // './lib/jquery-3.4.1.min.js',
    // './lib/gif.js/gif.js',
    // './lib/pako-2.0.3.min.js',
    // './lib/UPNG.js',
    // './lib/UTIF.js',
    // './lib/bmp.js',
    // './lib/pdf.js/build/pdf.js',
    // './lib/anypalette-0.6.0.js',
    // './lib/FileSaver.js',
    // './lib/font-detective.js',
    // './lib/libtess.min.js',
    // './lib/tracky-mouse/core/tracky-mouse.js',
    // './lib/os-gui/parse-theme.js',
    // './lib/os-gui/$Window.js',
    './lib/os-gui/MenuBar.js',
    './lib/imagetracer_v1.2.5.js',
    // './src/app-localization.js'
  ],
  output: {
    filename: 'bundle.js', // 번들링한 결과물 파일명
    path: path.resolve(__dirname, 'dist'), // 결과물 저장 경로
  },
  mode: 'production',
};
