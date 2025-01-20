export function reset_history() {
  PaintJSState.undos.length = 0;
  PaintJSState.redos.length = 0;
  PaintMobXState.undo_length = PaintJSState.undos.length;
  PaintMobXState.redo_length = PaintJSState.redos.length;
  PaintJSState.current_history_node = PaintJSState.root_history_node =
    make_history_node({
      name: localize("New"),
      icon: get_help_folder_icon("p_blank.png"),
      activeLayerId: PaintJSState.activeLayerId,
    });
  PaintJSState.history_node_to_cancel_to = null;

  console.log("히스토리 현재 레이어로 리셋!");

  // 히스토리

  let layerStore = {};
  let sortedLayers = PaintJSState.getLayers();

  for (let i = 0; i < sortedLayers.length; i++) {
    const layer = sortedLayers[i];

    // 오프스크린 캔버스 생성
    const offscreenCanvas = new OffscreenCanvas(
      layer.canvas.width,
      layer.canvas.height,
    );
    const offscreenCtx = offscreenCanvas.getContext("2d");
    offscreenCanvas.ctx = offscreenCtx;

    // 메인 캔버스 내용을 오프스크린 캔버스로 복사
    offscreenCtx.drawImage(layer.canvas, 0, 0);
    const offLayer = {
      offscreenCanvas,
      layerId: layer.layerId,
      name: layer.name,
    };
    layerStore[layer.layerId] = offLayer;
  }

  PaintJSState.current_history_node.layerStore = layerStore;
  PaintJSState.$canvas_area.trigger("resize");
  // $(window).triggerHandler("history-update"); // update history view
}

function make_history_node({
  parent = null, // the state before this state (its basis), or null if this is the first state
  futures = [], // the states branching off from this state (its children)
  timestamp = Date.now(), // when this state was created
  soft = false, // indicates that undo should skip this state; it can still be accessed with the History window
  selection_image_data = null, // the image data for the selection, if any
  selection_x, // the x position of the selection, if any
  selection_y, // the y position of the selection, if any
  text_tool_font = null, // the font of the Text tool (important to restore a textbox-containing state, but persists without a textbox)
  tool_transparent_mode = false, // whether transparent mode is on for Select/Free-Form Select/Text tools; otherwise box is opaque
  foreground_color, // selected foreground color (left click)
  background_color, // selected background color (right click)
  ternary_color, // selected ternary color (ctrl+click)
  name, // the name of the operation, shown in the history window, e.g. localize("Resize Canvas")
  icon = null, // an Image representation of the operation type, shown in the history window, e.g. get_help_folder_icon("p_blank.png")
  activeLayerId = "",
  layerStore = {},
}) {
  return {
    parent,
    futures,
    timestamp,
    soft,
    //layers,
    selection_image_data,
    selection_x,
    selection_y,
    text_tool_font,
    tool_transparent_mode,
    foreground_color,
    background_color,
    ternary_color,
    name,
    icon,
    activeLayerId,
    layerStore,
  };
}

function go_to_history_node(target_history_node, canceling) {
  if (
    !target_history_node.layerStore ||
    Object.keys(target_history_node.layerStore).length == 0
  ) {
    if (!canceling) {
      show_error_message("History entry has no image data.");
      window.console?.log(
        "Target history entry has no image data:",
        target_history_node,
      );
    }
    return;
  }

  PaintJSState.current_history_node = target_history_node;
  PaintJSState.activeLayerId = target_history_node.activeLayerId;

  console.log("target_history_node:", target_history_node);
  deselect(true);
  if (!canceling) {
    cancel(true);
  }
  PaintJSState.saved = false;
  update_title();

  // 이미지 그리기
  if (target_history_node.layerStore) {
    let sortedLayers = Object.values(target_history_node.layerStore).sort(
      (a, b) => a.priority - b.priority,
    );

    for (let layer of sortedLayers) {
      const { layerId, offscreenCanvas } = layer;
      //console.log('layerId',layerId)
      //console.log(PaintJSState.layerStore[layerId])
      drawcopy(PaintJSState.layerStore[layerId].ctx, offscreenCanvas);
    }
  } else {
    console.error("error!!!");
  }

  // 선택 요소 그리기
  if (target_history_node.selection_image_data) {
    if (PaintJSState.selection) {
      PaintJSState.selection.destroy();
    }
    if (target_history_node.name === localize("Free-Form Select")) {
      select_tool(get_tool_by_id(TOOL_FREE_FORM_SELECT));
    } else {
      select_tool(get_tool_by_id(TOOL_SELECT));
    }
    PaintJSState.selection = new OnCanvasSelection(
      target_history_node.selection_x,
      target_history_node.selection_y,
      target_history_node.selection_image_data.width,
      target_history_node.selection_image_data.height,
      target_history_node.selection_image_data,
    );
  }

  console.log(PaintJSState.activeLayerId, PaintJSState.layerStore);
  PaintJSState.$canvas_area.trigger("resize");
  $(window).triggerHandler("session-update"); // autosave
}

function undoable({ name, icon, soft }, callback) {
  const before_callback_history_node = PaintJSState.current_history_node;
  callback?.();

  if (PaintJSState.current_history_node !== before_callback_history_node) {
    alert(
      `History node switched during undoable callback for ${name}. This shouldn't happen.`,
    );
  }

  // 이미지 데이터 만들기
  //let layers = [];
  let layerStore = {};

  const sortedLayers = PaintJSState.getLayers();
  for (let i = 0; i < sortedLayers.length; i++) {
    const layer = sortedLayers[i];

    // 오프스크린 캔버스 생성
    const offscreenCanvas = new OffscreenCanvas(
      layer.canvas.width,
      layer.canvas.height,
    );

    // 왜인지 GC가 바로 일어나네
    const offscreenCtx = offscreenCanvas.getContext("2d");
    // 메인 캔버스 내용을 오프스크린 캔버스로 복사
    offscreenCtx.drawImage(layer.canvas, 0, 0);

    const offLayer = {
      offscreenCanvas,
      layerId: layer.layerId,
      name: layer.name,
    };
    layerStore[layer.layerId] = offLayer;
  }

  /////

  PaintJSState.redos.length = 0;
  PaintJSState.undos.push(PaintJSState.current_history_node);
  PaintMobXState.undo_length = PaintJSState.undos.length;
  PaintMobXState.redo_length = PaintJSState.redos.length;

  const new_history_node = make_history_node({
    layerStore,
    selection_image_data:
      PaintJSState.selection &&
      PaintJSState.selection.canvas.ctx.getImageData(
        0,
        0,
        PaintJSState.selection.canvas.width,
        PaintJSState.selection.canvas.height,
      ),
    selection_x: PaintJSState.selection && PaintJSState.selection.x,
    selection_y: PaintJSState.selection && PaintJSState.selection.y,
    text_tool_font: JSON.parse(JSON.stringify(PaintJSState.text_tool_font)),
    tool_transparent_mode: PaintJSState.tool_transparent_mode,
    foreground_color: PaintJSState.selected_colors.foreground,
    background_color: PaintJSState.selected_colors.background,
    ternary_color: PaintJSState.selected_colors.ternary,
    parent: PaintJSState.current_history_node,
    name,
    icon,
    soft,
    activeLayerId: PaintJSState.activeLayerId,
  });
  PaintJSState.current_history_node.futures.push(new_history_node);
  PaintJSState.current_history_node = new_history_node;

  // soft는 그냥 넘어가는 히스토리임. [1, 2, 3] 에서 2가 soft면 1->3, 3->1
  // 따라서 [1, 2, 3]에서 3이 soft이면 2->3, 3->2임
  if (soft) {
    console.log("undo soft:", PaintJSState.undos.length);
  } else {
    console.log("undo stack:", PaintJSState.undos.length);
    PaintJSState.saved = false;
  }

  $(window).triggerHandler("history-update"); // update history view

  $(window).triggerHandler("session-update"); // autosave
}

function undo() {
  console.log("undo!");
  if (PaintJSState.undos.length < 1) {
    return false;
  }

  PaintJSState.redos.push(PaintJSState.current_history_node);
  let target_history_node = PaintJSState.undos.pop();

  while (target_history_node.soft && PaintJSState.undos.length) {
    PaintJSState.redos.push(target_history_node);
    target_history_node = PaintJSState.undos.pop();
  }
  go_to_history_node(target_history_node);

  PaintMobXState.undo_length = PaintJSState.undos.length;
  PaintMobXState.redo_length = PaintJSState.redos.length;

  return true;
}

function redo() {
  console.log("redo!");
  if (PaintJSState.redos.length < 1) {
    return false;
  }

  // undo에 넣고
  PaintJSState.undos.push(PaintJSState.current_history_node);
  let target_history_node = PaintJSState.redos.pop();

  while (target_history_node.soft && PaintJSState.redos.length) {
    PaintJSState.undos.push(target_history_node);
    target_history_node = PaintJSState.redos.pop();
  }

  console.log("end redo!");
  go_to_history_node(target_history_node);

  PaintMobXState.undo_length = PaintJSState.undos.length;
  PaintMobXState.redo_length = PaintJSState.redos.length;

  return true;
}

function get_history_ancestors(node) {
  const ancestors = [];
  for (node = node.parent; node; node = node.parent) {
    ancestors.push(node);
  }
  return ancestors;
}


function cancel(going_to_history_node, discard_document_state) {
  if (!PaintJSState.history_node_to_cancel_to) {
    return;
  }

  const history_node_to_cancel_to = PaintJSState.history_node_to_cancel_to;

  PaintJSState.cancel = true;

  // PaintJSState.cancel이면 그리지 않음
  $(window).triggerHandler("pointerup"); // 여기서 history_node_to_cancel_to = null; 해버림
  PaintJSState.history_node_to_cancel_to = history_node_to_cancel_to;

  console.log("after pointup!");
  for (const selected_tool of PaintJSState.selected_tools) {
    selected_tool.cancel?.();
  }

  console.log("after tool.cancel!");
  if (!going_to_history_node) {
    go_to_history_node(PaintJSState.history_node_to_cancel_to, true);
  }

  PaintJSState.history_node_to_cancel_to = null;
  PaintJSState.cancel = false;
  update_helper_layer();
}