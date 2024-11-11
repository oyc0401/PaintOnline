import $ from 'jquery';

export function setupApp() {
  const $app =  $('.jspaint')[0];
  window.$app = $app;

  const $V =  $('.vertical')[0];
  const $H =  $('.horizontal')[0];

  const $canvas_area =  $('.canvas-area')[0];
  window.$canvas_area = $canvas_area;

  const $canvas = $(main_canvas).appendTo($canvas_area);
  window.$canvas = $canvas;
  $canvas.css("touch-action", "none");
  window.canvas_bounding_client_rect = window.main_canvas.getBoundingClientRect(); // cached for performance, updated later
  const canvas_handles = new Handles({
    $handles_container: $canvas_area,
    $object_container: $canvas_area,
    get_rect: () => ({
      x: 0,
      y: 0,
      width: window.main_canvas.width,
      height: window.main_canvas.height,
    }),
    set_rect: ({ width, height }) =>
      resize_canvas_and_save_dimensions(width, height),
    outset: 4,
    get_handles_offset_left: () =>
      parseFloat($canvas_area.css("padding-left")) + 1,
    get_handles_offset_top: () => parseFloat($canvas_area.css("padding-top")) + 1,
    get_ghost_offset_left: () => parseFloat($canvas_area.css("padding-left")) + 1,
    get_ghost_offset_top: () => parseFloat($canvas_area.css("padding-top")) + 1,
    size_only: true,
  });
  window.canvas_handles = canvas_handles;
  
}