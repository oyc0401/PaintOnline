import { PaintJSState } from "./state.js";
import { EventManager } from "./eventManager.js";
import { PaintHandler } from "./handler.js";
import { localStore } from "./storage.js";
import { make_canvas } from "./src/helpers.js";
import { get_tool_by_id, make_history_node } from "./src/functions.js";
import { TOOL_PENCIL } from "./src/tools.js";
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

        this.paintState.root_history_node = make_history_node({ name: "App Not Loaded Properly - Please send a bug report." }); // will be replaced

        this.paintState.default_tool = get_tool_by_id(TOOL_PENCIL);
        this.paintState.root_history_node = make_history_node({ name: "App Not Loaded Properly - Please send a bug report." }); // will be replaced
    
    }

    initSession() {}

    newSession() {
        window.paintSession.new_local_session();
    }
}

const eventManager = new EventManager();
export const PaintJS = new Paint(PaintJSState, eventManager, localStore);
