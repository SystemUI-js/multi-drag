import log from 'loglevel';
import { Point } from '../utils/mathUtils'
import { DragOperationType } from './base';

export enum FingerOperationType {
    Start = 'start',
    Move = 'move',
    End = 'end',
    // 惯性运动产生的path
    Inertial = 'inertial'
}

export interface FingerPathItem {
    // 全局坐标
    point: Point;
    timestamp: number;
    type: FingerOperationType;
    // 局部坐标
    localPoint: Point;
    event: supportedEvents
}

type supportedEvents = MouseEvent | Touch

export interface Options {
    inertial?: boolean
    inertialOnlyOnTouch?: boolean
}

// Finger类从mouseDown（或touchStart等）事件发生时产生，在抬起或惯性结束后销毁

export class Finger {
    private path: FingerPathItem[] = []
    private eventListeners: Map<FingerOperationType, ((item: FingerPathItem) => void)[]> = new Map()
    private isDestroyed = false
    private touchId = -1
    private isMoving = false
    static createFingersByEvent(element: HTMLElement, event: MouseEvent | TouchEvent, options?: Options) {
        const fingers: Finger[] = []
        if (event instanceof MouseEvent) {
            const finger = new Finger(element, event, options)
            fingers.push(finger)
        } else if (event instanceof TouchEvent) {
            // 触摸可能有多个手指，每个手指对应一个Finger实例
            for (const touch of event.changedTouches) {
                const finger = new Finger(element, touch, options)
                fingers.push(finger)
            }
        }
        return fingers
    }
    static getCenterPoint(fingers: Finger[], type: FingerOperationType = FingerOperationType.Start) {
        if (!fingers.length) {
            return { x: 0, y: 0 }
        }
        let totalX = 0
        let totalY = 0
        fingers.forEach(finger => {
            // 从后往前找，尽量用最后一个
            const item = [...finger.path].reverse().find(item => item.type === type)
            if (item) {
                totalX += item.point.x
                totalY += item.point.y
            }
        })
        const centerX = totalX / fingers.length || 0
        const centerY = totalY / fingers.length || 0
        return { x: centerX, y: centerY }
    }
    constructor(private element: HTMLElement, event: supportedEvents, private options: Options | undefined = {}) {
        const point = { x: event.clientX, y: event.clientY }
        // 初始事件入path
        const startItem = this.pushNewPathItem(point, event, FingerOperationType.Start)
        this.triggerEvent(FingerOperationType.Start, startItem)
        if (event instanceof Touch) {
            this.touchId = event.identifier
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
        this.printFinger(FingerOperationType.Start)
    }
    private mouseHandlers: { [handlerName: string]: (e: MouseEvent) => void } = {}
    private touchHandlers: { [handlerName: string]: (e: TouchEvent) => void } = {}
    // 全局坐标变元素局部坐标
    private static getLocalPoint(element: HTMLElement, point: Point) {
        const rect = element.getBoundingClientRect()
        return {
            x: point.x - rect.left,
            y: point.y - rect.top
        }
    }
    getPath(type?: FingerOperationType) {
        return type ? this.path.filter(item => item.type === type) : this.path
    }
    private pushNewPathItem(point: Point, event: supportedEvents, type: FingerOperationType) {
        const timestamp = Date.now()
        const localPoint = Finger.getLocalPoint(this.element, point)
        const item = { point, timestamp, type, localPoint, event }
        this.path.push(item)
        return item
    }
    private triggerEvent(type: FingerOperationType, item: FingerPathItem) {
        console.log('triggerEvent', type, item)
        const callbacks = this.eventListeners.get(type)
        callbacks?.forEach(callback => callback(item))
    }
    addEventListener(type: FingerOperationType, callback: (item: FingerPathItem) => void) {
        const callbacks = this.eventListeners.get(type) || []
        callbacks.push(callback)
        this.eventListeners.set(type, callbacks)
    }
    removeEventListener(type: FingerOperationType, callback?: (item: FingerPathItem) => void) {
        if (!callback) {
            this.eventListeners.set(type, [])
            return
        }
        const callbacks = this.eventListeners.get(type) || []
        this.eventListeners.set(type, callbacks.filter(cb => cb !== callback))
    }
    // 处理document事件，将后续事件入path
    private handleDocumentMove = (e: MouseEvent) => {
        const moveItem = this.pushNewPathItem({ x: e.clientX, y: e.clientY }, e, FingerOperationType.Move)
        this.triggerEvent(FingerOperationType.Move, moveItem)
        this.isMoving = true
    }
    private handleDocumentTouchMove = (e: TouchEvent) => {
        // console.log('handleDocumentTouchMove', e.changedTouches[0].identifier)
        // console.log(e.changedTouches.length)
        const touch = [...e.changedTouches].find(t => t.identifier === this.touchId)
        if (!touch) {
            // console.log('return')
            return
        }
        const moveItem = this.pushNewPathItem({ x: touch.clientX, y: touch.clientY }, touch, FingerOperationType.Move)
        this.triggerEvent(FingerOperationType.Move, moveItem)
        this.isMoving = true
        this.printFinger(FingerOperationType.Move)
    }
    private handleDocumentEnd = (e: MouseEvent) => {
        const endItem = this.pushNewPathItem({ x: e.clientX, y: e.clientY }, e, FingerOperationType.End)
        this.triggerEvent(FingerOperationType.End, endItem)
        if (this.options?.inertial) {
            this.handleInertial()
        } else {
            this.destroy()
        }
    }
    private handleDocumentTouchEnd = (e: TouchEvent) => {
        const touch = [...e.changedTouches].find(t => t.identifier === this.touchId)
        if (!touch) {
            // console.log('return')
            return
        }

        const endItem = this.pushNewPathItem({ x: touch.clientX, y: touch.clientY }, touch, FingerOperationType.End)
        this.triggerEvent(FingerOperationType.End, endItem)
        if (this.options?.inertial) {
            this.handleInertial()
        } else {
            this.destroy()
        }
    }
    private handleInertial = () => {
        const lastMove = this.getLastOperation(FingerOperationType.Move)
        const endItem = this.getLastOperation(FingerOperationType.End)
        if (lastMove && endItem) {
            const duration = endItem.timestamp - lastMove.timestamp
            const distance = Math.sqrt(Math.pow(lastMove.point.x - endItem.point.x, 2) + Math.pow(lastMove.point.y - endItem.point.y, 2))
            const speed = distance / duration
            // 减速度
            const deceleration = 0.5
            const newSpeed = speed * Math.exp(-deceleration * duration)
            const angle = Math.atan2(lastMove.point.y - endItem.point.y, lastMove.point.x - endItem.point.x)
            const newPoint = {
                x: endItem.point.x + speed * Math.cos(angle) * duration,
                y: endItem.point.y + speed * Math.sin(angle) * duration
            }

            const moveItem = this.pushNewPathItem(newPoint, endItem.event, FingerOperationType.Inertial)
            this.triggerEvent(FingerOperationType.Inertial, moveItem)
        }
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
    printFinger(type: FingerOperationType) {
        const existContainer = document.querySelector(`.finger-${this.touchId}-${type}`)
        let container: HTMLDivElement
        if (existContainer) {
            container = existContainer as HTMLDivElement
        } else {
            container = document.createElement('div')
            container.className = `finger-${this.touchId}-${type}`
            document.body.appendChild(container)
        }
        const point = this.getLastOperation(type)?.point
        container.style.position = 'fixed'
        container.style.left = `${point?.x || 0}px` || '0px'
        container.style.top = `${point?.y || 0}px` || '0px'
        container.style.width = '70px'
        container.style.height = '70px'
        container.style.zIndex = '1000'
        container.style.transform = 'translate(-50%, -50%)'
        container.style.borderRadius = '50%'
        // 加个阴影
        container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)'
        container.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'
    }
    destroy() {
        document.removeEventListener('mousemove', this.mouseHandlers.handleDocumentMove)
        document.removeEventListener('mouseup', this.mouseHandlers.handleDocumentEnd)
        document.removeEventListener('touchmove', this.touchHandlers.handleDocumentTouchMove)
        document.removeEventListener('touchend', this.touchHandlers.handleDocumentTouchEnd)
        for (const type of Object.values(FingerOperationType)) {
            this.removeEventListener(type)
        }
        this.isDestroyed = true
        this.isMoving = false
        for (const type of Object.values(FingerOperationType)) {
            const container = document.querySelector(`.finger-${this.touchId}-${type}`)
            container && document.body.removeChild(container)
        }
    }
}
