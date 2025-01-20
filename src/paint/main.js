import { PaintJSState } from "./state";
import { initApp } from "./app.js";
import { initSession } from "./session.js";

class Drawjs {
    constructor(paintState) {
        this.paintState = paintState; // 상태 관리 객체
    }

    async create(canvasAreaQuery = ".canvas-area") {
        await initApp(canvasAreaQuery);
        initSession();

        window.PaintJSState = PaintJSState;
    }
    undo(){
        
    }
    redo(){

    }
}

export let PaintJS;

export function getDrawjs() {
    if (!PaintJS) {
        PaintJS = new Drawjs(PaintJSState);
    }
    return PaintJS;
}

function getState() {
    return PaintJSState;
}
