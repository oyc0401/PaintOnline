import { get_tool_by_id } from "./src/functions.js";
import { TOOL_PENCIL } from "./src/tools.js";
import { make_canvas } from "./src/helpers.js";
import {make_history_node } from "./src/history.js";
import $ from "jquery";

export function defaultState() {
  const default_magnification = 1;

  /** @type {Tool} */
  const default_tool = get_tool_by_id(TOOL_PENCIL);

  const default_canvas_width = 330;
  const default_canvas_height = 450;

  let aliasing = true;
  let transparency = false;

  let magnification = default_magnification;
  let return_to_magnification = 4;

  /** @type {PixelCanvas} */
  const main_canvas = make_canvas(default_canvas_width, default_canvas_height);
  main_canvas.classList.add("main-canvas");

  /** @type {PixelContext} */
  const main_ctx = main_canvas.ctx;

  const $layer_area = $(".layer-area");

  /** @type {BrushShape} */
  const default_brush_shape = "circle";
  const default_brush_size = 4;
  const default_eraser_size = 8;
  const default_airbrush_size = 9;
  const default_pencil_size = 1;
  const default_stroke_size = 1; // applies to lines, curves, shape outlines

  /** @type {BrushShape} */
  let brush_shape = default_brush_shape;
  let brush_size = default_brush_size;
  let eraser_size = default_eraser_size;
  let airbrush_size = default_airbrush_size;
  let pencil_size = default_pencil_size;
  let stroke_size = default_stroke_size; // applies to lines, curves, shape outlines

  /** @type {boolean} */
  let tool_transparent_mode = false;

  /** @type {string | CanvasPattern} */
  let stroke_color;
  /** @type {string | CanvasPattern} */
  let fill_color;
  /** @type {ColorSelectionSlot} */
  let pick_color_slot = "background";

  /** @type {Tool} */
  let selected_tool = default_tool;

  let return_to_tool=selected_tool;

  /** @type {{foreground: string | CanvasPattern, background: string | CanvasPattern, ternary: string | CanvasPattern}} */
  let selected_colors = {
    foreground: "",
    background: "",
    ternary: "",
  };

  /** @type {OnCanvasSelection} */
  let selection; // singleton
  /** @type {OnCanvasHelperLayer} */
  let helper_layer; // instance used for the grid and tool previews (not a singleton)

  /** @type {OSGUI$Window} */
  let $thumbnail_window;
  /** @type {PixelCanvas} */
  let thumbnail_canvas;
  /** @type {boolean} */
  let show_thumbnail = false;
  /** @type {TextToolFontOptions} */
  let text_tool_font = {
    family: '"Arial"', // should be an exact value detected by Font Detective
    size: 12,
    line_scale: 20 / 12,
    bold: false,
    italic: false,
    underline: false,
    vertical: false,
    color: "",
    background: "",
  };

  /** @type {HistoryNode} */
  let root_history_node = make_history_node({
    name: "App Not Loaded Properly - Please send a bug report.",
  }); // will be replaced
  /** @type {HistoryNode} */
  let current_history_node = root_history_node;
  /** @type {HistoryNode | null} */
  let history_node_to_cancel_to = null;
  /** @type {HistoryNode[]} */
  let undos = [];
  /** @type {HistoryNode[]} */
  let redos = [];

  /** @type {string | undefined} */
  let file_name;
  /** @type {string | undefined} */
  let file_format;
  /** For saving over opened file on Save. Can be different type for File System Access API vs Electron.
   * @type {UserFileHandle} */
  let system_file_handle;
  /** @type {boolean} */
  let saved = true;

  /** works in canvas coordinates @type {{x: number, y: number} | undefined} */
  let pointer = { x: 0, y: 0 };
  /** works in canvas coordinates @type {{x: number, y: number} | undefined} */
  let pointer_start;
  /** works in canvas coordinates @type {{x: number, y: number} | undefined} */
  let pointer_previous;

  let pointerId;

  /** @type {boolean} */
  let pointer_active = false;
  /** @type {string | undefined} */
  let pointer_type;
  /** @type {number} */
  let pointer_buttons;

  /** works in canvas coordinates @type {{x: number, y: number} | undefined} */
  let pointer_float_previous = { x: 0, y: 0 };

  // let pointer_previous;
  /** @type {boolean} */
  let reverse;
  /** @type {boolean} */
  let ctrl;
  /** @type {boolean} */
  let shift;
  /** @type {number | undefined} */
  let button;
  /** @type {boolean} */
  let pointer_over_canvas = false;
  /** @type {boolean} */
  let update_helper_layer_on_pointermove_active = false;

  /** works in client coordinates, NOT canvas coordinates
   * @type {{ x: number, y: number, pointerId: number, pointerType: string, isPrimary: boolean }[]} */
  let pointers = [];

  let fill = false;
  let stroke = true;

  let pinchAllowed = false;

  let touchCount = 0;
  let first_pointer_time;
  const discard_quick_undo_period = 500;

  let position_mouse_active = false;
  let position_mouse_x;
  let position_mouse_y;
  let position_canvas_active = false;
  let position_canvas_x;
  let position_canvas_y;
  let position_object_active = false;
  let position_object_x;
  let position_object_y;

  let paint = {};
  let layerStore = {};
  let activeLayerId = 0;

  return {
    default_magnification,
    default_tool,
    default_canvas_width,
    default_canvas_height,
    aliasing,
    transparency,
    magnification,
    return_to_magnification,
    main_canvas,
    main_ctx,
    brush_shape,
    brush_size,
    eraser_size,
    airbrush_size,
    pencil_size,
    stroke_size,
    tool_transparent_mode,
    stroke_color,
    fill_color,
    pick_color_slot,
    selected_tool,
    return_to_tool,
    selected_colors,
    selection,
    helper_layer,
    $thumbnail_window,
    thumbnail_canvas,
    show_thumbnail,
    text_tool_font,
    root_history_node,
    current_history_node,
    history_node_to_cancel_to,
    undos,
    redos,
    file_name,
    file_format,
    system_file_handle,
    saved,
    pointer,
    pointer_start,
    pointer_previous,
    pointer_active,
    pointer_type,
    pointer_buttons,
    reverse,
    ctrl,
    shift,
    button,
    pointer_over_canvas,
    update_helper_layer_on_pointermove_active,
    pointers,
    pointer_float_previous,
    fill,
    stroke,
    pointerId,
    pinchAllowed,
    touchCount,
    first_pointer_time,
    discard_quick_undo_period,
    position_mouse_active,
    position_mouse_x,
    position_mouse_y,
    position_canvas_active,
    position_canvas_x,
    position_canvas_y,
    position_object_active,
    position_object_x,
    position_object_y,

    $layer_area,
    paint,
    layerStore,
    activeLayerId,

    //getSortedLayers
  };
}

export function defaultMobXState() {
  return {};
}
