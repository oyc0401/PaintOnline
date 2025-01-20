import { Handles } from "./src/Handles.js";
import { resize_canvas_and_save_dimensions } from "./src/functions.js";
import $ from "jquery";
import { make_css_cursor } from "./src/helpers.js";
import { init_webgl_stuff } from "./src/image-manipulation.js";
import { setEvent } from "./event.js";
import { PaintJSState } from "./state.js";
import { getDBCanvas } from "./session.js";

export async function initApp(canvasAreaQuery) {
  PaintJSState.getLayers=function(){
    return Object.values(PaintJSState.layerStore)
    .sort((a, b) => a.priority - b.priority);
  }
  
  const $canvas_area = $(canvasAreaQuery);
  const $layer_area = $(".layer-area");

  $layer_area.css("touch-action", "none");
  $canvas_area.css("touch-action", "none");
  $layer_area.css({
    cursor: make_css_cursor(...PaintJSState.default_tool.cursor),
  });

  PaintJSState.$canvas_area = $canvas_area;
  PaintJSState.$layer_area = $layer_area;
  PaintJSState.$canvas = $layer_area;

  setEvent();

  // 파일을 가져오고, 없으면 새로 만든다.
  await getDBCanvas();

  const canvas_handles = new Handles({
    $handles_container: $canvas_area,
    $object_container: $canvas_area,
    get_rect: () => ({
      x: 0,
      y: 0,
      width: PaintJSState.main_canvas.width,
      height: PaintJSState.main_canvas.height,
    }),
    set_rect: ({ width, height }) =>
      resize_canvas_and_save_dimensions(width, height),
    outset: 3,
    get_handles_offset_left: () =>
      parseFloat($canvas_area.css("padding-left")) + 1,
    get_handles_offset_top: () =>
      parseFloat($canvas_area.css("padding-top")) + 1,
    get_ghost_offset_left: () =>
      parseFloat($canvas_area.css("padding-left")) + 1,
    get_ghost_offset_top: () => parseFloat($canvas_area.css("padding-top")) + 1,
    size_only: true,
    is_canvas: true,
  });
  PaintJSState.canvas_handles = canvas_handles;
  PaintJSState.canvas_bounding_client_rect =
    PaintJSState.$layer_area[0].getBoundingClientRect(); // cached for performance, updated later

  init_webgl_stuff();

  // 실행 완료
  PaintJSState.init = true;
  console.log('실행완료!')
}
