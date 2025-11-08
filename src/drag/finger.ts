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
    event: supportedEvents
}

type supportedEvents = MouseEvent | Touch

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
    private readonly touchId: number | undefined
    private isMoving = false
    private currentOperationType: FingerOperationType = FingerOperationType.Start
    // 创建手指实例，根据事件类型（鼠标或触摸）创建相应的Finger实例
    static createFingersByEvent(event: MouseEvent | TouchEvent, options?: Options) {
        const fingers: Finger[] = []
        if (event instanceof MouseEvent) {
            const finger = new Finger(event, options)
            fingers.push(finger)
        } else if (event instanceof TouchEvent) {
            // 触摸可能有多个手指，每个手指对应一个Finger实例
            // 因为拖动会找不到touchId，所以这里又改回用changedTouches
            for (const touch of [...(event.changedTouches.length ? event.changedTouches : event.touches)]) {
                const finger = new Finger(touch, options)
                fingers.push(finger)
            }
        }
        return fingers
    }
    constructor(event: supportedEvents, private options: Options | undefined = {}) {
        const point = { x: event.clientX, y: event.clientY }
        // 初始事件入path
        const startItem = this.pushNewPathItem(point, event, FingerOperationType.Start)
        this.triggerEvent(FingerOperationType.Start, startItem)
        // Jest不支持Touch，暂时这样处理赋值
        if (typeof (event as Touch).identifier === 'number') {
            this.touchId = (event as Touch).identifier
        }
        this.mouseHandlers = {
            handleDocumentMove: this.handleDocumentMove.bind(this),
            handleDocumentEnd: this.handleDocumentEnd.bind(this)
        }
        this.touchHandlers = {
            handleDocumentTouchMove: this.handleDocumentTouchMove.bind(this),
            handleDocumentTouchEnd: this.handleDocumentTouchEnd.bind(this)
        }
        // 创建document事件监听，用于捕获后续事件
        document.addEventListener('mousemove', this.mouseHandlers.handleDocumentMove)
        document.addEventListener('mouseup', this.mouseHandlers.handleDocumentEnd)
        document.addEventListener('touchmove', this.touchHandlers.handleDocumentTouchMove)
        document.addEventListener('touchend', this.touchHandlers.handleDocumentTouchEnd)
    }
    private mouseHandlers: { [handlerName: string]: (e: MouseEvent) => void } = {}
    private touchHandlers: { [handlerName: string]: (e: TouchEvent) => void } = {}
    getPath(type?: FingerOperationType) {
        return type ? this.path.filter(item => item.type === type) : this.path
    }
    private pushNewPathItem(point: Point, event: supportedEvents, type: FingerOperationType) {
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
    private handleDocumentMove = (e: MouseEvent) => {
        if (this.isDestroyed || !this.isAfterStage(FingerOperationType.Start)) {
            return
        }
        const moveItem = this.pushNewPathItem({ x: e.clientX, y: e.clientY }, e, FingerOperationType.Move)
        this.triggerEvent(FingerOperationType.Move, moveItem)
        this.isMoving = true
    }
    private handleDocumentTouchMove = (e: TouchEvent) => {
        if (this.isDestroyed || !this.isAfterStage(FingerOperationType.Start)) {
            return
        }
        const touch = [...e.changedTouches].find(t => t.identifier === this.touchId) || [...e.touches].find(t => t.identifier === this.touchId)
        if (!touch) {
            return
        }
        const moveItem = this.pushNewPathItem({ x: touch.clientX, y: touch.clientY }, touch, FingerOperationType.Move)
        this.triggerEvent(FingerOperationType.Move, moveItem)
        this.isMoving = true
    }
    private handleDocumentEnd = (e: MouseEvent) => {
        if (this.isDestroyed) {
            return
        }
        const endItem = this.pushNewPathItem({ x: e.clientX, y: e.clientY }, e, FingerOperationType.End)
        log.info('[Finger] mouse END, ', this.path)
        this.triggerEvent(FingerOperationType.End, endItem)
        this.destroy()
    }
    private handleDocumentTouchEnd = (e: TouchEvent) => {
        if (this.isDestroyed) {
            return
        }
        // 因为拖动会找不到touchId，所以这里又改回用changedTouches，在特殊情况下changedTouches可能为空
        const touch = [...e.changedTouches, ...e.touches].find(t => t.identifier === this.touchId)
        if (!touch) {
            return
        }

        const endItem = this.pushNewPathItem({ x: touch.clientX, y: touch.clientY }, touch, FingerOperationType.End)
        log.info('[Finger] touch END, ', this.path)
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
        document.removeEventListener('mousemove', this.mouseHandlers.handleDocumentMove)
        document.removeEventListener('mouseup', this.mouseHandlers.handleDocumentEnd)
        document.removeEventListener('touchmove', this.touchHandlers.handleDocumentTouchMove)
        document.removeEventListener('touchend', this.touchHandlers.handleDocumentTouchEnd)
        this.options?.onDestroy?.(this)

        for (const type of Object.values(FingerOperationType)) {
            this.removeEventListener(type)
        }
        this.isDestroyed = true
        this.isMoving = false
    }
}
