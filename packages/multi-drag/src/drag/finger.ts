import type { Point } from '@system-ui-js/multi-drag-core'

export enum FingerOperationType {
    Start = 'start',
    Move = 'move',
    End = 'end'
}

export interface FingerPathItem {
    point: Point
    timestamp: number
    type: FingerOperationType
    event?: PointerEvent
}

export interface FingerOptions {
    onDestroy?: (finger: Finger) => void
}

export class Finger {
    private readonly path: FingerPathItem[] = []
    private readonly eventListeners = new Map<
        FingerOperationType,
        ((item: FingerPathItem) => void)[]
    >()
    private isDestroyed = false
    private isMoving = false
    readonly pointerId: number

    constructor(event: PointerEvent, private readonly options: FingerOptions = {}) {
        this.pointerId = event.pointerId
        this.record(FingerOperationType.Start, event)
    }

    record(type: FingerOperationType, event: PointerEvent) {
        const item: FingerPathItem = {
            point: { x: event.clientX, y: event.clientY },
            timestamp: event.timeStamp,
            type,
            event
        }
        this.path.push(item)
        if (type === FingerOperationType.Move) {
            this.isMoving = true
        }
        this.eventListeners.get(type)?.forEach((callback) => {
            callback(item)
        })
        if (type === FingerOperationType.End) {
            this.destroy()
        }
        return item
    }

    getPath(type?: FingerOperationType) {
        return type ? this.path.filter((item) => item.type === type) : this.path
    }

    getLastOperation(type?: FingerOperationType) {
        if (!type) {
            return this.path.at(-1)
        }
        return this.path.filter((item) => item.type === type).at(-1)
    }

    addEventListener(
        type: FingerOperationType,
        callback: (item: FingerPathItem) => void
    ) {
        const callbacks = this.eventListeners.get(type) || []
        callbacks.push(callback)
        this.eventListeners.set(type, callbacks)
    }

    removeEventListener(
        type: FingerOperationType,
        callback?: (item: FingerPathItem) => void
    ) {
        if (!callback) {
            this.eventListeners.set(type, [])
            return
        }
        this.eventListeners.set(
            type,
            (this.eventListeners.get(type) || []).filter((item) => item !== callback)
        )
    }

    getIsMoving() {
        return this.isMoving
    }

    getIsDestroyed() {
        return this.isDestroyed
    }

    destroy() {
        if (this.isDestroyed) {
            return
        }
        this.isDestroyed = true
        this.options.onDestroy?.(this)
    }
}
