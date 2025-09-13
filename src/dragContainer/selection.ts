import { Drag } from "../drag";
import { Point } from "../utils/mathUtils";

export class DragSelection {
    constructor() {
    }
    private startPoint?: Point
    private endPoint?: Point
    register(item: Drag | HTMLElement) {
        this.items.push(item)
    }
    unregister(item: Drag | HTMLElement) {
        this.items = this.items.filter(i => i !== item);
    }
    clearRegister() {
        this.items = []
    }
    private items: (Drag | HTMLElement)[] = []
    setStartPoint(point: Point) {
        this.startPoint = point
    }
    setEndPoint(point: Point) {
        this.endPoint = point
    }
    clearSelection() {
        this.startPoint = undefined
        this.endPoint = undefined
    }
    getSelectionRect(): DOMRect | null {
        if (!this.startPoint || !this.endPoint) {
            return null
        }
        const { x: startX, y: startY } = this.startPoint
        const { x: endX, y: endY } = this.endPoint
        return new DOMRect(
            Math.min(startX, endX),
            Math.min(startY, endY),
            Math.abs(endX - startX),
            Math.abs(endY - startY)
        )
    }
    getSelectedList() {
        // 通过当前的 selectionRect 与 rects 进行筛选
        const selectionRect = this.getSelectionRect()
        if (!selectionRect) {
            return []
        }
        return this.items.filter(item => {
            const rect = item instanceof Drag ? item.getElement().getBoundingClientRect() : item.getBoundingClientRect()
            return (
                selectionRect.left < rect.right &&
                selectionRect.right > rect.left &&
                selectionRect.top < rect.bottom &&
                selectionRect.bottom > rect.top
            )
        })
    }
    onDestroy() {
        this.clearRegister()
    }
}
