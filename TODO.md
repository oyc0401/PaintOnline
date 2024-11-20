
# JS Paint Todo
## TODO
일단 지우개 색설정 가능하게 하고

선택영역에 마우스 누르고있으면 테두리 안보이게 하기
지우개 색깔 설정하는거 만들기
선두꼐 설정하는거 만들기
투명도 설정하는거 만들기
도형 내부 채우기 토글버튼
도형 테두리 만들기 토글버튼
올가미 배경 투명 토글버튼


배경투명모드 토글버튼





### 기능
시작할때 배경에 투명도있는 색 있으면 투명모드 ON and 지우개 투명색 설정
투명모드 => 지우개 무조건 투명색!
투명모드일 때 지우개 투명도있는색 골라도 지우개는 투명색이지만 테두리, 투명올가미는 반영됌
투명모드일때는 캔버스 확장할 때 배경 투명색으로하기

!투명모드 && 지우개투명도 => 지우개 투명도있게
!투명모드 && 지우개투명도 => 캔버스확장, 올가미 빈부분 지우개색으로 채움

일단 하단 상태바부터 완성하자




## 계획
일단 UHD, 4K 최적화는 나중에 하자.
지금 2d context로 할 수 있는건 거의 다했고 더한다해도 나중에 webgl을 사용할거라 낭비임
일단 코드최적화 해놓고 DI까지 해놓은 다음에 구조바꿀생각을 하자
지금은 일단 완성도부터 챙겨보자
완성도 챙기다가 더 나올 아이디어도 있으니 그거 다 알고나서  webgl 적용시킬 생각 해야함






### 의존성 확인
let {
  default_magnification,
  default_tool,
  default_canvas_width,
  default_canvas_height,
  my_canvas_width,
  my_canvas_height,
  aliasing,
  transparency,
  magnification,
  return_to_magnification,
  main_canvas,
  main_ctx,
  palette,
  polychrome_palette,
  enable_palette_loading_from_indexed_images,
  enable_fs_access_api,
  brush_shape,
  brush_size,
  eraser_size,
  airbrush_size,
  pencil_size,
  stroke_size,
  tool_transparent_mode,
  stroke_color,
  fill_color,
  pick_color_slot,
  selected_tool,
  selected_tools,
  return_to_tools,
  selected_colors,
  selection,
  helper_layer,
  $thumbnail_window,
  thumbnail_canvas,
  show_grid,
  show_thumbnail,
  text_tool_font,
  root_history_node,
  current_history_node,
  history_node_to_cancel_to,
  undos,
  redos,
  file_name,
  file_format,
  system_file_handle,
  saved,
  pointer,
  pointer_start,
  pointer_previous,
  pointer_active,
  pointer_type,
  pointer_buttons,
  reverse,
  ctrl,
  shift,
  button,
  pointer_over_canvas,
  update_helper_layer_on_pointermove_active,
  pointers
} = window.globAppstate;

let {
  $app,
  update_fill_and_stroke_colors_and_lineWidth,
  $canvas_area,
  $canvas,
  canvas_bounding_client_rect,
  canvas_handles,
  $status_position,
  $status_size
} = window.globApp;