export const menuState = $state({
  showDropdown: false,
  dropdownId: 3, // 열려있는 드롭다운
  toolMenuId: 3, // 선택된 도구를 포함하는 메뉴 id, 연필에서 색깔 바꾸면 다시 연필로 돌아가야하니깐
  selectedTool: "TOOL_PENCIL",
  toolHistory: {
    1: "TOOL_SELECT",
    2: "TOOL_PENCIL",
    3: "TOOL_PENCIL",
    4: "TOOL_RECTANGLE",
    5: "TOOL_ERASER",
  }, // 해당 메뉴에서 이전에 선택했던 도구
  lineWidth: { TOOL_PENCIL: 1, TOOL_BRUSH: 3 }, // 도구의 펜 두께
  foregroundColor: "rgb(0,0,0)",
  backgroundColor: "rgb(255,255,255)",
  selectedColor: 0, // 0: foreground, 1: background
  colorHistory: [],
  transparentBackground: false,
  undoLength: 0,
  redoLength: 0,
  /* ... */


  position_mouse_active:false,
  position_mouse: { x: 0, y: 0 },
  position_canvas_active:false,
  position_canvas: { x: 0, y: 0 },
  position_object_active:false,
  position_object: { x: 0, y: 0 },

  layers:[],
  activeLayerId:'',

  showLayerMenu:false,
  
});

