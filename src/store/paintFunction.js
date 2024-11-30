import {menuState} from './menuState.svelte.js'
import {get_tool_by_id,select_tool} from '../paint/src/functions.js';
import {make_css_cursor} from '../paint/src/helpers.js';

export function changeTool(toolId, menuId) {
  console.log(toolId);

  menuState.toolMenuId = menuId;
  menuState.selectedTool = toolId;
  menuState.selectedTools[menuId] = toolId;

  const toolObj = get_tool_by_id(toolId);
  select_tool(toolObj);
  window.globApp.$canvas.css({
    cursor: make_css_cursor(...toolObj.cursor),
  });
}
