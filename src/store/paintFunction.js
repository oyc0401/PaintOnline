import {menuState} from './menuState.svelte.js'
import {get_tool_by_id,select_tool} from '../paint/src/functions.js';
import {make_css_cursor} from '../paint/src/helpers.js';
import {PaintJSState} from '../paint/state.js';
export function changeTool(toolId, menuId) {
  console.log(toolId);

  menuState.toolMenuId = menuId;
  menuState.selectedTool = toolId;
  menuState.selectedTools[menuId] = toolId;

  const toolObj = get_tool_by_id(toolId);
  select_tool(toolObj);
  PaintJSState.$canvas.css({
    cursor: make_css_cursor(...toolObj.cursor),
  });
}



export const openMenu = (id) => {
  if (!menuState.showMenu) {
    menuState.showMenu = true;
  } else if (id == menuState.selectedMenuId) {
    closeMenu();
  }
  menuState.selectedMenuId = id;
  if (menuState.selectedTools[id]) {
    changeTool(menuState.selectedTools[id], id);
  }
};

export function closeMenu() {
  menuState.showMenu = false;
  menuState.selectedMenuId = menuState.toolMenuId;
}