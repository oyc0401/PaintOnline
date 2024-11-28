import {menuState} from './menuState.svelte.js'
import {get_tool_by_id} from '../paint/src/functions.js'
export function changeTool(toolId, menuId) {
  console.log(toolId);

  menuState.toolMenuId = menuId;
  menuState.selectedTool = toolId;
  menuState.selectedTools[menuId] = toolId;

  const toolObj = window.svelteApp.get_tool_by_id(toolId);
  window.svelteApp.select_tool(toolObj);
  window.globApp.$canvas.css({
    cursor: window.svelteApp.make_css_cursor(...toolObj.cursor),
  });
}
