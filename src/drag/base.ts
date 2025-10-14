import { Point } from '../utils/mathUtils'
import { defaultGetPose } from './drag'
import { Finger, FingerOperationType } from './finger'

export interface Options {
    // 支持最大的手指数量，默认1
    maxFingerCount?: number
    inertial?: boolean
    getPose?: (element: HTMLElement) => Pose
    setPose?: (element: HTMLElement, pose: Pose) => void
}

export enum DragOperationType {
    Start = 'start',
    Move = 'move',
    End = 'end',
}

export interface Pose {
    position: Point;
    rotation?: number;
    scale?: number;
}

export class DragBase {
    private fingers: Finger[] = []
    private events: Map<DragOperationType, ((fingers: Finger[]) => void)[]> = new Map()
    private currentOperationType: DragOperationType = DragOperationType.End
    protected initialPose: Pose
    constructor(protected element: HTMLElement, protected options?: Options) {
        this.initialPose = this.options?.getPose?.(this.element) || defaultGetPose(this.element)
        this._handleMouseDown = this.handleMouseDown.bind(this)
        this._handleTouchStart = this.handleTouchStart.bind(this)
        element.addEventListener('mousedown', this._handleMouseDown)
        element.addEventListener('touchstart', this._handleTouchStart)
    }
    // 预留
    private _handleMouseDown = (e: MouseEvent) => {}
    private _handleTouchStart = (e: TouchEvent) => {}
    private handleMouseDown = (e: MouseEvent) => {
        const maxFingerCount = this.options?.maxFingerCount ?? 1
        if (maxFingerCount !== -1 && this.fingers.length >= maxFingerCount) {
            return
        }
        if (e.button !== 0) {
            return
        }
        this.initialPose = this.options?.getPose?.(this.element) || defaultGetPose(this.element)
        const finger = new Finger(this.element, e)
        this.fingers.push(finger)
        finger.addEventListener(FingerOperationType.Move, this.handleFingerMove)
        if (this.options?.inertial) {
            finger.addEventListener(FingerOperationType.Inertial, this.handleFingerMoveComplete)
        } else {
            finger.addEventListener(FingerOperationType.End, this.handleFingerMoveComplete)
        }
        this.currentOperationType = DragOperationType.Start
        this.trigger(DragOperationType.Start)
    }
    private handleTouchStart = (e: TouchEvent) => {
        e.preventDefault()
        const maxFingerCount = this.options?.maxFingerCount ?? 1
        const fingers = Finger.createFingersByEvent(this.element, e)
        const validFingers = fingers.filter(finger => !finger.getIsDestroyed())
        this.initialPose = this.options?.getPose?.(this.element) || defaultGetPose(this.element)
        this.fingers.push(...validFingers.slice(0, maxFingerCount))
        validFingers.forEach(finger => {
            finger.addEventListener(FingerOperationType.Move, this.handleFingerMove)
            if (this.options?.inertial) {
                finger.addEventListener(FingerOperationType.Inertial, this.handleFingerMoveComplete)
            } else {
                finger.addEventListener(FingerOperationType.End, this.handleFingerMoveComplete)
            }
        })
        this.trigger(DragOperationType.Start)
    }
    private handleFingerMove = () => {
        this.currentOperationType = DragOperationType.Move
        this.trigger(DragOperationType.Move)
    }
    private handleFingerMoveComplete = () => {
        console.log('finger complete')
        this.cleanFingers().then(() => {
            if (this.fingers.length === 0) {
                this.currentOperationType = DragOperationType.End
                this.trigger(DragOperationType.End)
            }
        })
    }
    addEventListener(type: DragOperationType, callback: (fingers: Finger[]) => void) {
        const callbacks = this.events.get(type) ?? []
        callbacks.push(callback)
        this.events.set(type, callbacks)
    }
    removeEventListener(type: DragOperationType, callback?: (fingers: Finger[]) => void) {
        if (!callback) {
            this.events.set(type, [])
            return
        }
        const callbacks = this.events.get(type) ?? []
        const index = callbacks.indexOf(callback)
        if (index !== -1) {
            callbacks.splice(index, 1)
            this.events.set(type, callbacks)
        }
    }
    private trigger(type: DragOperationType) {
        const callbacks = this.events.get(type) ?? []
        callbacks.forEach(callback => callback(this.fingers))
    }
    getCurrentOperationType() {
        return this.currentOperationType
    }
    private cleanFingers = () => {
        return new Promise(resolve => {
            // 因为是先执行trigger再destroy的，所以要等finger destroy之后再检测
            setTimeout(() => {
                for (const finger of [...this.fingers]) {
                    if (finger.getIsDestroyed()) {
                        this.fingers.splice(this.fingers.indexOf(finger), 1)
                        console.log('cleanFingers', finger)
                        // FIXME: 两只手先后触摸，然后都抬起，这里只执行了一次
                    }
                }
                resolve(null)
            }, 0)
        })
    }
}
