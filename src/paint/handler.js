export class PaintHandler {
    constructor(paintState, eventManager) {
        this.paintState = paintState; // 상태 관리 객체
        this.eventManager = eventManager; // 이벤트 관리 객체
    }

    // 상태 변경 및 이벤트 발행
    setFill(color) {
        this.paintState.fill = color;
        this.eventManager.emit("fillChange", color);
    }

    setStroke(stroke) {
        this.paintState.stroke = stroke;
        this.eventManager.emit("strokeChange", stroke);
    }

    setBrush(brush) {
        this.paintState.brush = brush;
        this.eventManager.emit("brushChange", brush);
    }
}
