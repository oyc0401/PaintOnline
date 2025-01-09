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
    console.log("layer", layer);
    const zIndex = i + 2; // zIndex는 2부터 시작 (1은 background-canvas)
    if (i == 0) {
      const div = $(document.createElement("div"));
      div.css({ zIndex }).addClass("layer background");

      $(layer.canvas).css({ zIndex: 1 }).addClass("inner-layer").appendTo(div);
      $(layer.drawLayer.canvas).css({ zIndex: 2 }).addClass("inner-layer draw-layer").appendTo(div);

      div.appendTo(PaintJSState.$layer_area);
    } else {
      const div = $(document.createElement("div"));
      div.css({ zIndex }).addClass("layer");

      $(layer.canvas).css({ zIndex: 1 }).addClass("inner-layer").appendTo(div);
      $(layer.drawLayer.canvas).css({ zIndex: 2 }).addClass("inner-layer draw-layer").appendTo(div);

      div.appendTo(PaintJSState.$layer_area);
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

export async function createDefaultLayer(canvasInfo) {
  // 레이어 만들기
  const back = await make_layer(canvasInfo, {
    layerId: generateLayerId(),
    name: "BackgroundLayer",
    background: "#ffffff",
    priority: 0,
  });

  const la = await make_layer(canvasInfo, {
    layerId: generateLayerId(),
    name: "Layer1",
    priority: 1,
  });

  const layers = [back, la];
  //console.log(layers);

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

  const drawLayer = {canvas: make_canvas(width,height)}

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
  try {
    // 모든 make_layer 호출을 동시에 시작
    const layerPromises = layerList.map((layerMeta) =>
      make_layer(canvasInfo, layerMeta),
    );

    // 모든 레이어가 완료될 때까지 기다림
    const layers = await Promise.all(layerPromises);

    return layers;
  } catch (error) {
    console.error("레이어 생성 중 에러 발생:", error);
    throw error; // 필요에 따라 에러를 다시 던질 수 있습니다.
  }
}

/**
 * 고유한 layerId 생성
 */
function generateLayerId() {
  return `layer_${Math.random().toString(36).substr(2, 9)}`;
}

// 이미지 로드를 위한 헬퍼 함수
async function loadImage(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
}
