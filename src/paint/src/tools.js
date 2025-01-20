console.log("JS 실행:", "tools.js");
// @ts-check
/* global selection:writable, PaintJSState.stroke_size:writable, textbox:writable */
/* global PaintJSState.$canvas, PaintJSState.$canvas_area, $status_size, airbrush_size, brush_shape, brush_size, button, canvas_handles, ctrl, eraser_size, fill_color, pick_color_slot, get_language, localize, magnification, PaintJSState.main_canvas, PaintJSState.main_ctx, pencil_size, pointer, PaintJSState.pointer_active, PaintJSState.pointer_over_canvas, pointer_previous, PaintJSState.pointer_start, return_to_magnification, selected_colors, shift, PaintJSState.stroke_color, transparency */
import { OnCanvasSelection } from "./OnCanvasSelection.js";
// import { get_language, localize } from "./app-localization.js";
import { localize, get_language } from "../../localize/localize.js";
import {
	deselect,
	get_tool_by_id,
	meld_selection_into_canvas,
	set_magnification,
	show_error_message,
	update_helper_layer,
} from "./functions.js";
import { undoable } from "./history.js";
import { PaintJSState } from "../state";
import {
	get_icon_for_tool,
	get_icon_for_tools,
	get_rgba_from_color,
	make_canvas,
	make_css_cursor,
	drawcopy,
} from "./helpers.js";

import {
	bresenham_dense_line,
	bresenham_line,
	copy_contents_within_polygon,
	draw_bezier_curve,
	draw_ellipse,
	draw_fill,
	draw_line,
	draw_line_strip,
	draw_noncontiguous_fill,
	draw_polygon,
	draw_quadratic_curve,
	draw_rounded_rectangle,
	draw_selection_box,
	get_circumference_points_for_brush,
	replace_colors_with_swatch,
	stamp_brush_canvas,
	stamp_brush_canvas_color,
	update_brush_for_drawing_lines,
} from "./image-manipulation.js";

import {
	LineTool,
	RectangleTool,
	EllipseTool,
	RoundedRectangleTool,
} from "./tools_shape.js";
import { PencilTool, BrushTool } from "./tools_brush.js";

import $ from "jquery";

// Tool IDs have type `ToolID`
const TOOL_FREE_FORM_SELECT = "TOOL_FREE_FORM_SELECT";
const TOOL_SELECT = "TOOL_SELECT";
const TOOL_ERASER = "TOOL_ERASER";
const TOOL_FILL = "TOOL_FILL";
const TOOL_PICK_COLOR = "TOOL_PICK_COLOR";
const TOOL_MAGNIFIER = "TOOL_MAGNIFIER";
const TOOL_PENCIL = "TOOL_PENCIL";
const TOOL_BRUSH = "TOOL_BRUSH";
const TOOL_AIRBRUSH = "TOOL_AIRBRUSH";
const TOOL_TEXT = "TOOL_TEXT";
const TOOL_LINE = "TOOL_LINE";
const TOOL_CURVE = "TOOL_CURVE";
const TOOL_RECTANGLE = "TOOL_RECTANGLE";
const TOOL_POLYGON = "TOOL_POLYGON";
const TOOL_ELLIPSE = "TOOL_ELLIPSE";
const TOOL_ROUNDED_RECTANGLE = "TOOL_ROUNDED_RECTANGLE";

/** @type {Tool[]} */

function FREE_FORM_SELECT() {
	return {
		id: TOOL_FREE_FORM_SELECT,
		name: localize("Free-Form Select"),
		help_icon: "p_free.gif",
		description: localize(
			"Selects a free-form part of the picture to move, copy, or edit.",
		),
		cursor: ["precise", [16, 16], "crosshair"],

		// A canvas for rendering a preview of the shape
		preview_canvas: null,

		// The vertices of the polygon
		points: [],

		// The boundaries of the polygon
		x_min: +Infinity,
		x_max: -Infinity,
		y_min: +Infinity,
		y_max: -Infinity,

		pointerdown() {
			this.x_min = PaintJSState.pointer.x;
			this.x_max = PaintJSState.pointer.x + 1;
			this.y_min = PaintJSState.pointer.y;
			this.y_max = PaintJSState.pointer.y + 1;
			this.points = [];
			this.preview_canvas = make_canvas(
				PaintJSState.main_canvas.width,
				PaintJSState.main_canvas.height,
			);

			// End prior selection, drawing it to the canvas

			deselect();
		},
		paint(_ctx, _x, _y) {
			// Constrain the pointer to the canvas
			PaintJSState.pointer.x = Math.min(
				PaintJSState.main_canvas.width,
				PaintJSState.pointer.x,
			);
			PaintJSState.pointer.x = Math.max(0, PaintJSState.pointer.x);
			PaintJSState.pointer.y = Math.min(
				PaintJSState.main_canvas.height,
				PaintJSState.pointer.y,
			);
			PaintJSState.pointer.y = Math.max(0, PaintJSState.pointer.y);
			// Add the point
			this.points.push(PaintJSState.pointer);
			// Update the boundaries of the polygon
			this.x_min = Math.min(PaintJSState.pointer.x, this.x_min);
			this.x_max = Math.max(PaintJSState.pointer.x, this.x_max);
			this.y_min = Math.min(PaintJSState.pointer.y, this.y_min);
			this.y_max = Math.max(PaintJSState.pointer.y, this.y_max);

			bresenham_line(
				PaintJSState.pointer_previous.x,
				PaintJSState.pointer_previous.y,
				PaintJSState.pointer.x,
				PaintJSState.pointer.y,
				(x, y) => {
					this.ffs_paint_iteration(x, y);
				},
			);

			// Note: MS Paint in Windows 98 shows the difference between the starting point and the current mouse position
			// An absolute bounding box seems more useful though.
			// $status_size.text(
			// 	`${this.x_max - this.x_min}x${this.y_max - this.y_min}`,
			// );
			PaintJSState.position_object_active = true;
			PaintJSState.position_object_x = this.x_max - this.x_min;
			PaintJSState.position_object_y = this.y_max - this.y_min;
		},
		ffs_paint_iteration(x, y) {
			// Constrain the inversion paint brush position to the canvas
			x = Math.min(PaintJSState.main_canvas.width, x);
			x = Math.max(0, x);
			y = Math.min(PaintJSState.main_canvas.height, y);
			y = Math.max(0, y);

			// Find the dimensions on the canvas of the tiny square to invert
			const inversion_size = 2;
			const rect_x = ~~(x - inversion_size / 2);
			const rect_y = ~~(y - inversion_size / 2);
			const rect_w = inversion_size;
			const rect_h = inversion_size;

			const ctx_dest = this.preview_canvas.ctx;
			const id_src = PaintJSState.main_ctx.getImageData(
				rect_x,
				rect_y,
				rect_w,
				rect_h,
			);
			const id_dest = ctx_dest.getImageData(rect_x, rect_y, rect_w, rect_h);

			for (let i = 0, l = id_dest.data.length; i < l; i += 4) {
				id_dest.data[i + 0] = 255 - id_src.data[i + 0];
				id_dest.data[i + 1] = 255 - id_src.data[i + 1];
				id_dest.data[i + 2] = 255 - id_src.data[i + 2];
				id_dest.data[i + 3] = 255;
				// @TODO maybe: invert based on id_src.data[i+3] and the checkered background
			}

			ctx_dest.putImageData(id_dest, rect_x, rect_y);
		},
		pointerup() {
			//$status_size.text("");
			//PaintJSState.position_object_active = false;
			this.preview_canvas.width = 1;
			this.preview_canvas.height = 1;

			const contents_within_polygon = copy_contents_within_polygon(
				PaintJSState.main_canvas,
				this.points,
				this.x_min,
				this.y_min,
				this.x_max,
				this.y_max,
			);

			if (PaintJSState.selection) {
				// for silly multitools feature
				show_error_message(
					"This isn't supposed to happen: Free-Form Select after Select in the tool chain?",
				);
				meld_selection_into_canvas();
			}

			undoable(
				{
					name: localize("Free-Form Select"),
					icon: get_icon_for_tool(get_tool_by_id(TOOL_FREE_FORM_SELECT)),
					soft: true,
				},
				() => {
					PaintJSState.selection = new OnCanvasSelection(
						this.x_min,
						this.y_min,
						this.x_max - this.x_min,
						this.y_max - this.y_min,
						contents_within_polygon,
					);
					PaintJSState.selection.cut_out_background();
				},
			);
		},
		cancel() {
			if (!this.preview_canvas) {
				return;
			}
			this.preview_canvas.width = 1;
			this.preview_canvas.height = 1;
		},
		drawPreviewUnderGrid(
			ctx,
			_x,
			_y,
			_grid_visible,
			scale,
			translate_x,
			translate_y,
		) {
			if (!PaintJSState.pointer_active && !PaintJSState.pointer_over_canvas) {
				return;
			}
			if (!this.preview_canvas) {
				return;
			}

			ctx.scale(scale, scale);
			ctx.translate(translate_x, translate_y);

			ctx.drawImage(this.preview_canvas, 0, 0);
		},
	};
}

function SELECT() {
	return {
		id: TOOL_SELECT,
		name: localize("Select"),
		help_icon: "p_sel.gif",
		description: localize(
			"Selects a rectangular part of the picture to move, copy, or edit.",
		),
		cursor: ["precise", [16, 16], "crosshair"],
		selectBox(rect_x, rect_y, rect_width, rect_height) {
			if (rect_width > 1 && rect_height > 1) {
				if (PaintJSState.selection) {
					// for silly multitools feature
					meld_selection_into_canvas();
				}
				// if (PaintJSState.ctrl) {
				// 	undoable({ name: "Crop" }, () => {
				// 		var cropped_canvas = make_canvas(rect_width, rect_height);
				// 		cropped_canvas.ctx.drawImage(
				// 			PaintJSState.main_canvas,
				// 			-rect_x,
				// 			-rect_y,
				// 		);
				// 		drawcopy(PaintJSState.main_ctx, cropped_canvas);
				// 		PaintJSState.canvas_handles.show();
				// 		PaintJSState.$canvas_area.trigger("resize"); // does this not also call canvas_handles.show()?
				// 	});
				// } else {

				// }
				undoable(
					{
						name: localize("Select"),
						icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
						soft: true,
					},
					() => {
						PaintJSState.selection = new OnCanvasSelection(
							rect_x,
							rect_y,
							rect_width,
							rect_height,
						);
					},
				);
			}
		},
	};
}

function ERASER() {
	return {
		id: TOOL_ERASER,
		name: localize("Eraser/Color Eraser"),
		help_icon: "p_erase.gif",
		description: localize(
			"Erases a portion of the picture, using the selected eraser shape.",
		),
		cursor: ["precise", [16, 16], "crosshair"],

		// binary mask of the drawn area, either opaque white or transparent
		mask_canvas: null,

		get_rect(x, y) {
			const rect_x = Math.ceil(x - PaintJSState.eraser_size / 2);
			const rect_y = Math.ceil(y - PaintJSState.eraser_size / 2);
			const rect_w = PaintJSState.eraser_size;
			const rect_h = PaintJSState.eraser_size;
			return { rect_x, rect_y, rect_w, rect_h };
		},

		drawPreviewUnderGrid(
			ctx,
			x,
			y,
			_grid_visible,
			scale,
			translate_x,
			translate_y,
		) {
			if (!PaintJSState.pointer_active && !PaintJSState.pointer_over_canvas) {
				return;
			}
			//console.log('drawPreviewUnderGrid')
			const { rect_x, rect_y, rect_w, rect_h } = this.get_rect(x, y);

			ctx.scale(scale, scale);
			ctx.translate(translate_x, translate_y);

			if (this.mask_canvas) {
				this.render_from_mask(ctx, true);
			}

			ctx.fillStyle = PaintJSState.selected_colors.background;
			ctx.fillRect(rect_x, rect_y, rect_w, rect_h);
		},
		drawPreviewAboveGrid(
			ctx,
			x,
			y,
			grid_visible,
			scale,
			translate_x,
			translate_y,
		) {
			if (!PaintJSState.pointer_active && !PaintJSState.pointer_over_canvas) {
				return;
			}
			//console.log('drawPreviewAboveGrid')
			const { rect_x, rect_y, rect_w, rect_h } = this.get_rect(x, y);

			ctx.scale(scale, scale);
			ctx.translate(translate_x, translate_y);
			const hairline_width = 1 / scale;

			ctx.strokeStyle = "black";
			ctx.lineWidth = hairline_width;

			ctx.strokeRect(
				rect_x + ctx.lineWidth / 2,
				rect_y + ctx.lineWidth / 2,
				rect_w - ctx.lineWidth,
				rect_h - ctx.lineWidth,
			);
		},

		pointerdown() {
			console.log("pointerdown");
			this.mask_canvas = new OffscreenCanvas(1, 1);
		},
		render_from_mask(ctx, previewing) {},
		pointerup() {
			console.log("pointerup");
			if (!this.mask_canvas) {
				return; // not sure why this would happen per se
			}

			undoable(
				{
					name: get_language().match(/^en\b/)
						? this.color_eraser_mode
							? "Color Eraser"
							: "Eraser"
						: localize("Eraser/Color Eraser"),
					icon: get_icon_for_tool(this),
				},
				() => {
					this.mask_canvas.width = 1;
				},
			);
		},
		cancel() {
			//console.log("cancel");
			this.mask_canvas.width = 1;
		},
		paint(ctx, _x, _y) {
			//console.log("paint");
			const eraser_size = PaintJSState.eraser_size / 2;

			// 0. 시작점과 끝점 기준으로 임시 캔버스 생성
			const startX = Math.min(
				PaintJSState.pointer_previous.x,
				PaintJSState.pointer.x,
			);
			const startY = Math.min(
				PaintJSState.pointer_previous.y,
				PaintJSState.pointer.y,
			);
			const endX = Math.max(
				PaintJSState.pointer_previous.x,
				PaintJSState.pointer.x,
			);
			const endY = Math.max(
				PaintJSState.pointer_previous.y,
				PaintJSState.pointer.y,
			);
			const width = endX - startX + eraser_size * 2;
			const height = endY - startY + eraser_size * 2;

			this.mask_canvas.width = width;
			this.mask_canvas.height = height;
			const mask_ctx = this.mask_canvas.getContext("2d");

			mask_ctx.imageSmoothingEnabled = false;

			// 1. 임시 캔버스에 흰색으로 도형 그리기
			mask_ctx.fillStyle = "black";
			mask_ctx.globalCompositeOperation = "source-over";
			bresenham_line(
				PaintJSState.pointer_previous.x - startX,
				PaintJSState.pointer_previous.y - startY,
				PaintJSState.pointer.x - startX,
				PaintJSState.pointer.y - startY,
				(x, y) => {
					this.eraser_paint_iteration(
						ctx,
						x + eraser_size,
						y + eraser_size,
						mask_ctx,
						startX - eraser_size,
						startY - eraser_size,
					);
				},
			);

			// 2. 메인 캔버스에서 'destination-out'으로 임시 캔버스 적용
			PaintJSState.main_canvas.ctx.globalCompositeOperation = "destination-out";
			PaintJSState.main_canvas.ctx.drawImage(
				this.mask_canvas,
				startX - eraser_size,
				startY - eraser_size,
			);
		},
		eraser_paint_iteration(ctx, x, y, drawCtx, startX, startY) {
			const { rect_x, rect_y, rect_w, rect_h } = this.get_rect(x, y);

			this.color_eraser_mode = PaintJSState.button !== 0;

			if (!this.color_eraser_mode) {
				// Eraser
				drawCtx.fillStyle = "black";
				drawCtx.fillRect(rect_x, rect_y, rect_w, rect_h);
			} else {
				// Color Eraser
				// Right click with the eraser to selectively replace
				// the selected foreground color with the selected background color

				const fg_rgba = get_rgba_from_color(
					PaintJSState.selected_colors.foreground,
				);

				const test_image_data = ctx.getImageData(
					rect_x + startX,
					rect_y + startY,
					rect_w,
					rect_h,
				);
				const result_image_data = drawCtx.getImageData(
					rect_x,
					rect_y,
					rect_w,
					rect_h,
				);

				const fill_threshold = 1; // 1 is just enough for a workaround for Brave browser's farbling: https://github.com/1j01/jspaint/issues/184

				for (let i = 0, l = test_image_data.data.length; i < l; i += 4) {
					if (
						Math.abs(test_image_data.data[i + 0] - fg_rgba[0]) <=
							fill_threshold &&
						Math.abs(test_image_data.data[i + 1] - fg_rgba[1]) <=
							fill_threshold &&
						Math.abs(test_image_data.data[i + 2] - fg_rgba[2]) <=
							fill_threshold &&
						Math.abs(test_image_data.data[i + 3] - fg_rgba[3]) <= fill_threshold
					) {
						result_image_data.data[i + 0] = 255;
						result_image_data.data[i + 1] = 255;
						result_image_data.data[i + 2] = 255;
						result_image_data.data[i + 3] = 255;
					}
				}

				drawCtx.putImageData(result_image_data, rect_x, rect_y);
			}
		},
	};
}

function FILL() {
	return {
		id: TOOL_FILL,
		name: localize("Fill With Color"),
		help_icon: "p_paint.gif",
		description: "Fills an area with the selected drawing color.",
		cursor: ["fill-bucket", [8, 22], "crosshair"],
		pointerdown(ctx, x, y) {
			if (PaintJSState.shift) {
				undoable(
					{
						name: "Replace Color",
						icon: get_icon_for_tool(this),
					},
					() => {
						// Perform global color replacement
						draw_noncontiguous_fill(ctx, x, y, PaintJSState.fill_color);
					},
				);
			} else {
				undoable(
					{
						name: localize("Fill With Color"),
						icon: get_icon_for_tool(this),
					},
					() => {
						// Perform a normal fill operation
						draw_fill(ctx, x, y, PaintJSState.fill_color);
					},
				);
			}
		},
	};
}

function PICK_COLOR() {
	return {
		id: TOOL_PICK_COLOR,
		name: localize("Pick Color"),

		help_icon: "p_eye.gif",
		description: localize("Picks up a color from the picture for drawing."),
		cursor: ["eye-dropper", [9, 22], "crosshair"],
		deselect: true,

		current_color: "",
		display_current_color() {
			// this.$options.css({
			// 	background: this.current_color,
			// });
		},
		pointerdown() {
			$(window).one("pointerup", () => {
				// this.$options.css({
				// 	background: "",
				// });
			});
		},
		paint(ctx, x, y) {
			if (
				x >= 0 &&
				y >= 0 &&
				x < PaintJSState.main_canvas.width &&
				y < PaintJSState.main_canvas.height
			) {
				const id = ctx.getImageData(~~x, ~~y, 1, 1);
				const [r, g, b, a] = id.data;
				this.current_color = `rgba(${r},${g},${b},${a / 255})`;
			} else {
				this.current_color = "white";
			}
			this.display_current_color();
		},
		pointerup() {
			PaintJSState.selected_colors[PaintJSState.pick_color_slot] =
				this.current_color;
			$(window).trigger("option-changed");
		},
	};
}

function MAGNIFIER() {
	return {
		id: TOOL_MAGNIFIER,
		name: localize("Magnifier"),

		help_icon: "p_zoom.gif",
		description: localize("Changes the magnification."),
		cursor: ["magnifier", [16, 16], "zoom-in"], // overridden below
		deselect: false,

		getProspectiveMagnification: (button = 1) => {
			const zoomLevels = [
				0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 100,
			];

			const nextZoom = {
				0.5: 1,
				1: 2,
				2: 3,
				3: 4,
				4: 5,
				5: 6,
				6: 8,
				8: 10,
				10: 12,
				12: 15,
				15: 20,
				20: 25,
				25: 30,
				30: 40,
				40: 50,
				50: 60,
				60: 75,
				75: 100,
				100: 100,
			};

			const nextout = {
				100: 75,
				75: 60,
				60: 50,
				50: 40,
				40: 30,
				30: 25,
				25: 20,
				20: 15,
				15: 12,
				12: 10,
				10: 8,
				8: 6,
				6: 5,
				5: 4,
				4: 3,
				3: 2,
				2: 1,
				1: 0.5,
				0.5: 0.5,
			};

			function getClosestZoom(currentZoom) {
				const zoomLevels = Object.keys(nextZoom)
					.map(Number)
					.sort((a, b) => a - b);
				for (let i = zoomLevels.length - 1; i >= 0; i--) {
					if (currentZoom >= zoomLevels[i]) {
						return zoomLevels[i];
					}
				}
				return zoomLevels[0]; // 만약 currentZoom이 가장 낮은 줌보다 작다면 최소값 반환
			}

			if (button == 2) {
				return nextout[getClosestZoom(PaintJSState.magnification)];
			}

			return nextZoom[getClosestZoom(PaintJSState.magnification)];
		},
		drawPreviewAboveGrid(
			ctx,
			x,
			y,
			_grid_visible,
			scale,
			translate_x,
			translate_y,
		) {
			if (!PaintJSState.pointer_active && !PaintJSState.pointer_over_canvas) {
				return;
			}
			if (PaintJSState.pointer_active) {
				return;
			}
			const prospective_magnification = this.getProspectiveMagnification();
			console.log(prospective_magnification, PaintJSState.magnification);
			//console.log("scale:", scale);
			// hacky place to put this but whatever
			// use specific zoom-in/zoom-out as fallback,
			// even though the custom cursor image is less descriptive
			// because there's no generic "zoom" css cursor
			if (prospective_magnification < PaintJSState.magnification) {
				PaintJSState.$canvas.css({
					cursor: make_css_cursor("magnifier", [16, 16], "zoom-out"),
				});
			} else {
				PaintJSState.$canvas.css({
					cursor: make_css_cursor("magnifier", [16, 16], "zoom-in"),
				});
			}

			if (prospective_magnification < PaintJSState.magnification) {
				return;
			} // hide if would be zooming out

			// prospective viewport size in document coords
			const w = PaintJSState.$canvas_area.width() / prospective_magnification;
			const h = PaintJSState.$canvas_area.height() / prospective_magnification;

			let rect_x1 = ~~(x - w / 2);
			let rect_y1 = ~~(y - h / 2);

			// try to move rect into bounds without squishing
			rect_x1 = Math.max(0, rect_x1);
			rect_y1 = Math.max(0, rect_y1);
			rect_x1 = Math.min(PaintJSState.main_canvas.width - w, rect_x1);
			rect_y1 = Math.min(PaintJSState.main_canvas.height - h, rect_y1);

			let rect_x2 = rect_x1 + w;
			let rect_y2 = rect_y1 + h;

			// clamp rect to bounds (with squishing)
			rect_x1 = Math.max(0, rect_x1);
			rect_y1 = Math.max(0, rect_y1);
			rect_x2 = Math.min(PaintJSState.main_canvas.width, rect_x2);
			rect_y2 = Math.min(PaintJSState.main_canvas.height, rect_y2);

			const rect_w = rect_x2 - rect_x1;
			const rect_h = rect_y2 - rect_y1;
			const rect_x = rect_x1;
			const rect_y = rect_y1;

			const id_src = PaintJSState.main_canvas.ctx.getImageData(
				rect_x,
				rect_y,
				rect_w + 1,
				rect_h + 1,
			);
			const id_dest = ctx.getImageData(
				(rect_x + translate_x) * scale,
				(rect_y + translate_y) * scale,
				rect_w * scale + 1,
				rect_h * scale + 1,
			);

			function copyPixelInverted(x_dest, y_dest) {
				const x_src = ~~(x_dest / scale);
				const y_src = ~~(y_dest / scale);
				const index_src = (x_src + y_src * id_src.width) * 4;
				const index_dest = (x_dest + y_dest * id_dest.width) * 4;
				id_dest.data[index_dest + 0] = 255 - id_src.data[index_src + 0];
				id_dest.data[index_dest + 1] = 255 - id_src.data[index_src + 1];
				id_dest.data[index_dest + 2] = 255 - id_src.data[index_src + 2];
				id_dest.data[index_dest + 3] = 255;
				// @TODO maybe: invert based on id_src.data[index_src+3] and the checkered background
			}

			for (let x = 0, limit = id_dest.width; x < limit; x += 1) {
				copyPixelInverted(x, 0);
				copyPixelInverted(x, id_dest.height - 1);
			}
			for (let y = 1, limit = id_dest.height - 1; y < limit; y += 1) {
				copyPixelInverted(0, y);
				copyPixelInverted(id_dest.width - 1, y);
			}

			// for debug: fill rect
			// for (let x = 0, x_limit = id_dest.width; x < x_limit; x += 1) {
			// 	for (let y = 1, y_limit = id_dest.height - 1; y < y_limit; y += 1) {
			// 		copyPixelInverted(x, y);
			// 	}
			// }

			ctx.putImageData(
				id_dest,
				(rect_x + translate_x) * scale,
				(rect_y + translate_y) * scale,
			);

			// debug:
			// ctx.scale(scale, scale);
			// ctx.translate(translate_x, translate_y);
			// ctx.strokeStyle = "#f0f";
			// ctx.strokeRect(rect_x1, rect_y1, rect_w, rect_h);
		},
		pointerdown(_ctx, x, y) {
			const prev_magnification = PaintJSState.magnification;
			const prospective_magnification = this.getProspectiveMagnification(
				PaintJSState.button,
			);

			//console.log("예정 배율:", prospective_magnification);

			set_magnification(prospective_magnification);

			//console.log("이전배율:", prev_magnification);

			if (PaintJSState.magnification > prev_magnification) {
				// (new) viewport size in document coords
				const w =
					PaintJSState.$canvas_area.width() / PaintJSState.magnification;
				const h =
					PaintJSState.$canvas_area.height() / PaintJSState.magnification;

				PaintJSState.$canvas_area.scrollLeft(
					(x - w / 2) * PaintJSState.magnification,
				);
				// Nevermind, canvas, isn't aligned to the right in RTL layout!
				// if (get_direction() === "rtl") {
				// 	// scrollLeft coordinates can be negative for RTL
				// 	PaintJSState.$canvas_area.scrollLeft((x - w/2 - canvas.width) * magnification / prev_magnification + PaintJSState.$canvas_area.innerWidth());
				// } else {
				// 	PaintJSState.$canvas_area.scrollLeft((x - w/2) * magnification / prev_magnification);
				// }
				PaintJSState.$canvas_area.scrollTop(
					(y - h / 2) * PaintJSState.magnification,
				);

				//console.log("스크롤 이동",((x - w / 2) * magnification),((y - h / 2) * magnification));
				PaintJSState.$canvas_area.trigger("scroll");
			}
		},
	};
}

function AIRBRUSH() {
	return {
		id: TOOL_AIRBRUSH,
		name: localize("Airbrush"),

		help_icon: "p_airb.gif",
		description: localize("Draws using an airbrush of the selected size."),
		cursor: ["airbrush", [7, 22], "crosshair"],
		paint_on_time_interval: 5,
		paint_mask(ctx, x, y) {
			const r = PaintJSState.airbrush_size / 2;
			for (let i = 0; i < 6 + r / 5; i++) {
				const rx = (Math.random() * 2 - 1) * r;
				const ry = (Math.random() * 2 - 1) * r;
				const d = rx * rx + ry * ry;
				if (d <= r * r) {
					ctx.fillRect(x + ~~rx, y + ~~ry, 1, 1);
				}
			}
			update_helper_layer();
		},
	};
}

function CURVE() {
	return {
		id: TOOL_CURVE,
		name: localize("Curve"),
		help_icon: "p_curve.gif",
		description: localize("Draws a curved line with the selected line width."),
		cursor: ["precise", [16, 16], "crosshair"],
		stroke_only: true,
		points: [],
		draw_canvas: null,
		pointerup(ctx, _x, _y) {
			if (this.points.length >= 4) {
				undoable(
					{
						name: localize("Curve"),
						icon: get_icon_for_tool(this),
					},
					() => {
						ctx.drawImage(this.draw_canvas, 0, 0);
					},
				);
				this.points = [];
				this.draw_canvas.clear();
				//$status_size.text("");
				//PaintJSState.position_object_active = false;
			}
		},
		pointerdown(_ctx, x, y) {
			if (this.points.length < 1) {
				this.draw_canvas = PaintJSState.draw_canvas;
				this.draw_canvas.reset();

				this.points.push({ x, y });
				if (!$("body").hasClass("eye-gaze-mode")) {
					// second point so first action draws a line
					this.points.push({ x, y });
				}
			} else {
				this.points.push({ x, y });
			}
		},
		paint(_ctx, x, y) {
			if (this.points.length < 1) {
				return;
			}

			update_brush_for_drawing_lines(PaintJSState.stroke_size);

			const i = this.points.length - 1;
			this.points[i].x = x;
			this.points[i].y = y;

			this.draw_canvas.ctx.clearRect(
				0,
				0,
				this.draw_canvas.width,
				this.draw_canvas.height,
			);
			this.draw_canvas.ctx.strokeStyle = PaintJSState.stroke_color;

			// Draw curves on preview canvas
			if (this.points.length === 4) {
				draw_bezier_curve(
					this.draw_canvas.ctx,
					this.points[0].x,
					this.points[0].y,
					this.points[2].x,
					this.points[2].y,
					this.points[3].x,
					this.points[3].y,
					this.points[1].x,
					this.points[1].y,
					PaintJSState.stroke_size,
				);
			} else if (this.points.length === 3) {
				draw_quadratic_curve(
					this.draw_canvas.ctx,
					this.points[0].x,
					this.points[0].y,
					this.points[2].x,
					this.points[2].y,
					this.points[1].x,
					this.points[1].y,
					PaintJSState.stroke_size,
				);
			} else if (this.points.length === 2) {
				draw_line(
					this.draw_canvas.ctx,
					this.points[0].x,
					this.points[0].y,
					this.points[1].x,
					this.points[1].y,
					PaintJSState.stroke_size,
				);
			} else {
				draw_line(
					this.draw_canvas.ctx,
					this.points[0].x,
					this.points[0].y,
					this.points[0].x,
					this.points[0].y,
					PaintJSState.stroke_size,
				);
			}

			// MS Paint shows the mouse position relative to the first point
			// (and is afraid of the number zero)
			const signed_width = x - this.points[0].x || 1;
			const signed_height = y - this.points[0].y || 1;
			//$status_size.text(`${signed_width} x ${signed_height}px`);
			// I don't know how helpful this is, might be more useful to show the number of points:
			// $status_size.text(`${this.points.length} / 4 points`);
			PaintJSState.position_object_active = true;
			PaintJSState.position_object_x = signed_width;
			PaintJSState.position_object_y = signed_height;
		},
		drawPreviewUnderGrid(
			ctx,
			_x,
			_y,
			_grid_visible,
			scale,
			translate_x,
			translate_y,
		) {
			// if (!PaintJSState.pointer_active && !PaintJSState.pointer_over_canvas) { return; }
			if (!this.draw_canvas) {
				return;
			}
			// ctx.scale(scale, scale);
			// ctx.translate(translate_x, translate_y);

			// if (this.points.length >= 1) {
			// 	ctx.drawImage(this.draw_canvas, 0, 0);
			// }
		},
		cancel() {
			this.points = [];
			this.draw_canvas.clear();
			//$status_size.text("");
			//PaintJSState.position_object_active = false;
		},
		end() {
			console.log("end!");
			this.points = [];
			//this.draw_canvas.width = 1;
			update_helper_layer();
			//$status_size.text("");
			//PaintJSState.position_object_active = false;
		},
	};
}

function POLYGON() {
	return {
		id: TOOL_POLYGON,
		name: localize("Polygon"),
		help_icon: "p_poly.gif",
		description: localize("Draws a polygon with the selected fill style."),
		cursor: ["precise", [16, 16], "crosshair"],

		// Record the last click for double-clicking
		// A double click happens on pointerdown of a second click
		// (within a cylindrical volume in 2d space + 1d time)
		last_click_pointerdown: { x: -Infinity, y: -Infinity, time: -Infinity },
		last_click_pointerup: { x: -Infinity, y: -Infinity, time: -Infinity },

		// The vertices of the polygon
		points: [],

		// A canvas for rendering a preview of the shape
		draw_canvas: null,

		pointerup(ctx, x, y) {
			if (this.points.length < 1) {
				return;
			}

			const i = this.points.length - 1;
			this.points[i].x = x;
			this.points[i].y = y;
			const dx = this.points[i].x - this.points[0].x;
			const dy = this.points[i].y - this.points[0].y;
			const d = Math.sqrt(dx * dx + dy * dy);
			if ($("body").hasClass("eye-gaze-mode")) {
				if (this.points.length >= 3) {
					if (d < PaintJSState.stroke_size * 10 + 20) {
						this.complete(ctx);
					}
				}
			} else {
				if (d < PaintJSState.stroke_size * 5.1010101) {
					// arbitrary number (@TODO: find correct value (or formula))
					this.complete(ctx);
				}
			}

			this.last_click_pointerup = { x, y, time: +new Date() };

			this.updateStatus();
		},
		pointerdown(ctx, x, y) {
			if (this.points.length < 1) {
				this.draw_canvas = PaintJSState.draw_canvas;
				this.draw_canvas.reset();

				// Add the first point of the polygon
				this.points.push({ x, y });

				if (!$("body").hasClass("eye-gaze-mode")) {
					// Add a second point so first action draws a line
					this.points.push({ x, y });
				}
			} else {
				const lx = this.last_click_pointerdown.x;
				const ly = this.last_click_pointerdown.y;
				const lt = this.last_click_pointerdown.time;
				const dx = x - lx;
				const dy = y - ly;
				const dt = +new Date() - lt;
				const d = Math.sqrt(dx * dx + dy * dy);
				if (d < 4.1010101 && dt < 250) {
					// arbitrary 101 (@TODO: find correct value (or formula))
					this.complete(ctx);
				} else {
					// Add the point
					this.points.push({ x, y });
				}
			}
			this.last_click_pointerdown = { x, y, time: +new Date() };
		},
		paint(_ctx, x, y) {
			if (this.points.length < 1) {
				return;
			}

			const i = this.points.length - 1;
			this.points[i].x = x;
			this.points[i].y = y;

			this.draw_canvas.ctx.clearRect(
				0,
				0,
				this.draw_canvas.width,
				this.draw_canvas.height,
			);
			if (PaintJSState.fill && !PaintJSState.stroke) {
				this.draw_canvas.ctx.drawImage(PaintJSState.main_canvas, 0, 0);
				this.draw_canvas.ctx.strokeStyle = "white";
				this.draw_canvas.ctx.globalCompositeOperation = "difference";
				var orig_stroke_size = PaintJSState.stroke_size;
				PaintJSState.stroke_size = 2;
				draw_line_strip(this.draw_canvas.ctx, this.points);
				PaintJSState.stroke_size = orig_stroke_size;
			} else if (this.points.length > 1) {
				this.draw_canvas.ctx.strokeStyle = PaintJSState.stroke_color;
				draw_line_strip(this.draw_canvas.ctx, this.points);
			} else {
				draw_line(
					this.draw_canvas.ctx,
					this.points[0].x,
					this.points[0].y,
					this.points[0].x,
					this.points[0].y,
					PaintJSState.stroke_size,
				);
			}

			this.updateStatus();
		},
		complete(ctx) {
			if (this.points.length >= 3) {
				undoable(
					{
						name: localize("Polygon"),
						icon: get_icon_for_tool(this),
					},
					() => {
						ctx.fillStyle = PaintJSState.fill_color;
						ctx.strokeStyle = PaintJSState.stroke_color;

						var orig_stroke_size = PaintJSState.stroke_size;
						if (PaintJSState.fill && !PaintJSState.stroke) {
							PaintJSState.stroke_size = 2;
							ctx.strokeStyle = PaintJSState.fill_color;
						}

						draw_polygon(
							ctx,
							this.points,
							PaintJSState.stroke ||
								(PaintJSState.fill && !PaintJSState.stroke),
							PaintJSState.fill,
						);

						PaintJSState.stroke_size = orig_stroke_size;
					},
				);
			}

			this.reset();
		},
		cancel() {
			this.reset();
		},
		end(ctx) {
			this.complete(ctx);
			update_helper_layer();
		},
		updateStatus() {
			let x_min = +Infinity;
			let x_max = -Infinity;
			let y_min = +Infinity;
			let y_max = -Infinity;
			for (const point of this.points) {
				x_min = Math.min(point.x, x_min);
				x_max = Math.max(point.x, x_max);
				y_min = Math.min(point.y, y_min);
				y_max = Math.max(point.y, y_max);
			}
			const signed_width = x_max - x_min || 1;
			const signed_height = y_max - y_min || 1;
			//$status_size.text(`${signed_width} x ${signed_height}px`);
			PaintJSState.position_object_active = true;
			PaintJSState.position_object_x = signed_width;
			PaintJSState.position_object_y = signed_height;
		},
		reset() {
			//$status_size.text("");
			//PaintJSState.position_object_active = false;
			this.points = [];
			this.last_click_pointerdown = {
				x: -Infinity,
				y: -Infinity,
				time: -Infinity,
			};
			this.last_click_pointerup = {
				x: -Infinity,
				y: -Infinity,
				time: -Infinity,
			};

			if (!this.draw_canvas) {
				return;
			}
			this.draw_canvas.clear();
		},
		shape_colors: true,
	};
}

const tools = [
	FREE_FORM_SELECT(),
	SELECT(),
	ERASER(),
	FILL(),
	PICK_COLOR(),
	MAGNIFIER(),
	new PencilTool(),
	new BrushTool(),
	AIRBRUSH(),
	CURVE(),
	POLYGON(),
	new LineTool(),
	new RectangleTool(),
	new EllipseTool(),
	new RoundedRectangleTool(),
];

function setting_selectBox(tool) {
	if (tool.selectBox) {
		// TODO: is drag_start_x/y redundant with PaintJSState.pointer_start.x/y?
		let drag_start_x = 0;
		let drag_start_y = 0;
		let pointer_has_moved = false;
		let rect_x = 0;
		let rect_y = 0;
		let rect_width = 0;
		let rect_height = 0;

		tool.pointerdown = () => {
			drag_start_x = PaintJSState.pointer.x;
			drag_start_y = PaintJSState.pointer.y;
			pointer_has_moved = false;
			$(window).one("pointermove", () => {
				pointer_has_moved = true;
			});
			if (PaintJSState.selection) {
				meld_selection_into_canvas();
			}
			PaintJSState.canvas_handles.hide();
		};
		tool.paint = () => {
			rect_x = ~~Math.max(0, Math.min(drag_start_x, PaintJSState.pointer.x));
			rect_y = ~~Math.max(0, Math.min(drag_start_y, PaintJSState.pointer.y));
			rect_width =
				~~Math.min(
					PaintJSState.main_canvas.width,
					Math.max(drag_start_x, PaintJSState.pointer.x) + 1,
				) - rect_x;
			rect_height =
				~~Math.min(
					PaintJSState.main_canvas.height,
					Math.max(drag_start_y, PaintJSState.pointer.y + 1),
				) - rect_y;
			//$status_size.text(`${rect_width} x ${rect_height}px`); // note that OnCanvasObject/OnCanvasTextBox/OnCanvasSelection also manages this status text
			//if(rect_width > 1 && rect_height > 1){
			PaintJSState.position_object_active = true;
			PaintJSState.position_object_x = rect_width;
			PaintJSState.position_object_y = rect_height;
			//}
		};
		tool.pointerup = () => {
			//$status_size.text(""); // note that OnCanvasObject/OnCanvasTextBox/OnCanvasSelection also manages this status text
			//PaintJSState.position_object_active = false;
			PaintJSState.canvas_handles.show();
			tool.selectBox(rect_x, rect_y, rect_width, rect_height);
		};
		tool.cancel = () => {
			PaintJSState.canvas_handles.show();
		};
		tool.drawPreviewAboveGrid = (
			ctx,
			_x,
			_y,
			_grid_visible,
			scale,
			translate_x,
			translate_y,
		) => {
			if (!PaintJSState.pointer_active) {
				return;
			}
			if (!pointer_has_moved) {
				return;
			}

			//console.warn(ctx);

			draw_selection_box(
				ctx,
				rect_x,
				rect_y,
				rect_width,
				rect_height,
				scale,
				translate_x,
				translate_y,
			);
		};
	}
}

function setting_paint_mask(tool) {
	if (tool.paint_mask) {
		// binary mask of the drawn area, either opaque white or transparent
		tool.mask_canvas = null;

		tool.pointerdown = (_ctx, _x, _y) => {
			if (!tool.mask_canvas) {
				tool.mask_canvas = make_canvas(
					PaintJSState.main_canvas.width,
					PaintJSState.main_canvas.height,
				);
			}
			if (tool.mask_canvas.width !== PaintJSState.main_canvas.width) {
				tool.mask_canvas.width = PaintJSState.main_canvas.width;
			}
			if (tool.mask_canvas.height !== PaintJSState.main_canvas.height) {
				tool.mask_canvas.height = PaintJSState.main_canvas.height;
			}
		};
		tool.pointerup = () => {
			if (!tool.mask_canvas) {
				return; // not sure why this would happen per se
			}
			undoable(
				{
					name: tool.name,
					icon: get_icon_for_tool(tool),
				},
				() => {
					tool.render_from_mask(PaintJSState.main_ctx);

					tool.mask_canvas.width = 1;
					tool.mask_canvas.height = 1;
				},
			);
		};
		tool.paint = (_ctx, x, y) => {
			tool.paint_mask(tool.mask_canvas.ctx, x, y);
		};
		tool.cancel = () => {
			if (tool.mask_canvas) {
				tool.mask_canvas.width = 1;
				tool.mask_canvas.height = 1;
			}
		};
		tool.render_from_mask = (ctx, previewing) => {
			// could be private
			ctx.save();
			ctx.globalCompositeOperation = "destination-out";
			ctx.drawImage(tool.mask_canvas, 0, 0);
			ctx.restore();

			/** @type {string | CanvasGradient | CanvasPattern} */
			let color = PaintJSState.stroke_color;
			// I've seen firefox give [ 254, 254, 254, 254 ] for get_rgba_from_color("#fff")
			// or other values
			// even with privacy.resistFingerprinting set to false
			// the canvas API is just genuinely not reliable for exact color values
			// const translucent = get_rgba_from_color(color)[3] < 253;
			// const translucent = get_rgba_from_color(color)[3] < 1;

			// if (translucent) {
			// 	color = 'rgba(255, 0, 0, 0.3)';
			// }

			// @TODO: perf: keep this canvas around too
			const mask_fill_canvas = make_canvas(tool.mask_canvas);
			replace_colors_with_swatch(mask_fill_canvas.ctx, color, 0, 0);
			ctx.drawImage(mask_fill_canvas, 0, 0);
			return true;
			// return translucent;
		};
		tool.drawPreviewUnderGrid = (
			ctx,
			_x,
			_y,
			_grid_visible,
			scale,
			translate_x,
			translate_y,
		) => {
			if (!PaintJSState.pointer_active && !PaintJSState.pointer_over_canvas) {
				return;
			}

			ctx.scale(scale, scale);
			ctx.translate(translate_x, translate_y);

			if (tool.mask_canvas) {
				const should_animate = tool.render_from_mask(ctx, true);
				if (should_animate) {
					// animate for gradient
					// TODO: is rAF needed? update_helper_layer uses rAF
					requestAnimationFrame(() => {
						update_helper_layer();
					});
				}
			}
		};
	}
}

tools.forEach((tool) => {
	setting_selectBox(tool);
	setting_paint_mask(tool);
});

export {
	TOOL_AIRBRUSH,
	TOOL_BRUSH,
	TOOL_CURVE,
	TOOL_ELLIPSE,
	TOOL_ERASER,
	TOOL_FILL,
	TOOL_FREE_FORM_SELECT,
	TOOL_LINE,
	TOOL_MAGNIFIER,
	TOOL_PENCIL,
	TOOL_PICK_COLOR,
	TOOL_POLYGON,
	TOOL_RECTANGLE,
	TOOL_ROUNDED_RECTANGLE,
	TOOL_SELECT,
	TOOL_TEXT,
	tools,
};
