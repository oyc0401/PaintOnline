import { initApp } from "./app.js";
import { initSession} from "./session.js";
import { defaultState } from "./defaultState.js";
import { observable, reaction ,configure,runInAction} from 'mobx';
import { PaintJSState } from "./state.js";

export async function createApp(canvasAreaQuery = '.canvas-area') {
    initState();
    await initSession();
    initApp(canvasAreaQuery);
  //      initSessions();
    
}

function initState(){
   // PaintJSState = new Proxy(defaultState(), handler);
   // runInAction(() => {
        Object.assign(PaintJSState, defaultState());
    //});
}
