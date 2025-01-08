console.log('JS 실행:','OnCanvasObject.js')

import $ from 'jquery'
import {  E } from "./helpers.js";
import {PaintJSState} from '../state';

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
		const scale=PaintJSState.magnification;

		this.$el.css({
			position: "absolute",
			// [left_for_ltr]: magnification * (direction === "rtl" ? canvas.width - this.width - this.x : this.x) + offset_left,
			left: scale* this.x + offset_left,
			top: scale * this.y + offset_top,
			width: scale * this.width,
			height: scale * this.height,
		});
		if (updateStatus) {
			//PaintJSState.$status_position.text(`${this.x}, ${this.y}px`);
			//PaintJSState.$status_size.text(`${this.width} x ${this.height}px`);
		
				PaintJSState.position_mouse_active = true;
				PaintJSState.position_mouse_x = this.x
				PaintJSState.position_mouse_y = this.y

				PaintJSState.position_object_active = true;
				PaintJSState.position_object_x = this.width;
				PaintJSState.position_object_y = this.height;
			
			
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

