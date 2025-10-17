import log from 'loglevel';
import { Point } from '../utils/mathUtils'

const MIN_INERTIAL_SPEED = 0.1

export enum FingerOperationType {
    Start = 'start',
    Move = 'move',
    End = 'end',
    // 惯性运动产生的path
    Inertial = 'inertial',
    InertialEnd = 'inertialEnd',
}

const OPERATION_STAGE = [
    FingerOperationType.Start,
    FingerOperationType.Move,
    FingerOperationType.End,
    FingerOperationType.Inertial,
    FingerOperationType.InertialEnd,
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

// S=vt-0.5at^2
function getInertialTimingFunction(initSpeed: number, deceleration: number) {
    return (timeSpend: number) => {
        const distance = initSpeed * timeSpend - 0.5 * deceleration * timeSpend ** 2
        return distance
    }
}

// Finger类从mouseDown（或touchStart等）事件发生时产生，在抬起或惯性结束后销毁

export class Finger {
    private path: FingerPathItem[] = []
    private eventListeners: Map<FingerOperationType, ((item: FingerPathItem) => void)[]> = new Map()
    private isDestroyed = false
    private touchId = -1
    private isMoving = false
    private currentOperationType: FingerOperationType = FingerOperationType.Start
    static createFingersByEvent(event: MouseEvent | TouchEvent, options?: Options) {
        const fingers: Finger[] = []
        if (event instanceof MouseEvent) {
            const finger = new Finger(event, options)
            fingers.push(finger)
        } else if (event instanceof TouchEvent) {
            // 触摸可能有多个手指，每个手指对应一个Finger实例
            for (const touch of event.changedTouches) {
                const finger = new Finger(touch, options)
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
    constructor(event: supportedEvents, private options: Options | undefined = {}) {
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
        const touch = [...e.changedTouches].find(t => t.identifier === this.touchId)
        if (!touch) {
            return
        }
        const moveItem = this.pushNewPathItem({ x: touch.clientX, y: touch.clientY }, touch, FingerOperationType.Move)
        this.triggerEvent(FingerOperationType.Move, moveItem)
        this.isMoving = true
        this.printFinger(FingerOperationType.Move)
    }
    private handleDocumentEnd = (e: MouseEvent) => {
        if (this.isDestroyed) {
            return
        }
        const endItem = this.pushNewPathItem({ x: e.clientX, y: e.clientY }, e, FingerOperationType.End)
        console.log('[Finger] mouse END, ', this.path)
        this.triggerEvent(FingerOperationType.End, endItem)
        if (this.options?.inertial) {
            this.handleInertial()
        } else {
            this.destroy()
        }
    }
    private handleDocumentTouchEnd = (e: TouchEvent) => {
        if (this.isDestroyed) {
            return
        }
        const touch = [...e.changedTouches].find(t => t.identifier === this.touchId)
        if (!touch) {
            return
        }

        const endItem = this.pushNewPathItem({ x: touch.clientX, y: touch.clientY }, touch, FingerOperationType.End)
        log.info('[Finger] touch END, ', this.path)
        this.triggerEvent(FingerOperationType.End, endItem)
        if (this.options?.inertial) {
            this.handleInertial()
        } else {
            this.destroy()
        }
    }
    private handleInertial = () => {
        // 本函数时间单位均为毫秒
        if (this.isDestroyed || !this.isAfterStage(FingerOperationType.End)) {
            return
        }
        // 先随手往上平移100px，1s
        const startTime = Date.now()
        const moveList = this.getPath(FingerOperationType.Move)
        const beforeLastMove = moveList[moveList.length - 2]
        const lastMove = moveList[moveList.length - 1]
        if (!lastMove || !beforeLastMove) {
            this.destroy()
            return
        }
        const duration = lastMove.timestamp - beforeLastMove.timestamp
        const distance = Math.sqrt(Math.pow(lastMove.point.x - beforeLastMove.point.x, 2) + Math.pow(lastMove.point.y - beforeLastMove.point.y, 2))
        // 速度，单位：px/ms
        const speed = distance / duration
        if (speed < MIN_INERTIAL_SPEED) {
            this.destroy()
            return
        }
        // 减速度
        const deceleration = 0.005
        // 移动时间，速度除以减速度
        const movementDuration = speed / deceleration
        const timingFunction = getInertialTimingFunction(speed, deceleration)
        // 单位向量
        const directionVector = {
            x: (lastMove.point.x - beforeLastMove.point.x) / distance,
            y: (lastMove.point.y - beforeLastMove.point.y) / distance
        }
        log.info('[Finger] inertial, movementDuration: ', movementDuration, 'ms directionVector: ', directionVector, ' speed: ', speed, 'px/ms deceleration: ', deceleration, ' duration: ', duration, 'ms')
        const job = () => {
            if (this.isDestroyed) {
                return
            }
            const timeSpend = Date.now() - startTime
            const d = timingFunction(timeSpend)
            if (timeSpend > movementDuration) {
                const finalD = timingFunction(movementDuration)
                const offsetVector = {
                    x: directionVector.x * finalD,
                    y: directionVector.y * finalD
                }
                // 时间超出则直接跳到结果
                const newPoint = {
                    x: lastMove.point.x + offsetVector.x,
                    y: lastMove.point.y + offsetVector.y
                }
                const inertialItem = this.pushNewPathItem(newPoint, lastMove.event, FingerOperationType.InertialEnd)
                console.log('[Finger] inertial END, ', this.path)
                this.triggerEvent(FingerOperationType.InertialEnd, inertialItem)
                this.destroy()
                return
            }
            const offsetVector = {
                x: directionVector.x * d,
                y: directionVector.y * d
            }
            const newPoint = {
                x: lastMove.point.x + offsetVector.x,
                y: lastMove.point.y + offsetVector.y
            }
            const inertialItem = this.pushNewPathItem(newPoint, lastMove.event, FingerOperationType.Inertial)
            this.triggerEvent(FingerOperationType.Inertial, inertialItem)
            requestAnimationFrame(job)
        }
        job()
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
        this.options?.onDestroy?.(this)

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
