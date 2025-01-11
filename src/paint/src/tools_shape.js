import { localize, get_language } from "../../localize/localize.js";
import {
  deselect,
  get_tool_by_id,
  meld_selection_into_canvas,
  set_magnification,
  show_error_message,
  undoable,
  update_helper_layer,
} from "./functions.js";
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

const TOOL_LINE = "TOOL_LINE";
const TOOL_RECTANGLE = "TOOL_RECTANGLE";
const TOOL_ELLIPSE = "TOOL_ELLIPSE";
const TOOL_ROUNDED_RECTANGLE = "TOOL_ROUNDED_RECTANGLE";

class ShapeTool {
  constructor(id, name, description, cursor) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cursor = cursor;
    this.draw_canvas = null;
  }

  pointerdown() {
    this.draw_canvas = PaintJSState.draw_canvas;
    this.draw_canvas.reset();
  }

  paint() {
    if (!this.draw_canvas) return;

    this.draw_canvas.clear();

    // Set styles from main context
    this.draw_canvas.ctx.fillStyle = PaintJSState.main_ctx.fillStyle;
    this.draw_canvas.ctx.strokeStyle = PaintJSState.main_ctx.strokeStyle;
    this.draw_canvas.ctx.lineWidth = PaintJSState.main_ctx.lineWidth;

    // Call the specific shape drawing method
    this.shape(
      this.draw_canvas.ctx,
      PaintJSState.pointer_start.x,
      PaintJSState.pointer_start.y,
      PaintJSState.pointer.x - PaintJSState.pointer_start.x,
      PaintJSState.pointer.y - PaintJSState.pointer_start.y,
    );

    const signed_width =
      PaintJSState.pointer.x - PaintJSState.pointer_start.x || 1;
    const signed_height =
      PaintJSState.pointer.y - PaintJSState.pointer_start.y || 1;

    // Update status and position
    // $status_size.text(`${signed_width} x ${signed_height}px`);
    PaintJSState.position_object_active = true;
    PaintJSState.position_object_x = signed_width;
    PaintJSState.position_object_y = signed_height;
  }

  pointerup() {
    if (!this.draw_canvas) return;

    // $status_size.text("");
    // PaintJSState.position_object_active = false;

    undoable(
      {
        name: this.name,
        icon: get_icon_for_tool(this),
      },
      () => {
        PaintJSState.main_ctx.drawImage(this.draw_canvas, 0, 0);
        this.draw_canvas.clear();
      },
    );

    this.draw_canvas = null;
  }

  shape(ctx, x, y, w, h) {
    throw new Error("Shape method must be implemented by subclass");
  }
}

export class LineTool extends ShapeTool {
  constructor() {
    super(
      TOOL_LINE,
      localize("Line"),
      localize("Draws a straight line with the selected line width."),
      ["precise", [16, 16], "crosshair"],
    );
  }

  shape(ctx, x, y, w, h) {
    update_brush_for_drawing_lines(PaintJSState.stroke_size);
    draw_line(ctx, x, y, x + w, y + h, PaintJSState.stroke_size);
  }
}

export class RectangleTool extends ShapeTool {
  constructor() {
    super(
      TOOL_RECTANGLE,
      localize("Rectangle"),
      localize("Draws a rectangle with the selected fill style."),
      ["precise", [16, 16], "crosshair"],
    );
  }

  shape(ctx, x, y, w, h) {
    // Normalize width and height
    if (w < 0) {
      x += w;
      w = -w;
    }
    if (h < 0) {
      y += h;
      h = -h;
    }

    // Fill rectangle if fill is enabled
    if (PaintJSState.fill) {
      ctx.fillRect(x, y, w, h);
    }

    // Stroke rectangle if stroke is enabled
    if (PaintJSState.stroke) {
      if (
        w < PaintJSState.stroke_size * 2 ||
        h < PaintJSState.stroke_size * 2
      ) {
        ctx.save();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillRect(x, y, PaintJSState.stroke_size, h);
        ctx.fillRect(
          x + w - PaintJSState.stroke_size,
          y,
          PaintJSState.stroke_size,
          h,
        );
        ctx.fillRect(x, y, w, PaintJSState.stroke_size);
        ctx.fillRect(
          x,
          y + h - PaintJSState.stroke_size,
          w,
          PaintJSState.stroke_size,
        );
        ctx.restore();
      }
    }
  }
}

export class EllipseTool extends ShapeTool {
  constructor() {
    super(
      TOOL_ELLIPSE,
      localize("Ellipse"),
      localize("Draws an ellipse with the selected fill style."),
      ["precise", [16, 16], "crosshair"],
    );
  }

  shape(ctx, x, y, w, h) {
    // Normalize width and height
    if (w < 0) {
      x += w;
      w = -w;
    }
    if (h < 0) {
      y += h;
      h = -h;
    }

    if (PaintJSState.fill || PaintJSState.stroke) {
      if (w < PaintJSState.stroke_size || h < PaintJSState.stroke_size) {
        ctx.fillStyle = ctx.strokeStyle;
        draw_ellipse(ctx, x, y, w, h, false, true);
      } else {
        draw_ellipse(
          ctx,
          x + Math.floor(PaintJSState.stroke_size / 2),
          y + Math.floor(PaintJSState.stroke_size / 2),
          w - PaintJSState.stroke_size,
          h - PaintJSState.stroke_size,
          PaintJSState.stroke,
          PaintJSState.fill,
        );
      }
    }
  }
}

export class RoundedRectangleTool extends ShapeTool {
  constructor() {
    super(
      TOOL_ROUNDED_RECTANGLE,
      localize("Rounded Rectangle"),
      localize("Draws a rounded rectangle with the selected fill style."),
      ["precise", [16, 16], "crosshair"],
    );
  }

  shape(ctx, x, y, w, h) {
    // Normalize width and height
    if (w < 0) {
      x += w;
      w = -w;
    }
    if (h < 0) {
      y += h;
      h = -h;
    }

    if (w < PaintJSState.stroke_size || h < PaintJSState.stroke_size) {
      ctx.fillStyle = ctx.strokeStyle;
      const radius = Math.min(8, w / 2, h / 2);
      draw_rounded_rectangle(ctx, x, y, w, h, radius, radius, false, true);
    } else {
      const radius = Math.min(
        8,
        (w - PaintJSState.stroke_size) / 2,
        (h - PaintJSState.stroke_size) / 2,
      );
      draw_rounded_rectangle(
        ctx,
        x + Math.floor(PaintJSState.stroke_size / 2),
        y + Math.floor(PaintJSState.stroke_size / 2),
        w - PaintJSState.stroke_size,
        h - PaintJSState.stroke_size,
        radius,
        radius,
        PaintJSState.stroke,
        PaintJSState.fill,
      );
    }
  }
}
