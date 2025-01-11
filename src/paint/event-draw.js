import {
  cancel,
  select_tools,
  update_canvas_rect,
  update_helper_layer,
} from "./src/functions.js";
import $ from "jquery";
import { TAU, to_canvas_coords } from "./src/helpers.js";

import { TOOL_CURVE, TOOL_LINE } from "./src/tools.js";

import { PaintJSState } from "./state.js";

import { tool_go } from "./event.js";

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

  $(window).on("pointerup pointercancel", pointerUpHandler);

  update_helper_layer(e);
}

/* -------------------------------------------------------------------------- */
/*                           세부 동작을 위한 함수들                           */
/* -------------------------------------------------------------------------- */

// pointerup 핸들러
const pointerUpHandler = (eUp) => {
  if (PaintJSState.pointerId != eUp.pointerId) {
    console.log("fake pointerup!!");
    return;
  }

  console.log("pointerup!!");

  PaintJSState.pointer_active = false;
  PaintJSState.button = undefined;
  PaintJSState.reverse = false;

  if (eUp.clientX !== undefined) {
    PaintJSState.pointer = to_canvas_coords(eUp);
  }

  // cancel이면 그리지 말아야함.
  // 왜냐면 그리면 히스토리가 하나 푸시됌.
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

  $(window).off("pointerup pointercancel", pointerUpHandler);
};

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
