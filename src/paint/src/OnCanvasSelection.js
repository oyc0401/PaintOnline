console.log("JS 실행:", "OnCanvasSelection.js");
// @ts-check
/* global $canvas_area, $status_position, $status_size, main_canvas, PaintJSState.main_ctx, PaintJSState.selected_colors, tool_transparent_mode, transparency */
import { Handles } from "./Handles.js";
import { OnCanvasObject } from "./OnCanvasObject.js";
import {
	get_tool_by_id,
	make_or_update_undoable,
	undoable,
	update_helper_layer,
} from "./functions.js";
import {
	get_icon_for_tool,
	get_rgba_from_color,
	make_canvas,
	make_css_cursor,
	to_canvas_coords,
} from "./helpers.js";
import { replace_colors_with_swatch } from "./image-manipulation.js";
import { TOOL_SELECT } from "./tools.js";
import $ from "jquery";
import { PaintJSState } from "../state";

class OnCanvasSelection extends OnCanvasObject {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} width
	 * @param {number} height
	 * @param {HTMLImageElement | HTMLCanvasElement | ImageData=} image_source
	 */
	constructor(x, y, width, height, image_source) {
		super(x, y, width, height, true);

		this.$el.addClass("selection");
		this.instantiate(image_source);
	}
	position() {
		super.position(true);
		update_helper_layer(); // @TODO: under-grid specific helper layer?
	}
	/**
	 * @param {HTMLImageElement | HTMLCanvasElement | ImageData=} image_source
	 */
	instantiate(image_source) {
		this.$el.css({
			cursor: make_css_cursor("move", [8, 8], "move"),
			touchAction: "none",
		});
		this.position();

		const instantiate = () => {
			if (image_source) {
				// (this applies when pasting a selection)
				// NOTE: need to create a Canvas because something about imgs makes dragging not work with magnification
				// (width vs naturalWidth?)
				// and at least apply_image_transformation needs it to be a canvas now (and the property name says canvas anyways)
				this.source_canvas = make_canvas(image_source);
				// @TODO: is this width/height code needed? probably not! wouldn't it clear the canvas anyways?
				// but maybe we should assert in some way that the widths are the same, or resize the selection?
				if (this.source_canvas.width !== this.width) {
					console.error("선택한 영역의 width가 이상함");
				}
				if (this.source_canvas.height !== this.height) {
					console.error("선택한 영역의 height 이상함");
				}
				this.canvas = make_canvas(this.source_canvas);
			} else {
				this.source_canvas = make_canvas(this.width, this.height);
				this.source_canvas.ctx.drawImage(
					PaintJSState.main_canvas,
					this.x,
					this.y,
					this.width,
					this.height,
					0,
					0,
					this.width,
					this.height,
				);
				this.canvas = make_canvas(this.source_canvas);
				this.cut_out_background();
			}

			this.$el.append(this.canvas);
			this.handles = new Handles({
				$handles_container: this.$el,
				$object_container: PaintJSState.$canvas_area,
				outset: 2,
				get_rect: () => ({
					x: this.x,
					y: this.y,
					width: this.width,
					height: this.height,
				}),
				set_rect: ({ x, y, width, height }) => {
					undoable(
						{
							name: "Resize Selection",
							icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
							soft: true,
						},
						() => {
							this.x = x;
							this.y = y;
							this.width = width;
							this.height = height;
							this.position();
							this.resize();
						},
					);
				},
				get_ghost_offset_left: () =>
					parseFloat(PaintJSState.$canvas_area.css("padding-left")) + 1,
				get_ghost_offset_top: () =>
					parseFloat(PaintJSState.$canvas_area.css("padding-top")) + 1,
			});
			let mox, moy;
			const pointermove = (e) => {
				make_or_update_undoable(
					{
						// XXX: Localization hazard: logic based on English action names
						match: (history_node) =>
							(e.shiftKey &&
								/^(Smear|Stamp|Move) Selection$/.test(history_node.name)) ||
							(!e.shiftKey && /^Move Selection$/.test(history_node.name)),
						name: e.shiftKey ? "Smear Selection" : "Move Selection",
						update_name: true,
						icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
						soft: true,
					},
					() => {
						const m = to_canvas_coords(e);
						this.x = Math.max(
							Math.min(m.x - mox, PaintJSState.main_canvas.width),
							-this.width,
						);
						this.y = Math.max(
							Math.min(m.y - moy, PaintJSState.main_canvas.height),
							-this.height,
						);
						this.position();
						if (e.shiftKey) {
							// Smear selection
							this.draw();
						}
					},
				);
			};
			this.canvas_pointerdown = (e) => {
				e.preventDefault();
				// 핀지줌을 할때 선택이 안되게 하기
				if (PaintJSState.pinchAllowed) {
					return;
				}
				const rect = this.canvas.getBoundingClientRect();
				const cx = e.clientX - rect.left;
				const cy = e.clientY - rect.top;
				mox = ~~((cx / rect.width) * this.canvas.width);
				moy = ~~((cy / rect.height) * this.canvas.height);
				$(window).on("pointermove", pointermove);
				this.dragging = true;
				update_helper_layer(); // for thumbnail, which draws textbox outline if it's not being dragged
				$(window).one("pointerup", () => {
					$(window).off("pointermove", pointermove);
					this.dragging = false;
					update_helper_layer(); // for thumbnail, which draws selection outline if it's not being dragged
				});
				if (e.shiftKey) {
					// Stamp or start to smear selection
					undoable(
						{
							name: "Stamp Selection",
							icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
							soft: true,
						},
						() => {
							this.draw();
						},
					);
				} else if (e.ctrlKey) {
					// @TODO: how should this work for macOS? where ctrl+click = secondary click?
					// Stamp selection
					undoable(
						{
							name: "Stamp Selection",
							icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
							soft: true,
						},
						() => {
							this.draw();
						},
					);
				}
			};
			$(this.canvas).on("pointerdown", this.canvas_pointerdown);
			PaintJSState.$canvas_area.trigger("resize"); // could use "update" event instead if this is just to hide the main canvas handles
			// $status_position.text("");
			// $status_size.text("");
			//PaintJSState.position_mouse_active = false;
			//PaintJSState.position_object_active = false;
		};

		instantiate();
	}
	cut_out_background() {
		const cutout = this.canvas;
		// doc/this or canvas/cutout, either of those pairs would result in variable names of equal length which is nice :)
		const canvasImageData = PaintJSState.main_ctx.getImageData(
			this.x,
			this.y,
			this.width,
			this.height,
		);
		const cutoutImageData = cutout.ctx.getImageData(
			0,
			0,
			this.width,
			this.height,
		);

		const colored_cutout = make_canvas(cutout);
		replace_colors_with_swatch(
			colored_cutout.ctx,
			PaintJSState.selected_colors.background,
			this.x,
			this.y,
		);

		for (let i = 0; i < cutoutImageData.data.length; i += 4) {
			const in_cutout = cutoutImageData.data[i + 3] > 0;
			if (in_cutout) {
				cutoutImageData.data[i + 0] = canvasImageData.data[i + 0];
				cutoutImageData.data[i + 1] = canvasImageData.data[i + 1];
				cutoutImageData.data[i + 2] = canvasImageData.data[i + 2];
				cutoutImageData.data[i + 3] = canvasImageData.data[i + 3];

				canvasImageData.data[i + 0] = 0;
				canvasImageData.data[i + 1] = 0;
				canvasImageData.data[i + 2] = 0;
				canvasImageData.data[i + 3] = 0;
			} else {
				cutoutImageData.data[i + 0] = 0;
				cutoutImageData.data[i + 1] = 0;
				cutoutImageData.data[i + 2] = 0;
				cutoutImageData.data[i + 3] = 0;
			}
		}
		PaintJSState.main_ctx.putImageData(canvasImageData, this.x, this.y);
		cutout.ctx.putImageData(cutoutImageData, 0, 0);

		$(window).triggerHandler("session-update"); // autosave
		update_helper_layer();
	}

	// @TODO: should Image > Invert apply to this.source_canvas or to this.canvas (replacing this.source_canvas with the result)?
	/**
	 * @param {PixelCanvas} new_source_canvas
	 */
	replace_source_canvas(new_source_canvas) {
		this.source_canvas = new_source_canvas;
		const new_canvas = make_canvas(new_source_canvas);
		$(this.canvas).replaceWith(new_canvas);
		this.canvas = new_canvas;
		const center_x = this.x + this.width / 2;
		const center_y = this.y + this.height / 2;
		const new_width = new_canvas.width;
		const new_height = new_canvas.height;
		// NOTE: flooring the coordinates to integers avoids blurring
		// but it introduces "inching", where the selection can move along by pixels if you rotate it repeatedly
		// could introduce an "error offset" just to avoid this but that seems overkill
		// and then that would be weird hidden behavior, probably not worth it
		// Math.round() might make it do it on fewer occasions(?),
		// but then it goes down *and* to the right, 2 directions vs One Direction
		// and Math.ceil() is the worst of both worlds
		this.x = ~~(center_x - new_width / 2);
		this.y = ~~(center_y - new_height / 2);
		this.width = new_width;
		this.height = new_height;
		this.position();
		$(this.canvas).on("pointerdown", this.canvas_pointerdown);
		this.$el.triggerHandler("resize"); //?
	}
	resize() {
		const new_source_canvas = make_canvas(this.width, this.height);
		new_source_canvas.ctx.drawImage(
			this.source_canvas,
			0,
			0,
			this.width,
			this.height,
		);
		this.replace_source_canvas(new_source_canvas);
	}
	scale(factor) {
		const new_width = Math.max(1, this.width * factor);
		const new_height = Math.max(1, this.height * factor);
		const new_source_canvas = make_canvas(new_width, new_height);
		new_source_canvas.ctx.drawImage(
			this.source_canvas,
			0,
			0,
			new_source_canvas.width,
			new_source_canvas.height,
		);
		this.replace_source_canvas(new_source_canvas);
	}
	draw() {
		try {
			PaintJSState.main_ctx.drawImage(this.canvas, this.x, this.y);
		} catch (_error) {
			// ignore
		}
	}
	destroy() {
		super.destroy();
		update_helper_layer(); // @TODO: under-grid specific helper layer?
	}
}

export { OnCanvasSelection };
