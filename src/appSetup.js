import $ from 'jquery';

export function setupApp() {
  const $app =  $('.jspaint')[0];
  window.$app = $app;

  const $V =  $('.vertical')[0];
  const $H =  $('.horizontal')[0];

  const $canvas_area =  $('.canvas-area')[0];
  window.$canvas_area = $canvas_area;

  const $canvas = $(window.main_canvas);
  window.$canvas = $canvas;
  $canvas.css("touch-action", "none");
  
  window.canvas_bounding_client_rect = window.main_canvas.getBoundingClientRect(); // cached for performance, updated later

  
}