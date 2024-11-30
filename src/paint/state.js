const stateStore = {
    state: undefined, // 초기 상태
  changeState: function (newState) {
    this.state = newState; // 'this'는 PaintState를 참조
  },
};

const handler = {
  get(target, prop) {
    if (['changeState', 'state'].includes(prop)) {
      return Reflect.get(target, prop); // target의 속성을 안전하게 가져옴
    }
     return Reflect.get(target.state, prop);
  },

  set(target, prop, value) {
    if (prop === 'state') {
      return Reflect.set(target, prop, value); // state 자체를 설정
    }
    // state 객체 내부 속성 설정
    return Reflect.set(target.state, prop, value);
  },
};

export const PaintJSState = new Proxy(stateStore, handler);
