console.log('JS 실행:','OnCanvasHelpLayer.js')
// @ts-check

import { OnCanvasObject } from "./OnCanvasObject.js";
import { make_canvas } from "./helpers.js";

export class OnCanvasDrawLayer extends OnCanvasObject {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {boolean} hideMainCanvasHandles
   * @param {number} [pixelRatio=1]
   */
  constructor(x, y, width, height, hideMainCanvasHandles, pixelRatio = 1) {
    super(x, y, width, height, hideMainCanvasHandles);

    this.$el.addClass("draw-layer");
    this.$el.css({
      pointerEvents: "none",
    });
    this.position();
    this.canvas = make_canvas(this.width * pixelRatio, this.height * pixelRatio);
    this.$el.append(this.canvas);
  }
}