
# JS Paint Todo
## TODO

선택영역에 마우스 누르고있으면 테두리 안보이게 하기
지우개 색깔 설정하는거 만들기
선두꼐 설정하는거 만들기
투명도 설정하는거 만들기
도형 내부 채우기 토글버튼
도형 테두리 만들기 토글버튼
올가미 배경 투명 토글버튼


배경투명모드 토글버튼





### 기능

일단 하단 상태바부터 완성하자

배경 투명모드 <- 이건 배경에 투명이 있으면 자동으로 설정되게 할까?



배경 투명모드 지우개 디폴드는 투명색
배경투명모드 설정되면 지우개 투명색으로 바꾸기
그거 빼고는 지우개 기존이랑 같음






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