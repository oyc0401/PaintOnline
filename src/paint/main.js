import { PaintJSState } from "./state.js";
import { EventManager } from "./eventManager.js";
import { PaintHandler } from "./handler.js";
import { localStore } from "./storage.js";

import { initApp } from "./app.js";
import { initSesstion } from "./session.js";
import { initState } from "./appstate.js";

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
        initState(PaintJSState);
        initApp();
        initSesstion();
    }

    initSession() {}

    newSession() {
        window.paintSession.new_local_session();
    }
}

const eventManager = new EventManager();
export const PaintJS = new Paint(PaintJSState, eventManager, localStore);
