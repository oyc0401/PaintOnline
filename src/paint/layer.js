import { make_canvas } from "./src/helpers.js";

import { PaintJSState, PaintMobXState } from "./state.js";
import $ from "jquery";

async function make_layer(canvasInfo, layerMeta) {
  const { width, height } = canvasInfo;
  const { layerId, name, priority } = layerMeta;

  const canvas = make_canvas(width, height);
  const ctx = canvas.ctx;
  $(canvas).addClass("canvas");

  const drawCanvas = make_canvas(width, height);
  const drawCtx = drawCanvas.ctx;
  $(drawCanvas).addClass("canvas draw-canvas");
  drawCanvas.reset = () => {
    //console.warn("draw_canvas reset!");
    drawCanvas.width = PaintJSState.main_canvas.width;
    drawCanvas.height = PaintJSState.main_canvas.height;
  };

  //console.log(drawCanvas.clear);
  drawCanvas.clear = () => {
    drawCanvas.ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  };

  if (layerMeta.dataBlob) {
    try {
      const image = await loadImage(layerMeta.dataBlob);
      ctx.drawImage(image, 0, 0);
    } catch (imgErr) {
      console.error("Failed to load image:", imgErr);
    }
  } else if (layerMeta.background) {
    ctx.fillStyle = layerMeta.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // html 만들기
  const zIndex = priority;

  const $layer = $(document.createElement("div"));
  $layer.css({ zIndex }).appendTo(PaintJSState.$layer_area);

  if (priority == 0) {
    $layer.addClass("layer background");
  } else {
    $layer.addClass("layer");
  }

  $(canvas).css({ zIndex: 0 }).appendTo($layer);
  $(drawCanvas).css({ zIndex: 1 }).appendTo($layer);

  return {
    layerId,
    canvas,
    ctx,
    drawCanvas,
    drawCtx,
    name,
    priority,
    $layer,
  };
}

/**
 * 화면에 레이어 canvas들을 배치
 */
export function setActiveLayerId() {
  PaintJSState.activeLayerId =
    PaintJSState.getLayers()[PaintJSState.getLayers().length - 1].layerId;
  PaintMobXState.activeLayerId = PaintJSState.activeLayerId;
}

export async function addLayer() {
  const lastLayer = PaintJSState.getLayers().at(-1);
  const priority = lastLayer.priority + 1;

  const newLayer = await make_layer(PaintJSState.paintObject, {
    layerId: generateLayerId(),
    name: "NewLayer",
    priority,
  });

  PaintJSState.layerObject[newLayer.layerId] = newLayer;

  setActiveLayerId();

  $(window).triggerHandler("session-update"); // 저장
}

function switchLayer() {}

export function crateDefaultPaint(paintId) {
  // layer 비우기
  PaintJSState.$layer_area.empty();

  const paint = {
    paintId,
    width: PaintJSState.default_canvas_width,
    height: PaintJSState.default_canvas_height,
  };

  PaintJSState.paintObject = paint;
  PaintJSState.layerObject = {};

  return paint;
}

export async function createDefaultLayer(canvasInfo) {
  // 레이어 만들기
  const back = await make_layer(canvasInfo, {
    layerId: generateLayerId(),
    name: "BackgroundLayer",
    background: "#ffffff",
    priority: 0,
  });
  PaintJSState.layerObject[back.layerId] = back;

  const layer = await make_layer(canvasInfo, {
    layerId: generateLayerId(),
    name: "Layer1",
    priority: 1,
  });
  PaintJSState.layerObject[layer.layerId] = layer;
}

export async function createLayerfromLayerList(canvasInfo, layerList) {
  try {
    // 모든 make_layer 호출을 동시에 시작
    const layerPromises = layerList.map((layerMeta) =>
      make_layer(canvasInfo, layerMeta),
    );

    // 모든 레이어가 완료될 때까지 기다림
    const layers = await Promise.all(layerPromises);

    for (let layer of layers) {
      PaintJSState.layerObject[layer.layerId] = layer;
    }
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
async function loadImage(dataBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    const url = URL.createObjectURL(dataBlob);
    img.src = url;
  });
}



