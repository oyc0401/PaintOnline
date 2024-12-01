import { initApp } from "./app.js";
import { initSesstion } from "./session.js";
import { defaultState } from "./defaultState.js";
import { observable, reaction ,configure,runInAction} from 'mobx';
import { PaintJSState } from "./state.js";

export function createApp(canvasAreaQuery = '.canvas-area') {
    initState();
    initApp(canvasAreaQuery);
    initSesstion();
}

function initState(){
    runInAction(() => {
        Object.assign(PaintJSState, defaultState());
    });
}
