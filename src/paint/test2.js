class StateStore {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = {};
    this.mappings = {};
  }

  changeState(newState) {
    Object.assign(this.state, newState);
  }
  on(eventNames, callback) {
    // 이벤트 이름을 공백으로 분리
    const events = eventNames.split(" ").filter((event) => event.trim() !== "");

    // 각 이벤트에 대해 콜백 등록
    events.forEach((eventName) => {
      if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
      }
      this.listeners[eventName].push(callback);
    });
  }

  off(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(
        (cb) => cb !== callback,
      );
    }
  }

  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((callback) => callback(data));
    }
  }

  bindEvents(mapping) {
    for (const [eventName, action] of Object.entries(mapping)) {
      const { prop, action: actionType } = action;
      if (!this.mappings[prop]) {
        this.mappings[prop] = {};
      }
      this.mappings[prop][actionType] = eventName;
    }
  }
}

// StateStore 클래스의 모든 프로퍼티와 메서드를 자동으로 감지하여 배열로 반환하는 함수
function getReservedProps(classConstructor) {
  const instanceProps = Object.getOwnPropertyNames(new classConstructor({}));
  const prototypeProps = Object.getOwnPropertyNames(classConstructor.prototype);
  return [...new Set([...instanceProps, ...prototypeProps])];
}

const RESERVED_PROPS = getReservedProps(StateStore);

function makeHandler() {
  return {
    get(target, prop) {
      if (RESERVED_PROPS.includes(prop)) {
        return Reflect.get(target, prop);
      }

      const result = Reflect.get(target.state, prop);
      const eventName = target.mappings[prop]?.get;
      if (eventName) {
        target.emit(eventName, result);
      }
      return result;
    },

    set(target, prop, value) {
      if (prop === "state" || RESERVED_PROPS.includes(prop)) {
        return Reflect.set(target, prop, value);
      }

      const result = Reflect.set(target.state, prop, value);
      const eventName = target.mappings[prop]?.set;
      if (eventName) {
        target.emit(eventName, value);
      }
      return result;
    },
  };
}

function makeState(initialState) {
  const stateStore = new StateStore(initialState);
  const handler = makeHandler();
  return new Proxy(stateStore, handler);
}

// 사용 예시
const state = makeState({ name: "Kim", age: 21 });

// 상태 변경
state.changeState({ name: "hello", age: 12 });

// 이벤트 매핑
state.bindEvents({
  changename: { action: "set", prop: "name" },
  getage: { action: "get", prop: "age" },
  changeage: { action: "set", prop: "age" },
});

// 이벤트 리스너 등록
state.on("changename", (name) => {
  console.log("이름이 변경되었습니다:", name);
});
state.on("getage", (age) => {
  console.log("나이에 접근했습니다:", age);
});

state.on("changename changeage", (val) => {
  console.log("변경되었습니다:", val);
});

// 상태 변경으로 이벤트 트리거
state.name = "Mike"; // 출력: 이름이 변경되었습니다: Mike

state.age; // 출력: 나이에 접근했습니다: 12

state.changeState({ name: "bar", age: 65 });

state.age; // 출력: 나이에 접근했습니다: 65

state.age=23;