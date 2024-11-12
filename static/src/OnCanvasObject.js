console.log('JS 실행:','OnCanvasObject.js')
// @ts-check
/* global $canvas_area, $status_position, $status_size, canvas_handles */
import { $G, E } from "./helpers.js";
// import $ from 'jquery'
// let{
// 	update_fill_and_stroke_colors_and_lineWidth ,
// 	$canvas_area,
// 	$canvas,
// 	canvas_bounding_client_rect,
// 	canvas_handles ,
// 	$status_position,
// 	$status_size ,
// }= window.globApp;

class OnCanvasObject {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} width
	 * @param {number} height
	 * @param {boolean} hideMainCanvasHandles
	 */
	constructor(x, y, width, height, hideMainCanvasHandles) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.hideMainCanvasHandles = hideMainCanvasHandles;
		this.$el = $(E("div")).addClass("on-canvas-object").appendTo(window.globApp.$canvas_area);
		if (this.hideMainCanvasHandles) {
			window.globApp.canvas_handles.hide();
		}
		$G.on("resize theme-load", this._global_resize_handler = () => {
			this.position();
		});
	}
	position(updateStatus) {
		// Nevermind, canvas, isn't aligned to the right in RTL layout!
		// const direction = get_direction();
		// const left_for_ltr = direction === "rtl" ? "right" : "left";
		// const offset_left = parseFloat($canvas_area.css(`padding-${left_for_ltr}`));
		const offset_left = parseFloat(window.globApp.$canvas_area.css("padding-left"));
		const offset_top = parseFloat(window.globApp.$canvas_area.css("padding-top"));
		this.$el.css({
			position: "absolute",
			// [left_for_ltr]: magnification * (direction === "rtl" ? canvas.width - this.width - this.x : this.x) + offset_left,
			left: window.globAppstate.magnification * this.x + offset_left,
			top: window.globAppstate.magnification * this.y + offset_top,
			width: window.globAppstate.magnification * this.width,
			height: window.globAppstate.magnification * this.height,
		});
		if (updateStatus) {
			window.globApp.$status_position.text(`${this.x}, ${this.y}px`);
			window.globApp.$status_size.text(`${this.width} x ${this.height}px`);
		}
	}
	destroy() {
		this.$el.remove();
		if (this.hideMainCanvasHandles) {
			window.globApp.canvas_handles.show();
		}
		$G.off("resize theme-load", this._global_resize_handler);
	}
}

export { OnCanvasObject };

