import { observable, configure } from "mobx";

configure({ enforceActions: "never" }); // strict-mode 비활성화

const stateStore = {};

function getMainCanvas() {
  //console.log(stateStore.layers[stateStore.activeLayerIndex].canvas);
  return stateStore.layers[stateStore.activeLayerIndex].canvas;
}
function getMainCtx() {
  // console.log('ctx:',stateStore.layers[stateStore.activeLayerIndex].ctx);
  return stateStore.layers[stateStore.activeLayerIndex].ctx;
}

function getDrawLayer() {
  const canvas = stateStore.layers[stateStore.activeLayerIndex].drawCanvas;
  return canvas;
}

const handler = {
  get(target, prop) {
    // 특정 속성('undos', 'redos')은 PaintMobXState에서 가져옴
    if (["main_canvas"].includes(prop)) {
      // console.log()
      return getMainCanvas();
    }
    if (["main_ctx"].includes(prop)) {
      //console.error(`[GET] Accessing MobX state: ${prop}`);
      return getMainCtx();
    }
    if (["draw_canvas"].includes(prop)) {
      //console.error(`[GET] Accessing MobX state: ${prop}`);
      return getDrawLayer();
    }

    // 나머지는 기존 target에서 가져옴
    return Reflect.get(target, prop);
  },

  set(target, prop, value) {
    // 특정 속성('undos', 'redos')은 PaintMobXState에 설정

    // 나머지는 기존 target에 설정
    return Reflect.set(target, prop, value);
  },
};

export const PaintJSState = new Proxy(stateStore, handler);

export const PaintMobXState = observable({
  undo_length: 0,
  redo_length: 0,
  activeLayerIndex: 1,
  lastChanged: 0,
});
