import { PaintJSState } from "./state.js";
import { initApp } from "./app.js";
import { initSession } from "./session.js";
import { defaultState } from "./defaultState.js";

class Paint {
    constructor(paintState) {
        this.paintState = paintState; // 상태 관리 객체
    }

    async create(canvasAreaQuery = '.canvas-area') {
        initState();
        await initApp(canvasAreaQuery);
        initSession();
        
        window.PaintJSState=PaintJSState;
    }
}

function initState() {
    Object.assign(PaintJSState, defaultState());
}


export const PaintJS = new Paint(PaintJSState);
