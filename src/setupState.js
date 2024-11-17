

console.log('setup-appstate')

import { showMessageBox } from './paint/src/msgbox.js';
import { 
   are_you_sure,
   exit_fullscreen_if_ios,
   get_tool_by_id,
   make_history_node,
   show_error_message,
   cancel,
   change_url_param,
   clear,
   confirm_overwrite_capability,
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
   image_flip_and_rotate,
   image_invert_colors,
   image_stretch_and_skew,
   load_image_from_uri,
   make_or_update_undoable,
   open_from_file,
   paste,
   paste_image_from_file,
   redo,
   reset_canvas_and_history,
   reset_file,
   reset_selected_colors,
   resize_canvas_and_save_dimensions,
   resize_canvas_without_saving_dimensions,
   save_as_prompt,
   select_all,
   select_tool,
   select_tools,
   set_magnification,
   show_document_history,
   show_resource_load_error_message,
   undo,
   update_canvas_rect,
   update_disable_aa,
   update_helper_layer,
   update_magnified_canvas_size,
   view_bitmap,
   write_image_file,
   open_from_image_info,
   undoable,
   update_title
} from './paint/src/functions.js';

import { 
   make_canvas,
   $G,
   E,
   TAU,
   get_file_extension,
   get_help_folder_icon,
   to_canvas_coords,
   debounce,
   image_data_match
} from './paint/src/helpers.js';

import { TOOL_PENCIL, tools, TOOL_AIRBRUSH, TOOL_BRUSH, TOOL_CURVE, TOOL_ELLIPSE, TOOL_ERASER, TOOL_LINE, TOOL_POLYGON, TOOL_RECTANGLE, TOOL_ROUNDED_RECTANGLE, TOOL_SELECT } from './paint/src/tools.js';

import { default_palette, get_winter_palette } from './paint/src/color-data.js';
import { image_formats } from './paint/src/file-format-data.js';
import { init_webgl_stuff, rotate } from './paint/src/image-manipulation.js';
import { menus } from './paint/src/menus.js';
import { localStore } from './paint/src/storage.js';
import { Handles } from "./paint/src/Handles.js";

export const appState={};

export function setupState() {

  const default_magnification = 1;

  /** @type {Tool} */
  const default_tool = get_tool_by_id(TOOL_PENCIL);
  
  const default_canvas_width = 330;
  const default_canvas_height = 450;
  let my_canvas_width = default_canvas_width;
  let my_canvas_height = default_canvas_height;

  let aliasing = true;
  let transparency = false;

  let magnification = default_magnification;
  let return_to_magnification = 4;


  /** @type {PixelCanvas} */
  const main_canvas = make_canvas();
  main_canvas.classList.add("main-canvas");

  /** @type {PixelContext} */
  const main_ctx = main_canvas.ctx;

  /** @type {PixelCanvas} */
  const mask_canvas = make_canvas();
    mask_canvas.classList.add("mask-canvas");

  /** @type {PixelContext} */
  const mask_ctx = main_canvas.ctx;
  


  /** @type {(string | CanvasPattern)[]} */
  let palette = default_palette;
  /** @type {(string | CanvasPattern)[]} */
  let polychrome_palette = palette;

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
  let root_history_node = make_history_node({ name: "App Not Loaded Properly - Please send a bug report." }); // will be replaced
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
  state.default_magnification  = default_magnification ;
  state.default_tool = default_tool;
  state.default_canvas_width = default_canvas_width;
  state.default_canvas_height = default_canvas_height;
  state.my_canvas_width = my_canvas_width;
  state.my_canvas_height = my_canvas_height;
  state.aliasing = aliasing;
  state.transparency = transparency;
  state.magnification = magnification;
  state.return_to_magnification = return_to_magnification;
  state.main_canvas = main_canvas;
  state.main_ctx = main_ctx;
  state.palette = palette;
  state.polychrome_palette = polychrome_palette;
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
  state.mask_canvas = mask_canvas;
  state.mask_ctx = mask_ctx;


  window.globAppstate={};

  Object.keys(state).forEach(key => {
      window['globAppstate'][key] = state[key];
  });

}