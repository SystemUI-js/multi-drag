import log from 'loglevel';
import { Point } from '../utils/mathUtils'

export enum FingerOperationType {
    Start = 'start',
    Move = 'move',
    End = 'end',
}

const OPERATION_STAGE = [
    FingerOperationType.Start,
    FingerOperationType.Move,
    FingerOperationType.End,
]

export interface FingerPathItem {
    // 全局坐标
    point: Point;
    timestamp: number;
    type: FingerOperationType;
    event: PointerEvent
}

export interface Options {
    inertial?: boolean
    inertialOnlyOnTouch?: boolean
    onDestroy?: (finger: Finger) => void
}

// Finger类从mouseDown（或touchStart等）事件发生时产生，在抬起后销毁

export class Finger {
    // 手指路径，记录手指移动路径
    private path: FingerPathItem[] = []
    private eventListeners: Map<FingerOperationType, ((item: FingerPathItem) => void)[]> = new Map()
    private isDestroyed = false
    private readonly pointerId: number
    private isMoving = false
    private currentOperationType: FingerOperationType = FingerOperationType.Start
    constructor(event: PointerEvent, private options: Options | undefined = {}) {
        const point = { x: event.clientX, y: event.clientY }
        // 初始事件入path
        const startItem = this.pushNewPathItem(point, event, FingerOperationType.Start)
        this.triggerEvent(FingerOperationType.Start, startItem)
        // 使用 pointerId 替代 touchId
        this.pointerId = event.pointerId
        this.pointerHandlers = {
            handleDocumentMove: this.handleDocumentMove.bind(this),
            handleDocumentEnd: this.handleDocumentEnd.bind(this)
        }
        // 创建document事件监听，用于捕获后续事件
        document.addEventListener('pointermove', this.pointerHandlers.handleDocumentMove)
        document.addEventListener('pointerup', this.pointerHandlers.handleDocumentEnd)
        document.addEventListener('pointercancel', this.pointerHandlers.handleDocumentEnd)
        document.addEventListener('pointercancel', (e) => {
            log.info('pointercancel', e)
        })
        document.addEventListener('pointerup', (e) => {
            log.info('pointerup', e)
        })
    }
    private pointerHandlers: { [handlerName: string]: (e: PointerEvent) => void } = {}
    getPath(type?: FingerOperationType) {
        return type ? this.path.filter(item => item.type === type) : this.path
    }
    private pushNewPathItem(point: Point, event: PointerEvent, type: FingerOperationType) {
        const timestamp = Date.now()
        const item = { point, timestamp, type, event }
        this.path.push(item)
        return item
    }
    private triggerEvent(type: FingerOperationType, item: FingerPathItem) {
        this.currentOperationType = type
        const callbacks = this.eventListeners.get(type)
        callbacks?.forEach(callback => callback(item))
    }
    addEventListener(type: FingerOperationType, callback: (item: FingerPathItem) => void): void {
        const callbacks = this.eventListeners.get(type) || []
        callbacks.push(callback)
        this.eventListeners.set(type, callbacks)
    }
    removeEventListener(type: FingerOperationType, callback?: (item?: FingerPathItem) => void) {
        if (!callback) {
            this.eventListeners.set(type, [])
            return
        }
        const callbacks = this.eventListeners.get(type) || []
        this.eventListeners.set(type, callbacks.filter(cb => cb !== callback))
    }
    // 判断阶段，在哪个阶段以后
    private isAfterStage(type: FingerOperationType) {
        const indexOfCurrentType = OPERATION_STAGE.indexOf(this.currentOperationType)
        const indexOfType = OPERATION_STAGE.indexOf(type)
        return indexOfCurrentType >= indexOfType
    }
    // 处理document事件，将后续事件入path
    private handleDocumentMove = (e: PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        log.info('[Finger] pointer MOVE, ', e.pressure)


        if (this.isDestroyed || !this.isAfterStage(FingerOperationType.Start)) {
            return
        }
        // 只处理与当前 pointerId 匹配的事件
        if (e.pointerId !== this.pointerId) {
            return
        }
        const moveItem = this.pushNewPathItem({ x: e.clientX, y: e.clientY }, e, FingerOperationType.Move)
        this.triggerEvent(FingerOperationType.Move, moveItem)
        this.isMoving = true
    }
    private handleDocumentEnd = (e: PointerEvent) => {
        if (this.isDestroyed) {
            return
        }
        // 只处理与当前 pointerId 匹配的事件
        if (e.pointerId !== this.pointerId) {
            return
        }
        const endItem = this.pushNewPathItem({ x: e.clientX, y: e.clientY }, e, FingerOperationType.End)
        log.info('[Finger] pointer END, ', this.path)
        this.triggerEvent(FingerOperationType.End, endItem)
        this.destroy()
    }
    getIsMoving() {
        return this.isMoving
    }
    getIsDestroyed() {
        return this.isDestroyed
    }
    getLastOperation(type?: FingerOperationType): FingerPathItem | undefined {
        if (type) {
            const items = this.path.filter(item => item.type === type)
            return items[items.length - 1]
        }
        return this.path[this.path.length - 1]
    }
    destroy() {
        document.removeEventListener('pointermove', this.pointerHandlers.handleDocumentMove)
        document.removeEventListener('pointerup', this.pointerHandlers.handleDocumentEnd)
        document.removeEventListener('pointercancel', this.pointerHandlers.handleDocumentEnd)
        this.options?.onDestroy?.(this)

        for (const type of Object.values(FingerOperationType)) {
            this.removeEventListener(type)
        }
        this.isDestroyed = true
        this.isMoving = false
    }
}
