console.log('before_status.js!')
import {showMessageBox} from'./msgbox.js';
// Note `defaultMessageBoxTitle` handling in make_iframe_window (or now function enhance_iframe) in 98.js.org
// https://github.com/1j01/98/blob/361bd759a6d9b71d0fad9e479840598dc0128bb6/src/iframe-windows.js#L111
// Any other default parameters need to be handled there (as it works now)

window.defaultMessageBoxTitle = localize("Paint");

// Temporary globals until all dependent code is converted to ES Modules
window.showMessageBox = showMessageBox; // used by app-localization.js

import {
  $this_version_news,
  apply_file_format_and_palette_info, are_you_sure, cancel, change_some_url_params, change_url_param, choose_file_to_paste, cleanup_bitmap_view, clear, confirm_overwrite_capability, delete_selection, deselect,
  edit_copy, edit_cut, edit_paste, exit_fullscreen_if_ios, file_new, file_open, file_print, file_save,
  file_save_as, getSelectionText, get_all_url_params, get_history_ancestors, get_tool_by_id, get_uris, get_url_param, go_to_history_node, handle_keyshortcuts, has_any_transparency, image_attributes, image_flip_and_rotate, image_invert_colors, image_stretch_and_skew, load_image_from_uri, load_theme_from_text, make_history_node,  make_opaque, make_or_update_undoable, make_stripe_pattern, meld_selection_into_canvas,
  open_from_file, open_from_image_info, paste, paste_image_from_file, please_enter_a_number, read_image_file, redo, render_canvas_view, reset_canvas_and_history, reset_file, reset_selected_colors, resize_canvas_and_save_dimensions, resize_canvas_without_saving_dimensions, sanity_check_blob, save_as_prompt, save_selection_to_file, select_all, select_tool, select_tools, set_all_url_params, set_magnification, show_about_paint, show_convert_to_black_and_white, show_document_history, show_error_message, show_file_format_errors, show_multi_user_setup_dialog, show_resource_load_error_message, switch_to_polychrome_palette,
  try_exec_command, undo, undoable, update_canvas_rect, update_css_classes_for_conditional_messages, update_disable_aa, update_from_saved_file, update_helper_layer,
  update_helper_layer_immediately, update_magnified_canvas_size, update_title, view_bitmap, write_image_file
} from './functions.js';
// Temporary globals until all dependent code is converted to ES Modules
window.make_history_node = make_history_node; // used by app-state.js
window.open_from_file = open_from_file; // used by electron-injected.js
window.are_you_sure = are_you_sure; // used by app-localization.js, electron-injected.js
window.show_error_message = show_error_message; // used by app-localization.js, electron-injected.js
window.show_about_paint = show_about_paint; // used by electron-injected.js
window.exit_fullscreen_if_ios = exit_fullscreen_if_ios; // used by app-localization.js
window.get_tool_by_id = get_tool_by_id; // used by app-state.js
window.sanity_check_blob = sanity_check_blob; // used by electron-injected.js

import { $G, make_canvas } from './helpers.js';
// Temporary globals until all dependent code is converted to ES Modules
window.$G = $G; // used by app-localization.js
window.make_canvas = make_canvas; // used by app-state.js



import { TOOL_PENCIL, tools } from './tools.js';
// Temporary globals until all dependent code is converted to ES Modules
window.TOOL_PENCIL = TOOL_PENCIL; // used by app-state.js
window.tools = tools;


  import {
  basic_colors, custom_colors, default_palette, get_winter_palette
} from './color-data.js';
// Temporary globals until all dependent code is converted to ES Modules
window.default_palette = default_palette; // used by app-state.js