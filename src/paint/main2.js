import { PaintJSState } from "./state";
import { initApp } from "./app.js";
import { initSession } from "./session.js";
import { defaultState } from "./defaultState.js";

class PaintJS {
    constructor(paintState) {
        this.paintState = paintState; // 상태 관리 객체
    }

    async create(canvasAreaQuery = '.canvas-area') {
        initState();
        await initApp(canvasAreaQuery);
        initSession();

        window.PaintJSState=PaintJSState;
    }

    get state(){
        return this.paintState;
    }
}

const paintjsSingleton;

export function getPaintjs(){
    return paintjsSingleton;
}

///
drawjs.create('.canvas-area');

drawjs.undo();
drawjs.redo();
drawjs.changeTool('PENCIL');
drawjs.onchangeHistory((undoCount, redoCount)=>{
    
})

drawjs.save();

drawjs.onchangeLayer((layers)=>{
    
});

drawjs.setLayer('key');
drawjs.hideLayer('key');
drawjs.addLayer();
drawjs.switchLayer('layer1', 'layer2');

drawjs.download();
drawjs.new();
drawjs.open();










