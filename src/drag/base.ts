import log from 'loglevel'
import { ReadonlyPoint } from '../utils/mathUtils'
import { Finger, FingerOperationType } from './finger'

export interface Options {
    // 支持最大的手指数量，默认1
    maxFingerCount?: number
    inertial?: boolean
    // 被动模式，默认false
    // 被动模式下，不主动监听元素事件，而是外部调用trigger方法触发事件
    passive?: boolean
    getPose?: (element: HTMLElement) => Pose
    setPose?: (element: HTMLElement, pose: Partial<Pose>) => void
    // 在End时单独设置Pose，这可以让前面的setPose成为一种预览，从而提升性能
    setPoseOnEnd?: (element: HTMLElement, pose: Partial<Pose>) => void
}

export enum DragOperationType {
    Start = 'start',
    Move = 'move',
    End = 'end',
    Inertial = 'inertial',
    InertialEnd = 'inertialEnd',
    AllEnd = 'allEnd',
}

export interface Pose {
    readonly position: ReadonlyPoint;
    readonly rotation?: number;
    readonly width: number;
    readonly height: number;
    readonly scale?: number;
}

export function defaultGetPose(element: HTMLElement): Pose {
    const width = element.offsetWidth
    const height = element.offsetHeight
    const scale = Number(element.style.transform?.match(/scale\((-?(?:\d+)(?:\.\d+)?)\)/)?.[1]) || 1
    return {
        position: {
            x: parseFloat(element.style.left || '0'),
            y: parseFloat(element.style.top || '0'),
        },
        rotation: Number(element.style.transform?.match(/rotate\((-?(?:\d+)(?:\.\d+)?)deg\)/)?.[1]) || 0,
        width: width,
        height: height,
        scale,
    }
}

export function defaultSetPose(element: HTMLElement, pose: Partial<Pose>): void {
    if (Object.hasOwnProperty.call(pose, 'position')) {
        element.style.left = `${pose.position!.x}px`
        element.style.top = `${pose.position!.y}px`
    }
    if (Object.hasOwnProperty.call(pose, 'rotation')) {
        const originRotation = element.style.transform?.match(/rotate\((-?(?:\d+)(?:\.\d+)?)deg\)/)?.[1]
        if (originRotation === undefined) {
            element.style.transform += `rotate(${pose.rotation || 0}deg)`
        } else {
            element.style.transform = element.style.transform?.replace(/rotate\((-?(?:\d+)(?:\.\d+)?)deg\)/, `rotate(${pose.rotation || 0}deg)`) || ''
        }
    }
    if (Object.hasOwnProperty.call(pose, 'scale')) {
        const originScale = element.style.transform?.match(/scale\((-?(?:\d+)(?:\.\d+)?)\)/)?.[1]
        if (originScale === undefined) {
            element.style.transform += `scale(${pose.scale || 1})`
        } else {
            element.style.transform = element.style.transform?.replace(/scale\((-?(?:\d+)(?:\.\d+)?)\)/, `scale(${pose.scale || 1})`) || ''
        }
    }
    if (Object.hasOwnProperty.call(pose, 'width') || Object.hasOwnProperty.call(pose, 'height')) {
        element.style.width = `${pose.width || 0}px`
        element.style.height = `${pose.height || 0}px`
    }
}

export class DragBase {
    private fingers: Finger[] = []
    private events: Map<DragOperationType, ((fingers: Finger[]) => void)[]> = new Map()
    protected currentOperationType: DragOperationType = DragOperationType.End
    protected initialPose: Pose
    constructor(protected element: HTMLElement, protected options?: Options) {
        this.initialPose = this.options?.getPose?.(this.element) || defaultGetPose(this.element)
        if (!this.options || !this.options.passive) {
            element.addEventListener('mousedown', this.handleMouseDown)
            element.addEventListener('touchstart', this.handleTouchStart)
        }
    }
    private handleMouseDown = (e: MouseEvent) => {
        if (this.currentOperationType === DragOperationType.Inertial) {
            // 在惯性阶段，再次按下，需要打断，先把所有finger kill掉
            this.fingers.forEach(finger => {
                finger.destroy()
            })
        }
        const maxFingerCount = this.options?.maxFingerCount ?? 1
        if (maxFingerCount !== -1 && this.fingers.length >= maxFingerCount) {
            return
        }
        if (e.button !== 0) {
            return
        }
        this.initialPose = this.options?.getPose?.(this.element) || defaultGetPose(this.element)
        const finger = new Finger(e, {
            inertial: this.options?.inertial ?? false,
            onDestroy: (f) => {
                this.cleanFingers(f)
            },
        })
        this.fingers.push(finger)
        finger.addEventListener(FingerOperationType.Move, this.handleFingerMove)
        finger.addEventListener(FingerOperationType.Inertial, this.handleFingerInertialMove)
        finger.addEventListener(FingerOperationType.End, this.handleFingerMoveComplete)
        finger.addEventListener(FingerOperationType.InertialEnd, this.handleFingerInertialComplete)
        this.currentOperationType = DragOperationType.Start
        this.trigger(DragOperationType.Start)
        log.info(`[DragBase] handleMouseDown, fingers length: ${this.fingers.length}`)
    }
    private handleTouchStart = (e: TouchEvent) => {
        if (this.currentOperationType === DragOperationType.Inertial) {
            // 在惯性阶段，再次按下，需要打断，先把所有finger kill掉
            this.fingers.forEach(finger => {
                finger.destroy()
            })
        }
        e.preventDefault()
        const optionsMaxFingerCount = this.options?.maxFingerCount ?? 1
        const maxFingerCount = optionsMaxFingerCount !== -1 ? optionsMaxFingerCount : Infinity
        const fingers = Finger.createFingersByEvent(e, {
            inertial: this.options?.inertial ?? false,
            onDestroy: (f) => {
                this.cleanFingers(f)
            },
        })
        const validFingers = fingers.filter(finger => !finger.getIsDestroyed())
        this.initialPose = this.options?.getPose?.(this.element) || defaultGetPose(this.element)
        this.fingers.push(...validFingers.slice(0, maxFingerCount))
        validFingers.forEach(finger => {
            finger.addEventListener(FingerOperationType.Move, this.handleFingerMove)
            finger.addEventListener(FingerOperationType.Inertial, this.handleFingerInertialMove)
            finger.addEventListener(FingerOperationType.End, this.handleFingerMoveComplete)
            finger.addEventListener(FingerOperationType.InertialEnd, this.handleFingerInertialComplete)
        })
        this.trigger(DragOperationType.Start)
        log.info(`[DragBase] handleTouchStart, fingers length: ${this.fingers.length}`)
    }
    private handleFingerMove = () => {
        this.currentOperationType = DragOperationType.Move
        this.trigger(DragOperationType.Move)
    }
    private handleFingerInertialMove = () => {
        this.currentOperationType = DragOperationType.Inertial
        this.trigger(DragOperationType.Inertial)
    }
    private handleFingerMoveComplete = () => {
        this.trigger(DragOperationType.End)
        this.currentOperationType = DragOperationType.End
    }
    private handleFingerInertialComplete = () => {
        this.trigger(DragOperationType.InertialEnd)
        this.currentOperationType = DragOperationType.InertialEnd
    }
    protected getPose(element: HTMLElement): Pose {
        if (this.options?.getPose) {
            return this.options.getPose(element)
        }
        return defaultGetPose(element)
    }
    protected getGlobalPose(element: HTMLElement): Pose {
        const pose = this.getPose(element)
        const rect = element.getBoundingClientRect()
        return {
            ...pose,
            width: rect.width,
            height: rect.height,
            position: {
                x: rect.x,
                y: rect.y,
            },
        }
    }
    protected setPose(element: HTMLElement, pose: Partial<Pose>, type?: DragOperationType): void {
        if (this.options && type === DragOperationType.End) {
            if (this.options.setPoseOnEnd) {
                this.options.setPoseOnEnd(element, pose)
            }
            return
        }
        if (this.options?.setPose) {
            this.options.setPose(element, pose)
            return
        }
        defaultSetPose(element, pose)
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
    setCurrentOperationType(type: DragOperationType) {
        this.currentOperationType = type
    }
    trigger(type: DragOperationType, fingers?: Finger[]) {
        const callbacks = this.events.get(type) ?? []
        callbacks.forEach(callback => callback(fingers || this.fingers))
    }
    getCurrentOperationType() {
        return this.currentOperationType
    }
    private cleanFingers = (f: Finger) => {
        this.fingers.splice(this.fingers.indexOf(f), 1)
        if (this.fingers.length === 0) {
            this.currentOperationType = DragOperationType.AllEnd
            this.trigger(DragOperationType.AllEnd)
        }
    }
}
