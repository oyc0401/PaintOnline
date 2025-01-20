import { observable, configure } from "mobx";
import { defaultState } from "./defaultState";
configure({ enforceActions: "never" }); // strict-mode 비활성화

export const PaintMobXState = observable({
  undo_length: 0,
  redo_length: 0,
  activeLayerId: "",
  lastChanged: 0,
});


function getMainCanvas() {
  return PaintJSState.layerStore[PaintJSState.activeLayerId].canvas;
}
function getMainCtx() {
  return PaintJSState.layerStore[PaintJSState.activeLayerId].ctx;
}

function getDrawLayer() {
  const canvas = PaintJSState.layerStore[PaintJSState.activeLayerId].drawCanvas;
  return canvas;
}

const handler:ProxyHandler<State> = {
  get(target, prop) {
    // 특정 속성('undos', 'redos')은 PaintMobXState에서 가져옴
    if (["main_canvas"].includes(prop)) {
      // console.log()
      return getMainCanvas();
    }
    if (["main_ctx"].includes(prop)) {
      //console.error(`[GET] Accessing MobX state: ${prop}`);
      return getMainCtx();
    }
    if (["draw_canvas"].includes(prop)) {
      //console.error(`[GET] Accessing MobX state: ${prop}`);
      return getDrawLayer();
    }

    // 나머지는 기존 target에서 가져옴
    return Reflect.get(target, prop);
  },

  set(target, prop, value) {
    // 특정 속성('undos', 'redos')은 PaintMobXState에 설정

    // 나머지는 기존 target에 설정
    return Reflect.set(target, prop, value);
  },
};



export const PaintJSState = makeState();

function makeState() {
  const isBrowser = typeof window !== "undefined";
  if (!isBrowser) {
    return {};
  } else {
    console.log("window있음");
    const state:State = defaultState();
    const proxy = new Proxy(state, handler);
    return proxy;
  }
}

interface State{
  default_magnification: number;
  default_tool;
  default_canvas_width: number;
  default_canvas_height: number;
  aliasing: boolean;
  transparency: boolean;
  magnification: number;
  return_to_magnification: number;
  main_canvas;
  main_ctx;
  brush_shape;
  brush_size;
  eraser_size;
  airbrush_size;
  pencil_size;
  stroke_size;
  tool_transparent_mode;
  stroke_color;
  fill_color;
  pick_color_slot;
  selected_tool;
  return_to_tool;
  selected_colors;
  selection;
  helper_layer;
  $thumbnail_window;
  thumbnail_canvas;
  show_thumbnail;
  text_tool_font;
  root_history_node;
  current_history_node;
  history_node_to_cancel_to;
  undos;
  redos;
  file_name;
  file_format;
  system_file_handle;
  saved;
  pointer;
  pointer_start;
  pointer_previous;
  pointer_active;
  pointer_type;
  pointer_buttons;
  reverse;
  ctrl;
  shift;
  button;
  pointer_over_canvas;
  update_helper_layer_on_pointermove_active;
  pointers;
  pointer_float_previous;
  fill;
  stroke;
  pointerId;
  pinchAllowed;
  touchCount;
  first_pointer_time;
  discard_quick_undo_period;
  position_mouse_active;
  position_mouse_x;
  position_mouse_y;
  position_canvas_active;
  position_canvas_x;
  position_canvas_y;
  position_object_active;
  position_object_x;
  position_object_y;
  $layer_area;
  paint;
  layerStore;
  activeLayerId;
}
