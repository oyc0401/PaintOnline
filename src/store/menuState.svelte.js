export const menuState = $state({
  showMenu:false,
  selectedMenuId:2,
  toolMenuId:1, // 연필에서 색깔 바꾸면 다시 연필로 돌아가야하니깐
  selectedTool:'TOOL_PENCIL',
  selectedTools: {1: 'TOOL_SELECT', 2:'TOOL_PENCIL', 3:'TOOL_BRUSH', 4: 'TOOL_RECTANGLE' }, // 메뉴 클릭하면 이전에 선택한 도구
  menuPosition: {x:0, y:0},
  
  
  /* ... */
});
