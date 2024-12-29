console.log('JS 실행:','OnCanvasObject.js')
// @ts-check
/* global $canvas_area, $status_position, $status_size, canvas_handles */
import $ from 'jquery'
import {  E } from "./helpers.js";
import {PaintJSState} from '../state';
// import $ from 'jquery'
// let{
// 	update_fill_and_stroke_colors_and_lineWidth ,
// 	$canvas_area,
// 	$canvas,
// 	canvas_bounding_client_rect,
// 	canvas_handles ,
// 	$status_position,
// 	$status_size ,
// }= PaintJSState;
function roundDPR(dpr) {
	const values = [0.25, 0.5, 1, 2, 4, 8, 16]; // 필요에 따라 확장 가능
	let closest = values[0];

	for (let i = 1; i < values.length; i++) {
		if (Math.abs(dpr - values[i]) < Math.abs(dpr - closest)) {
			closest = values[i];
		}
	}

	return closest;
}

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
		this.initwidth = width;
		this.initheight = height;
		this.hideMainCanvasHandles = hideMainCanvasHandles;
		this.$el = $(E("div")).addClass("on-canvas-object").appendTo(PaintJSState.$canvas_area);
		if (this.hideMainCanvasHandles) {
			PaintJSState.canvas_handles.hide();
		}
		$(window).on("resize theme-load", this._global_resize_handler = () => {
			this.position();
		});
	}
	position(updateStatus) {
		// Nevermind, canvas, isn't aligned to the right in RTL layout!
		// const direction = get_direction();
		// const left_for_ltr = direction === "rtl" ? "right" : "left";
		// const offset_left = parseFloat($canvas_area.css(`padding-${left_for_ltr}`));
		const offset_left = parseFloat(PaintJSState.$canvas_area.css("padding-left"));
		const offset_top = parseFloat(PaintJSState.$canvas_area.css("padding-top"));
		
	//	const dpr = window.devicePixelRatio;
	//	const targetDpr = roundDPR(dpr);
	//const div = targetDpr / dpr;
		const dprMagnification=PaintJSState.magnification;

		this.$el.css({
			position: "absolute",
			// [left_for_ltr]: magnification * (direction === "rtl" ? canvas.width - this.width - this.x : this.x) + offset_left,
			left: dprMagnification* this.x + offset_left,
			top: dprMagnification * this.y + offset_top,
			width: dprMagnification * this.width,
			height: dprMagnification * this.height,
		});
		if (updateStatus) {
			//PaintJSState.$status_position.text(`${this.x}, ${this.y}px`);
			//PaintJSState.$status_size.text(`${this.width} x ${this.height}px`);
		}
	}
	destroy() {
		this.$el.remove();
		if (this.hideMainCanvasHandles) {
			PaintJSState.canvas_handles.show();
		}
		$(window).off("resize theme-load", this._global_resize_handler);
	}
}

export { OnCanvasObject };

