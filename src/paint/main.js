import { PaintJSState, PaintMobXState } from "./state";
import { initApp } from "./app.js";
import { initSession } from "./session.js";

import { undo, redo } from "./src/history.js";
import {
    get_tool_by_id,
    select_tool,
    file_save,
    file_new,
    file_open,
} from "../paint/src/functions.js";
import { reaction } from "mobx";
import { addLayer } from "../paint/layer";

export class Drawjs {
    constructor() {
        this.paintState = PaintJSState; // 상태 관리 객체
    }

    async create(canvasAreaQuery) {
        await initApp(canvasAreaQuery);
        initSession();

        window.PaintJSState = PaintJSState;
    }
    get state() {
        return this.paintState;
    }

    undo() {
        undo();
    }
    redo() {
        redo();
    }
    selectTool(toolId) {
        const toolObj = get_tool_by_id(toolId);
        select_tool(toolObj);
    }

    onchangeHistory(callback) {
        reaction(
            () => PaintMobXState.undo_length, // 감시할 상태
            (newValue) => {
                callback(PaintJSState.undos.length, PaintJSState.redos.length);
            },
        );
        reaction(
            () => PaintMobXState.undo_length, // 감시할 상태
            (newValue) => {
                callback(PaintJSState.undos.length, PaintJSState.redos.length);
            },
        );
    }
    downloadFile() {
        file_save();
    }
    newFile() {
        file_new();
    }
    openFile() {
        file_open;
    }

    onSaved(callback) {
        reaction(
            () => PaintMobXState.lastChanged, // 감시할 상태
            (newValue) => {
                callback(newValue);
            },
        );
    }

    onchangeLayer(callback) {
        reaction(
            () => PaintMobXState.lastChanged, // 감시할 상태
            (newValue) => {
                const layers = [];
                for (let key in PaintJSState.layerStore) {
                    let { layerId, name, imageUrl } =
                        PaintJSState.layerStore[key];
                    layers.push({
                        layerId,
                        name,
                        url: imageUrl,
                    });
                }

                callback(layers);
            },
        );
    }
    setLayer(layerId) {
        PaintJSState.activeLayerId = layerId;
        console.log("select:", PaintJSState.layerStore[layerId]);
    }

    addLayer() {
        addLayer();
    }

    setForegroundColor() {
        PaintJSState.selected_colors.foreground = color;
    }
    setBackgroundColor() {
        PaintJSState.selected_colors.background = color;
    }

    switchLayer(layer1, layer2) {}

    onchangeMousePosition(callback) {
        reaction(
            () => [
                PaintMobXState.position_mouse_active,
                PaintMobXState.position_mouse_x,
                PaintMobXState.position_mouse_y,
            ],
            ([ismove, x, y]) => {
                callback(ismove, { x, y });
            },
        );
    }
    onchangeCanvasPosition(callback) {
        reaction(
            () => [
                PaintMobXState.position_canvas_active,
                PaintMobXState.position_canvas_x,
                PaintMobXState.position_canvas_y,
            ],
            ([ismove, x, y]) => {
                callback(ismove, { x, y });
            },
        );
    }
    onchangeObjectPosition(callback) {
        reaction(
            () => [
                PaintMobXState.position_object_active,
                PaintMobXState.position_object_x,
                PaintMobXState.position_object_y,
            ],
            ([ismove, x, y]) => {
                callback(ismove, { x, y });
            },
        );
    }
}
