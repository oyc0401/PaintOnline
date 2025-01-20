import { localize } from "../../localize/localize.js";
import { undoable } from "./history.js";
import { PaintJSState } from "../state";

import {
  bresenham_dense_line,
  bresenham_line,
  stamp_brush_canvas,
  stamp_brush_canvas_color,
} from "./image-manipulation.js";

const TOOL_BRUSH = "TOOL_BRUSH";
const TOOL_PENCIL = "TOOL_PENCIL";

class DrawTool {
  constructor(id, name, description, cursor) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cursor = cursor;
    // 여기서 마스크 캔버스는 그릴때 점 여러개찍는걸 오프스크린에서 행함.
    this.mask_canvas = null; // server notfound
    this.draw_canvas = null;
  }

  pointerdown(_ctx, _x, _y) {
    if (!this.mask_canvas) {
      this.mask_canvas = new OffscreenCanvas(1, 1);
      this.mask_ctx = this.mask_canvas.getContext("2d");
    }
    this.draw_canvas = PaintJSState.draw_canvas;
    this.draw_canvas.reset();
  }
  pointerup() {
    undoable({ name: this.name }, () => {
      PaintJSState.main_ctx.globalCompositeOperation = "source-over";
      PaintJSState.main_ctx.drawImage(this.draw_canvas, 0, 0);

      this.mask_canvas.width = 1;
      this.mask_canvas.height = 1;

      this.draw_canvas.clear();
    });
  }

  paint() {
    const brush = this.get_brush();
    const draw_canvas = this.draw_canvas;
    const draw_ctx = draw_canvas.ctx;

    draw_ctx.fillStyle = PaintJSState.stroke_color;
    const iterate_line = brush.size > 1 ? bresenham_dense_line : bresenham_line;

    // 0. 시작점과 끝점 기준으로 임시 캔버스 생성
    const startX = Math.min(
      PaintJSState.pointer_previous.x,
      PaintJSState.pointer.x,
    );
    const startY = Math.min(
      PaintJSState.pointer_previous.y,
      PaintJSState.pointer.y,
    );
    const endX = Math.max(
      PaintJSState.pointer_previous.x,
      PaintJSState.pointer.x,
    );
    const endY = Math.max(
      PaintJSState.pointer_previous.y,
      PaintJSState.pointer.y,
    );
    const width = endX - startX + brush.size * 2;
    const height = endY - startY + brush.size * 2;

    // 마스크 캔버스 초기화
    const mask_canvas = this.mask_canvas;
    const mask_ctx = this.mask_ctx;
    mask_canvas.width = width;
    mask_canvas.height = height;
    mask_ctx.imageSmoothingEnabled = false;

    // 1. 임시 캔버스에 흰색으로 도형 그리기
    mask_ctx.fillStyle = "black";
    mask_ctx.globalCompositeOperation = "source-over";

    iterate_line(
      PaintJSState.pointer_previous.x - startX,
      PaintJSState.pointer_previous.y - startY,
      PaintJSState.pointer.x - startX,
      PaintJSState.pointer.y - startY,
      (x, y) => {
        stamp_brush_canvas(
          mask_ctx,
          x + brush.size,
          y + brush.size,
          brush.shape,
          brush.size,
        );
      },
    );

    // 2. draw_canvas에서 mask_canvas가 차지하는 영역 지우기
    // 이 작업을 왜하냐면 투명도 50인 색을 칠할때 지우지 않으면 겹쳐보임
    this.draw_canvas.ctx.globalCompositeOperation = "destination-out";
    this.draw_canvas.ctx.drawImage(
      mask_canvas,
      startX - brush.size,
      startY - brush.size,
    );

    // 3. mask_canvas의 투명하지 않은 색을 원하는 색으로 바꾸기
    // 이렇게 하는 이유는 지우기를 할 땐 투명도가 0이여야하고 그리기를 할떈 투명도가 있어도 되기 때문
    mask_ctx.globalCompositeOperation = "source-in";
    mask_ctx.fillStyle = PaintJSState.stroke_color;
    mask_ctx.fillRect(0, 0, mask_canvas.width, mask_canvas.height);

    // 4. draw_canvas에 mask_canvas 그리기
    this.draw_canvas.ctx.globalCompositeOperation = "source-over";
    this.draw_canvas.ctx.drawImage(
      mask_canvas,
      startX - brush.size,
      startY - brush.size,
    );
  }

  cancel() {
    this.mask_canvas.width = 1;
    this.mask_canvas.height = 1;

    this.draw_canvas.clear();
  }
  render_from_mask(ctx, previewing) {
    const brush = this.get_brush();
    // dynamic cursor preview:
    // stamp just onto this temporary canvas so it's temporary
    stamp_brush_canvas_color(
      ctx,
      PaintJSState.pointer.x,
      PaintJSState.pointer.y,
      brush.shape,
      brush.size,
      PaintJSState.stroke_color,
    );
    //console.log('helper',PaintJSState.stroke_color)
  }
  drawPreviewUnderGrid(
    ctx,
    _x,
    _y,
    _grid_visible,
    scale,
    translate_x,
    translate_y,
  ) {
    if (!PaintJSState.pointer_active && !PaintJSState.pointer_over_canvas) {
      return;
    }
    this.render_from_mask(ctx);
  }
}

export class BrushTool extends DrawTool {
  constructor() {
    super(
      TOOL_BRUSH,
      localize("Brush"),
      localize("Draws using a brush with the selected shape and size."),
      ["precise-dotted", [16, 16], "crosshair"],
    );
  }
  get_brush() {
    return { size: PaintJSState.brush_size, shape: PaintJSState.brush_shape };
  }
}

export class PencilTool extends DrawTool {
  constructor() {
    super(
      TOOL_PENCIL,
      localize("Pencil"),
      localize("Draws a free-form line one pixel wide."),
      ["pencil", [13, 23], "crosshair"],
    );
    this.stroke_only = true;
  }

  get_brush() {
    return { size: PaintJSState.pencil_size, shape: "circle" };
  }
}
