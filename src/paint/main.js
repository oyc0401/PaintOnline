import { PaintJSState } from "./state.js";
import { EventManager } from "./eventManager.js";
import { EventHandler } from "./eventHandler.js";
import { localStore } from "./storage.js";

import { initApp } from "./app.js";
import { initSesstion } from "./session.js";
import { defaultState } from "./defaultState.js";

class Paint {
    constructor(paintState, eventManager, localStore) {
        this.paintState = paintState; // 상태 관리 객체
        this.eventManager = eventManager; // 이벤트 관리 객체
        this.localStore = localStore;
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

    create(canvasAreaQuery = '.canvas-area') {
        initState(this.paintState, this.eventManager);
        initApp(canvasAreaQuery);
        initSesstion();
    }
}

function initState(stateProxy, eventManager){
    const eventHandler = new EventHandler(eventManager)
    const initialState = new Proxy(defaultState(), eventHandler);
    stateProxy.changeState(initialState);
}

const eventManager = new EventManager();
export const PaintJS = new Paint(PaintJSState, eventManager, localStore);
