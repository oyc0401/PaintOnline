export class EventHandler {
  constructor(eventManager) {
    this.eventManager = eventManager; // 이벤트 매니저를 저장
  }

  get(target, prop) {
    return Reflect.get(target, prop);
  }

  set(target, prop, value) {
    if (prop === "selected_tool") {
      console.log('change tool!')
      this.eventManager.emit("changeTool", value); // 이벤트 발생
    }

    // 다수의 이벤트 발생...
    
    return Reflect.set(target, prop, value);
  }
}