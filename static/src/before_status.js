console.log('before_status.js!')
import {showMessageBox} from'./msgbox.js';
// Note `defaultMessageBoxTitle` handling in make_iframe_window (or now function enhance_iframe) in 98.js.org
// https://github.com/1j01/98/blob/361bd759a6d9b71d0fad9e479840598dc0128bb6/src/iframe-windows.js#L111
// Any other default parameters need to be handled there (as it works now)

window.defaultMessageBoxTitle = localize("Paint");

// Temporary globals until all dependent code is converted to ES Modules
window.showMessageBox = showMessageBox; // used by app-localization.js

import { are_you_sure,
 exit_fullscreen_if_ios, 
   get_tool_by_id,  make_history_node, 
  show_error_message, 
 
  
} from './functions.js';
// Temporary globals until all dependent code is converted to ES Modules
window.make_history_node = make_history_node; // used by app-state.js
window.are_you_sure = are_you_sure; // used by app-localization.js, electron-injected.js
window.show_error_message = show_error_message; // used by app-localization.js, electron-injected.js
window.exit_fullscreen_if_ios = exit_fullscreen_if_ios; // used by app-localization.js
window.get_tool_by_id = get_tool_by_id; // used by app-state.js

import { $G, make_canvas } from './helpers.js';
// Temporary globals until all dependent code is converted to ES Modules
window.$G = $G; // used by app-localization.js
window.make_canvas = make_canvas; // used by app-state.js



import { TOOL_PENCIL, tools } from './tools.js';
// Temporary globals until all dependent code is converted to ES Modules
window.TOOL_PENCIL = TOOL_PENCIL; // used by app-state.js
window.tools = tools;


  import {default_palette} from './color-data.js';
// Temporary globals until all dependent code is converted to ES Modules
window.default_palette = default_palette; // used by app-state.js