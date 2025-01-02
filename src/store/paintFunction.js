import { menuState } from "./menuState.svelte.js";
import { get_tool_by_id, select_tool } from "../paint/src/functions.js";
import { make_css_cursor } from "../paint/src/helpers.js";
import { PaintJSState } from "../paint/state.js";

// 도구를 해당 메뉴의 클릭으로 바꾼다..?
export function changeTool(toolId, menuId) {
  console.log(toolId);

  menuState.toolMenuId = menuId;
  menuState.selectedTool = toolId;
  menuState.toolHistory[menuId] = toolId;

  const toolObj = get_tool_by_id(toolId);
  select_tool(toolObj);
  PaintJSState.$canvas.css({
    cursor: make_css_cursor(...toolObj.cursor),
  });
}

// 도구를 바꾸고 드롭다운을 닫는다.
export function quickChangeTool(toolId, menuId) {
  changeTool(toolId, menuId);
  closeDropdown();
}

export const clickMenu = (id) => {
  // 도구는 이미 눌려있는 상태에서 누르면 드롭다운이 열림
  if (menuState.dropdownId == id) {
    toggleDropdown();
  }
  menuState.dropdownId = id;

  // 메뉴를 누르면 이전에 선택했던 도구가 선택되어야 함
  if (menuState.toolHistory[id]) {
    changeTool(menuState.toolHistory[id], id);
  }
};

// 0, 2, 6
export const quickClickMenu = (id) => {
  // 메뉴와 색깔은 누르면 바로 드롭다운이 열림
  if (menuState.dropdownId == id) {
    toggleDropdown();
  }else{
    menuState.dropdownId = id;
    openDropdown();
  }

  // 메뉴를 누르면 이전에 선택했던 도구가 선택되어야 함
  if (menuState.toolHistory[id]) {
    changeTool(menuState.toolHistory[id], id);
  }
};

const toggleDropdown = () => {
  if (menuState.showDropdown) {
    closeDropdown();
  } else {
    openDropdown();
  }
};

export const openDropdown = () => {
  menuState.showDropdown = true;
};

export function closeDropdown() {
  menuState.showDropdown = false;
  menuState.dropdownId = menuState.toolMenuId;
}
