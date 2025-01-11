import {
  cancel,
  clear,
  delete_selection,
  deselect,
  edit_copy,
  edit_cut,
  edit_paste,
  file_new,
  file_open,
  file_save,
  file_save_as,
  get_uris,
  image_attributes,
  image_invert_colors,
  load_image_from_uri,
  open_from_file,
  paste,
  paste_image_from_file,
  redo,
  select_all,
  select_tool,
  select_tools,
  set_magnification,
  show_error_message,
  show_resource_load_error_message,
  undo,
  update_canvas_rect,
  update_disable_aa,
  update_helper_layer,
  update_magnified_canvas_size,
  view_bitmap,
} from "./src/functions.js";
import $ from "jquery";
import {
  TAU,
  get_help_folder_icon,
  make_canvas,
  to_canvas_coords,
  to_canvas_coords_magnification,
  make_css_cursor,
} from "./src/helpers.js";
import { rotate } from "./src/image-manipulation.js";

import { localize } from "../localize/localize.js";

import {
  TOOL_AIRBRUSH,
  TOOL_BRUSH,
  TOOL_CURVE,
  TOOL_ELLIPSE,
  TOOL_ERASER,
  TOOL_LINE,
  TOOL_PENCIL,
  TOOL_POLYGON,
  TOOL_RECTANGLE,
  TOOL_ROUNDED_RECTANGLE,
} from "./src/tools.js";

import { PaintJSState } from "./state.js";

import { tool_go } from "./event.js";

const MIN_MAGNIFICATION = 0.12;
const MAX_MAGNIFICATION = 78;

let $canvas_area;
let $layer_area;

export function setDrawEvent() {
  $canvas_area = PaintJSState.$canvas_area;
  $layer_area = PaintJSState.$layer_area;

  // (중요) 그림 그리기
  $layer_area.on("pointerdown", (e) => {
    if (!PaintJSState.init) return;
    console.log("$canvas.pointerdown");
    handleCanvasPointerDown(e);
  });
}

/**
 * 캔버스 영역에서 pointerdown 이벤트가 발생했을 때 호출되는 메인 핸들러
 */
function handleCanvasPointerDown(e) {
  // 드래그로 오브젝트 위치를 옮기는 상태가 아니라면 false
  PaintJSState.position_object_active = false;
  update_canvas_rect();

  // 첫 번째 포인터(터치/마우스)로 그림을 시작할지 여부
  if (!PaintJSState.pointer_active && !PaintJSState.pinchAllowed) {
    console.log("첫 번째 터치로 그림 시작:", e.pointerId);
    PaintJSState.pointer_active = true;
    PaintJSState.pointerId = e.pointerId;
    // pinchAllowed 초기값 false
    PaintJSState.pinchAllowed = false;
  } else {
    // 첫 번째 포인터가 아니라면(두 번째 터치 등) 여기서 중단
    console.log("두 번째 터치 무시");
    return;
  }

  // ------ 첫 번째 포인터로 그림 그리는 로직 ------
  PaintJSState.history_node_to_cancel_to = PaintJSState.current_history_node;
  PaintJSState.pointer_type = e.pointerType;
  PaintJSState.pointer_buttons = e.buttons;

  $(window).one("pointerup pointercancel", (eUp) => {
    PaintJSState.pointer_active = false;
    update_helper_layer(eUp);

    // if (
    //   !PaintJSState.pointer_over_canvas &&
    //   PaintJSState.update_helper_layer_on_pointermove_active
    // ) {
    //   // ??
    //   $(window).off("pointermove", update_helper_layer);
    //   PaintJSState.update_helper_layer_on_pointermove_active = false;
    // }
  });
  // </ pointerup 핸들러>

  if (e.button === 0) {
    PaintJSState.reverse = false;
  } else if (e.button === 2) {
    PaintJSState.reverse = true;
  } else {
    return;
  }

  // 초기화
  PaintJSState.button = e.button;
  PaintJSState.ctrl = e.ctrlKey;
  PaintJSState.shift = e.shiftKey;
  PaintJSState.pointer_start =
    PaintJSState.pointer_previous =
    PaintJSState.pointer =
      to_canvas_coords(e);

  // let interval_ids = [];
  PaintJSState.selected_tools.forEach((selected_tool) => {
    if (selected_tool.paint || selected_tool.pointerdown) {
      tool_go(selected_tool, "pointerdown");
    }
  });

  $(window).on("pointermove", canvas_pointer_move);

  $(window).one("pointerup pointercancel", (eUp) => {
    console.log("tool up!!");
    PaintJSState.button = undefined;
    PaintJSState.reverse = false;

    if (eUp.clientX !== undefined) {
      if (PaintJSState.pointerId === eUp.pointerId) {
        // PaintJSState.pointer = to_canvas_coords(eUp);
      }
    }
    //console.log('toolPointUp', eUp.pointerId,PaintJSState.pinchAllowed);

    if (!PaintJSState.cancel) {
      PaintJSState.selected_tools.forEach((selected_tool) => {
        selected_tool.pointerup?.(
          PaintJSState.main_ctx,
          PaintJSState.pointer.x,
          PaintJSState.pointer.y,
        );
      });
    }

    if (PaintJSState.selected_tools.length === 1) {
      if (PaintJSState.selected_tool.deselect) {
        select_tools(PaintJSState.return_to_tools);
      }
    }

    $(window).off("pointermove", canvas_pointer_move);

    PaintJSState.history_node_to_cancel_to = null;
  });

  update_helper_layer(e);
}

/* -------------------------------------------------------------------------- */
/*                           세부 동작을 위한 함수들                           */
/* -------------------------------------------------------------------------- */

// pointerup 핸들러
const pointerUpHandler = (eUp) => {};

function canvas_pointer_move(e) {
  // ---- [중요 수정 1] pointer_active가 아니면 바로 return → 그림 안 그려짐
  if (!PaintJSState.pointer_active) {
    return;
  }

  PaintJSState.ctrl = e.ctrlKey;
  PaintJSState.shift = e.shiftKey;

  // Quick Undo (for mouse/pen)
  if (PaintJSState.touchCount && e.button !== -1) {
    const MMB = 4;
    if (
      e.pointerType !== PaintJSState.pointer_type ||
      (e.buttons | MMB) !== (PaintJSState.pointer_buttons | MMB)
    ) {
      cancel();
      PaintJSState.pointer_active = false;
      return;
    }
  }

  // SHIFT 스냅(도형 그리기) 로직 (원본 코드와 동일)
  if (e.shiftKey) {
    if (
      PaintJSState.selected_tool.id === TOOL_LINE ||
      PaintJSState.selected_tool.id === TOOL_CURVE
    ) {
      const dist = Math.hypot(
        PaintJSState.pointer.y - PaintJSState.pointer_start.y,
        PaintJSState.pointer.x - PaintJSState.pointer_start.x,
      );
      const eighth_turn = TAU / 8;
      const angle_0_to_8 =
        Math.atan2(
          PaintJSState.pointer.y - PaintJSState.pointer_start.y,
          PaintJSState.pointer.x - PaintJSState.pointer_start.x,
        ) / eighth_turn;
      const angle = Math.round(angle_0_to_8) * eighth_turn;
      PaintJSState.pointer.x = Math.round(
        PaintJSState.pointer_start.x + Math.cos(angle) * dist,
      );
      PaintJSState.pointer.y = Math.round(
        PaintJSState.pointer_start.y + Math.sin(angle) * dist,
      );
    } else if (PaintJSState.selected_tool.shape) {
      const w = Math.abs(PaintJSState.pointer.x - PaintJSState.pointer_start.x);
      const h = Math.abs(PaintJSState.pointer.y - PaintJSState.pointer_start.y);
      if (w < h) {
        if (PaintJSState.pointer.y > PaintJSState.pointer_start.y) {
          PaintJSState.pointer.y = PaintJSState.pointer_start.y + w;
        } else {
          PaintJSState.pointer.y = PaintJSState.pointer_start.y - w;
        }
      } else {
        if (PaintJSState.pointer.x > PaintJSState.pointer_start.x) {
          PaintJSState.pointer.x = PaintJSState.pointer_start.x + h;
        } else {
          PaintJSState.pointer.x = PaintJSState.pointer_start.x - h;
        }
      }
    }
  }

  // 실제 도구 paint
  PaintJSState.selected_tools.forEach((selected_tool) => {
    tool_go(selected_tool);
  });

  PaintJSState.pointer_previous = PaintJSState.pointer;
}
