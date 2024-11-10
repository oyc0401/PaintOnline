console.log('JS 실행:','app-state.js')
// @ts-check
/* exported $thumbnail_window, airbrush_size, aliasing, brush_shape, brush_size, button, ctrl, current_history_node, enable_fs_access_api, enable_palette_loading_from_indexed_images, eraser_size, file_format, file_name, fill_color, helper_layer, history_node_to_cancel_to, magnification, main_ctx, monochrome, monochrome_palette, my_canvas_height, my_canvas_width, palette, pencil_size, pick_color_slot, pointer, pointer_active, pointer_buttons, pointer_over_canvas, pointer_previous, pointer_start, pointer_type, pointers, polychrome_palette, redos, return_to_magnification, return_to_tools, reverse, root_history_node, saved, selected_colors, selected_tool, selected_tools, selection, shift, show_grid, show_thumbnail, stroke_color, stroke_size, system_file_handle, text_tool_font, textbox, thumbnail_canvas, tool_transparent_mode, transparency, undos, update_helper_layer_on_pointermove_active */

// Can't import things until this file is a module...
// (Well, could use dynamic imports, but that's async and thus probably as complicated as getting it to work with all ESM.)
// import { default_palette } from "./color-data.js";
// import { get_tool_by_id, make_monochrome_palette, make_history_node } from "./functions.js";
// import { make_canvas } from "./helpers.js";
// import { TOOL_PENCIL } from "./tools.js";

// Causes TypeScript errors
// const { get_tool_by_id, make_monochrome_palette, make_history_node, default_palette, make_canvas, TOOL_PENCIL } = window;


const default_magnification = 1;

/** @type {Tool} */
const default_tool = window.get_tool_by_id(window.TOOL_PENCIL);

const default_canvas_width = 683;
const default_canvas_height = 384;
let my_canvas_width = default_canvas_width;
let my_canvas_height = default_canvas_height;

let aliasing = true;
let transparency = false;
let monochrome = false;

let magnification = default_magnification;
let return_to_magnification = 4;

/** @type {PixelCanvas} */
const main_canvas = window.make_canvas();
main_canvas.classList.add("main-canvas");

/** @type {PixelContext} */
const main_ctx = main_canvas.ctx;

/** @type {(string | CanvasPattern)[]} */
let palette = window.default_palette;
/** @type {(string | CanvasPattern)[]} */
let polychrome_palette = palette;
/** @type {(string | CanvasPattern)[]} */
let monochrome_palette = window.make_monochrome_palette();

// This feature is not ready yet.
// It needs to let the user decide when to switch the palette or not, when saving/opening an image.
// (maybe there could be a palette undo button? feels weird. MS Paint would probably use a dialog.)
// And it needs to handle canvas farbling, where pixel values are slightly different from each other,
// and equivalize them, when saving to a file. And maybe at other times.
// There are a lot of places in this app where I have to handle canvas farbling. It's obnoxious.
let enable_palette_loading_from_indexed_images = false;

// The File System Access API doesn't provide a way to get the file type selected by the user,
// or to automatically append a file extension to the file name.
// I'm not sure it's worth it to be able to save over an existing file.
// I also like the downloads bar UI to be honest.
// So this might need to be optional, but right now I'm disabling it as it's not ready.
// There are cases where 0-byte files are created, which is either a serious problem,
// it's just from canceling saving when the file name has a problem, and it needs to be cleaned up.
// Also, while I've implemented most of the UI, it'd be nice to release this with recent files support.
let enable_fs_access_api = false;

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
/** @type {Tool[]} */
let selected_tools = [selected_tool];

/** @type {Tool[]} */
let return_to_tools = [selected_tool];

/** @type {{foreground: string | CanvasPattern, background: string | CanvasPattern, ternary: string | CanvasPattern}} */
let selected_colors = {
	foreground: "",
	background: "",
	ternary: "",
};

/** @type {OnCanvasSelection} */
let selection; // singleton
/** @type {OnCanvasTextBox} */
let textbox; // singleton
/** @type {OnCanvasHelperLayer} */
let helper_layer; // instance used for the grid and tool previews (not a singleton)
/** @type {OSGUI$Window} */
let $thumbnail_window;
/** @type {PixelCanvas} */
let thumbnail_canvas;
/** @type {boolean} */
let show_grid = false;
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
let root_history_node = window.make_history_node({ name: "App Not Loaded Properly - Please send a bug report." }); // will be replaced
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
let pointer;
/** works in canvas coordinates @type {{x: number, y: number} | undefined} */
let pointer_start;
/** works in canvas coordinates @type {{x: number, y: number} | undefined} */
let pointer_previous;

/** @type {boolean} */
let pointer_active = false;
/** @type {string | undefined} */
let pointer_type;
/** @type {number} */
let pointer_buttons;
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


const state = {};

state.my_canvas_width = my_canvas_width;
state.my_canvas_height = my_canvas_height;
state.aliasing = aliasing;
state.transparency = transparency;
state.monochrome = monochrome;
state.magnification = magnification;
state.return_to_magnification = return_to_magnification;
state.main_canvas = main_canvas;
state.main_ctx = main_ctx;
state.palette = palette;
state.polychrome_palette = polychrome_palette;
state.monochrome_palette = monochrome_palette;
state.enable_palette_loading_from_indexed_images = enable_palette_loading_from_indexed_images;
state.enable_fs_access_api = enable_fs_access_api;
state.brush_shape = brush_shape;
state.brush_size = brush_size;
state.eraser_size = eraser_size;
state.airbrush_size = airbrush_size;
state.pencil_size = pencil_size;
state.stroke_size = stroke_size;
state.tool_transparent_mode = tool_transparent_mode;
state.stroke_color = stroke_color;
state.fill_color = fill_color;
state.pick_color_slot = pick_color_slot;
state.selected_tool = selected_tool;
state.selected_tools = selected_tools;
state.return_to_tools = return_to_tools;
state.selected_colors = selected_colors;
state.selection = selection;
state.textbox = textbox;
state.helper_layer = helper_layer;
state.$thumbnail_window = $thumbnail_window;
state.thumbnail_canvas = thumbnail_canvas;
state.show_grid = show_grid;
state.show_thumbnail = show_thumbnail;
state.text_tool_font = text_tool_font;
state.root_history_node = root_history_node;
state.current_history_node = current_history_node;
state.history_node_to_cancel_to = history_node_to_cancel_to;
state.undos = undos;
state.redos = redos;
state.file_name = file_name;
state.file_format = file_format;
state.system_file_handle = system_file_handle;
state.saved = saved;
state.pointer = pointer;
state.pointer_start = pointer_start;
state.pointer_previous = pointer_previous;
state.pointer_active = pointer_active;
state.pointer_type = pointer_type;
state.pointer_buttons = pointer_buttons;
state.reverse = reverse;
state.ctrl = ctrl;
state.shift = shift;
state.button = button;
state.pointer_over_canvas = pointer_over_canvas;
state.update_helper_layer_on_pointermove_active = update_helper_layer_on_pointermove_active;
state.pointers = pointers;

Object.keys(state).forEach(key => {
		window[key] = state[key];
});

export {state};