import { make_canvas } from "./src/helpers.js";

import { PaintJSState, PaintMobXState } from "./state.js";
import $ from "jquery";

async function make_layer(
  layerInfo: LayerInfo,
  canvasMeta: CanvasMeta,
): Promise<Layer> {
  const { width, height, background } = canvasMeta;
  const { layerId, name, priority, paintId } = layerInfo;

  const canvas = make_canvas(width, height);
  const ctx = canvas.ctx;
  $(canvas).addClass("canvas");

  const drawCanvas = make_canvas(width, height);
  const drawCtx = drawCanvas.ctx;
  $(drawCanvas).addClass("canvas draw-canvas");

  // drawCanvas 함수 추가
  drawCanvas.reset = () => {
    if (
      drawCanvas.width != PaintJSState.paint.width ||
      drawCanvas.height != PaintJSState.paint.height
    ) {
      console.error("draw_canvas의 크기가 알맞지않음");
      drawCanvas.width = PaintJSState.main_canvas.width;
      drawCanvas.height = PaintJSState.main_canvas.height;
    }
  };

  drawCanvas.clear = () => {
    drawCanvas.ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  };

  if (layerInfo.dataBlob) {
    try {
      const image = await loadImage(layerInfo.dataBlob);
      ctx.drawImage(image, 0, 0);
    } catch (imgErr) {
      console.error("Failed to load image:", imgErr);
    }
  } else if (background) {
    ctx.fillStyle = background;
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
    paintId,
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
  const paint: Paint = PaintJSState.paint;
  const { width, height } = paint;

  const newLayer = await make_layer(
    {
      layerId: generateLayerId(),
      name: "NewLayer",
      priority,
      paintId: paint.paintId,
    },
    { width, height },
  );

  PaintJSState.layerStore[newLayer.layerId] = newLayer;

  setActiveLayerId();

  $(window).triggerHandler("session-update"); // 저장
}

function switchLayer(layerId1, layerId2) {}

export function make_paint(paintInfo: PaintInfo): Paint {
  console.log("페인트 만들기");
  const { paintId, width, height } = paintInfo;
  // layer 비우기
  PaintJSState.$layer_area.empty();

  const paint = new Paint({
    paintId,
    width,
    height,
  });

  PaintJSState.paint = paint;
  PaintJSState.layerStore = {};

  return paint;
}

export function crateDefaultPaint(paintId: string): Paint {
  const paint = make_paint({
    paintId,
    width: PaintJSState.default_canvas_width,
    height: PaintJSState.default_canvas_height,
  });
  return paint;
}

export async function createDefaultLayer(paint: Paint): Promise<void> {
  // 레이어 만들기
  const { width, height, paintId } = paint;

  const back = await make_layer(
    {
      paintId,
      layerId: generateLayerId(),
      name: "BackgroundLayer",
      priority: 0,
    },
    { width, height, background: "#ffffff" },
  );
  PaintJSState.layerStore[back.layerId] = back;

  const layer = await make_layer(
    { paintId, layerId: generateLayerId(), name: "Layer1", priority: 1 },
    { width, height },
  );
  PaintJSState.layerStore[layer.layerId] = layer;
}

export async function createLayerfromLayerList(
  paint: Paint,
  layerList: LayerInfo[],
) {
  try {
    const { width, height } = paint;
    // 모든 make_layer 호출을 동시에 시작
    const layerPromises = layerList.map((layerInfo) =>
      make_layer(layerInfo, { width, height }),
    );

    // 모든 레이어가 완료될 때까지 기다림
    const layers = await Promise.all(layerPromises);

    for (let layer of layers) {
      PaintJSState.layerStore[layer.layerId] = layer;
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
async function loadImage(dataBlob: Blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    const url = URL.createObjectURL(dataBlob);
    img.src = url;
  });
}

// db에 저장되는 데이터
interface PaintInfo {
  paintId: string;
  width: number;
  height: number;
}

//db에 저장되는 데이터
interface LayerInfo {
  dataBlob?: Blob;
  layerId: string;
  name: string;
  paintId: string;
  priority: number;
}

// 실제 사용 객체
class Paint {
  paintId: string;
  width: number;
  height: number;

  constructor({ paintId, width, height }) {
    this.paintId = paintId;
    this.width = width;
    this.height = height;
  }

  setSize(width, height) {
    const beforeWidth = this.width;
    const beforeHeight = this.height;

    this.width = width;
    this.height = height;

    PaintJSState.$layer_area.css("width", width);
    PaintJSState.$layer_area.css("height", height);

    // 캔버스 늘리기
    const layerStore: LayerStore = PaintJSState.layerStore;
    for (const layer of Object.values(layerStore)) {
      const canvas = layer.canvas;
      const ctx = canvas.ctx;
      const image_data = ctx.getImageData(0, 0, beforeWidth, beforeHeight);

      // 캔버스 초기화
      canvas.width = width;
      canvas.height = height;
      layer.drawCanvas.width = width;
      layer.drawCanvas.height = height;

      // background 레이어면
      if (layer.priority == 0) {
        console.log("backgrond layer:", layer);
        ctx.fillStyle = PaintJSState.selected_colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.clearRect(0, 0, beforeWidth, beforeHeight);
      }

      // 기존 영역은 기존 그림으로 그리기
      const temp_canvas = make_canvas(image_data);
      ctx.drawImage(temp_canvas, 0, 0);
    }
  }
}

interface LayerStore {
  [key: string]: Layer;
}

interface Layer {
  paintId: string;
  layerId: string;
  canvas;
  ctx: CanvasRenderingContext2D;
  drawCanvas;
  drawCtx: CanvasRenderingContext2D;
  name: string;
  priority: number;
  $layer;

  imageUrl?: string;
}

// 레이어를 만들때 필요한 기본정보
interface CanvasMeta {
  width: number;
  height: number;
  background?: string;
}
