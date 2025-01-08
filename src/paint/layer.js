import { make_canvas } from "./src/helpers.js";
import { OnCanvasDrawLayer } from "./src/OnCanvasDrawLayer.js";
import { OnCanvasHelperLayer } from "./src/OnCanvasHelperLayer.js";

import { PaintJSState, PaintMobXState } from "./state.js";
import $ from "jquery";

/**
 * 화면에 레이어 canvas들을 배치
 */
export function setLayer(layers) {
  PaintJSState.layers = layers;

  PaintJSState.$layer_area.empty();
  for (let i = 0; i < PaintJSState.layers.length; i++) {
    const layer = PaintJSState.layers[i];
    // console.log("layer", layer.canvas);
    const zIndex = i + 2; // zIndex는 2부터 시작 (1은 background-canvas)
    if (i == 0) {
      $(layer.canvas)
        .css({ zIndex })
        .addClass("layer background")
        .appendTo(PaintJSState.$layer_area);
    } else {
      $(layer.canvas)
        .css({ zIndex })
        .addClass("layer")
        .appendTo(PaintJSState.$layer_area);
    }
  }

  PaintJSState.activeLayerIndex = PaintJSState.layers.length - 1;
  PaintMobXState.activeLayerIndex = PaintJSState.activeLayerIndex;

  PaintJSState.$canvas_area.trigger("resize");
}

export function crateDefaultCanvas(paintId) {
  return {
    paintId,
    width: PaintJSState.default_canvas_width,
    height: PaintJSState.default_canvas_height,
  };
}

export function createDefaultLayer(canvasInfo) {
  // 레이어 만들기
  const back = make_layer(canvasInfo, {
    layerId: generateLayerId(),
    name: "BackgroundLayer",
    background: "#ffffff",
    priority: 0,
  });
  
  const la = make_layer(canvasInfo, {
    layerId: generateLayerId(),
    name: "Layer1",
    priority: 1,
  });
  
  const layers = [back, la];

  return layers;
}

async function make_layer(canvasInfo, layerMeta) {
  const { width, height } = canvasInfo;
  const { layerId, name, priority } = layerMeta;

  const canvas = make_canvas(width, height);
  const ctx = canvas.ctx;

  if (layerMeta.dataURL) {
    try {
      const image = await loadImage(layerMeta.dataURL);
      ctx.drawImage(image, 0, 0);
    } catch (imgErr) {
      console.error("Failed to load image:", imgErr);
    }
  } else if (layerMeta.background) {
    ctx.fillStyle = layerMeta.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const scale = PaintJSState.magnification;

  // // if (!PaintJSState.helper_layer) {
  // //   //console.log('make helper-layer')
  // //   PaintJSState.helper_layer = new OnCanvasHelperLayer(
  // //     0,
  // //     0,
  // //     PaintJSState.main_canvas.width,
  // //     PaintJSState.main_canvas.height,
  // //     false,
  // //     scale,
  // //   );
  // // }

  // // const helperLayer = new OnCanvasHelperLayer(0, 0, width, height, 0, scale);
  const drawLayer = new OnCanvasDrawLayer(0, 0, width, height, false, scale);

  return {
    layerId,
    canvas,
    ctx,
    name,
    priority,
    drawLayer,
  };
}

export async function layerListToLayerCanvas(canvasInfo, layerList) {
  const layers = [];

  for (const layerMeta of layerList) {
    const layer = await make_layer(canvasInfo, layerMeta);
    layers.push(layer);
  }

  return layers;
}

/**
 * 고유한 layerId 생성
 */
function generateLayerId() {
  return `layer_${Math.random().toString(36).substr(2, 9)}`;
}

// 이미지 로드를 위한 헬퍼 함수
function loadImage(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
}
