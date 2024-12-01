import { PaintJSState } from "./state.js";
import { createApp } from "./createApp.js";

class Paint {
    constructor(paintState) {
        this.paintState = paintState; // 상태 관리 객체
    }

    create(canvasAreaQuery = '.canvas-area') {
        createApp(canvasAreaQuery);
    }
}



export const PaintJS = new Paint(PaintJSState);
