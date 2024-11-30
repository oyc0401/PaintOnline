export class EventManager {
    constructor() {
        this.listeners = {}; // 이벤트 이름별 리스너
    }

    // 이벤트 등록
    on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    // 이벤트 발행
    emit(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach((callback) => callback(data));
        }
    }

    // 특정 이벤트 제거
    off(eventName, callback) {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = this.listeners[eventName].filter(
                (cb) => cb !== callback
            );
        }
    }
}