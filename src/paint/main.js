import { PaintState } from "./state.js";
import { EventManager } from "./eventManager.js";
import { PaintHandler } from "./handler.js";
import { localStore } from "./storage.js";
import { make_canvas } from "./src/helpers.js";

class Paint {
    constructor(paintState, eventManager, localStore) {
        this.paintState = paintState; // 상태 관리 객체
        this.eventManager = eventManager; // 이벤트 관리 객체
        this.localStore = localStore;
        this.paintHandler = new PaintHandler(paintState, eventManager);
        
    }

    get state() {
        return this.paintState;
    }
    get event() {
        return this.eventManager;
    }
    get handler() {
        return this.paintHandler;
    }

    get on() {
        return this.eventManager.on;
    }
    get off() {
        return this.eventManager.off;
    }
    get emit() {
        return this.eventManager.emit;
    }

    create() {
        const main_canvas = make_canvas();
        main_canvas.classList.add("main-canvas");
        this.paintState.main_canvas = main_canvas;
        this.paintState.main_ctx = main_canvas.ctx;
            
        const mask_canvas = make_canvas();
        mask_canvas.classList.add("mask-canvas");
        this.paintState.mask_canvas = mask_canvas;
        
    }

    initSession() {}

    newSession() {
        window.paintSession.new_local_session();
    }
}

const paintState = new PaintState();
const eventManager = new EventManager();
export const PaintJS = new Paint(paintState, eventManager, localStore);
