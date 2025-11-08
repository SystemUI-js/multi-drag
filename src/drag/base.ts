import log from 'loglevel';
import { Point, ReadonlyPoint } from '../utils/mathUtils';
import { Finger, FingerOperationType } from './finger';

const DEFAULT_DISTANCE_DECELERATION = 0.007
const DEFAULT_ROTATION_DECELERATION = 0.0005
const DEFAULT_SCALE_DECELERATION = 0.0000001
const MAX_SCALE_CHANGE = 10

export interface Options {
    // 支持最大的手指数量，默认1
    maxFingerCount?: number
		// 惯性拖拽，默认false
    inertial?: boolean
    // 被动模式，默认false
    // 被动模式下，不主动监听元素事件，而是外部调用trigger方法触发事件
    passive?: boolean
		// 获取当前Pose
    getPose?: (element: HTMLElement) => Pose
		// 设置当前Pose
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

// 元素的位姿
export interface Pose {
    readonly position: ReadonlyPoint;
    readonly rotation?: number;
    readonly width: number;
    readonly height: number;
    readonly scale?: number;
}

// 拖动时的位姿记录
export interface PoseRecord {
    pose: Pose
    operationType: DragOperationType
    time: number
}

// 惯性时间函数，S=vt-0.5at^2
function getInertialTimingFunction(initSpeed: number, deceleration: number) {
    return (timeSpend: number) => {
        return initSpeed * timeSpend - 0.5 * deceleration * timeSpend ** 2
    }
}

/**
 * 默认获取位姿的函数
 * @param element
 */
export function defaultGetPose(element: HTMLElement): Pose {
    const width = element.offsetWidth
    const height = element.offsetHeight
    const scale = Number(element.style.transform?.match(/scale\((-?\d+(?:\.\d+)?)\)/)?.[1]) || 1
    return {
        position: {
            x: parseFloat(element.style.left || '0'),
            y: parseFloat(element.style.top || '0'),
        },
        rotation: Number(element.style.transform?.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/)?.[1]) || 0,
        width: width,
        height: height,
        scale,
    }
}

/**
 * 默认设置位姿的函数
 * @param element
 * @param pose
 */
export function defaultSetPose(element: HTMLElement, pose: Partial<Pose>): void {
    if (Object.hasOwnProperty.call(pose, 'position') && pose.position !== undefined) {
        element.style.left = `${pose.position!.x}px`
        element.style.top = `${pose.position!.y}px`
    }
    if (Object.hasOwnProperty.call(pose, 'rotation') && pose.rotation !== undefined) {
        const originRotation = element.style.transform?.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/)?.[1]
        if (originRotation === undefined) {
            element.style.transform += `rotate(${pose.rotation || 0}deg)`
        } else {
            element.style.transform = element.style.transform?.replace(/rotate\((-?\d+(?:\.\d+)?)deg\)/, `rotate(${pose.rotation || 0}deg)`) || ''
        }
    }
    if (Object.hasOwnProperty.call(pose, 'scale') && pose.scale !== undefined) {
        const originScale = element.style.transform?.match(/scale\((-?\d+(?:\.\d+)?)\)/)?.[1]
        if (originScale === undefined) {
            element.style.transform += `scale(${pose.scale || 1})`
        } else {
            element.style.transform = element.style.transform?.replace(/scale\((-?\d+(?:\.\d+)?)\)/, `scale(${pose.scale || 1})`) || ''
        }
    }
    if (Object.hasOwnProperty.call(pose, 'width') && pose.width !== undefined || Object.hasOwnProperty.call(pose, 'height') && pose.height !== undefined) {
        element.style.width = `${pose.width || 0}px`
        element.style.height = `${pose.height || 0}px`
    }
}

export class DragBase {
    private fingers: Finger[] = []
    private poses: PoseRecord[] = []
    private events: Map<DragOperationType, ((fingers: Finger[]) => void)[]> = new Map()
    protected currentOperationType: DragOperationType = DragOperationType.End
    private isEnabled: boolean = true
    private isPassive: boolean = false
    constructor(protected element: HTMLElement, protected options?: Options) {
        this.isPassive = !!(options?.passive)
        element.addEventListener('mousedown', this.handleMouseDown)
        element.addEventListener('touchstart', this.handleTouchStart)
    }
    private handleMouseDown = (e: MouseEvent) => {
        if (!this.isEnabled || this.isPassive) {
            return
        }
        const maxFingerCount = this.options?.maxFingerCount ?? 1
        if (maxFingerCount !== -1 && this.fingers.length >= maxFingerCount) {
            return
        }
        if (e.button !== 0) {
            return
        }
        this.poses.push({
            pose: this.options?.getPose?.(this.element) || defaultGetPose(this.element),
            operationType: DragOperationType.Start,
            time: e.timeStamp,
        })
        const finger = new Finger(e, {
            inertial: this.options?.inertial ?? false,
            onDestroy: (f) => {
                // 清理手指，一般onDestroy调用时，Finger已经走完END事件，已经销毁，这里清理掉
                this.cleanFingers(f)
            },
        })
        this.fingers.push(finger)
        finger.addEventListener(FingerOperationType.Move, this.handleFingerMove)
        finger.addEventListener(FingerOperationType.End, this.handleFingerMoveComplete)
        this.currentOperationType = DragOperationType.Start
        this.trigger(DragOperationType.Start)
        log.info(`[DragBase] handleMouseDown, fingers length: ${this.fingers.length}`)
    }
    private handleTouchStart = (e: TouchEvent) => {
        if (!this.isEnabled || this.isPassive) {
            return
        }
        e.preventDefault()
        const optionsMaxFingerCount = this.options?.maxFingerCount ?? 1
        // 限制最大手指数量
        const maxFingerCount = optionsMaxFingerCount !== -1 ? optionsMaxFingerCount : Infinity
        const fingers = Finger.createFingersByEvent(e, {
            inertial: this.options?.inertial ?? false,
            onDestroy: (f) => {
                // 清理手指，一般onDestroy调用时，Finger已经走完END事件，已经销毁，这里清理掉
                this.cleanFingers(f)
            },
        })
        // 过滤掉已销毁的手指，避免后续操作出错
        const validFingers = fingers.filter(finger => !finger.getIsDestroyed())
        this.poses.push({
            pose: this.options?.getPose?.(this.element) || defaultGetPose(this.element),
            operationType: DragOperationType.Start,
            time: e.timeStamp,
        })
        this.fingers.push(...validFingers.slice(0, maxFingerCount))
        validFingers.forEach(finger => {
            finger.addEventListener(FingerOperationType.Move, this.handleFingerMove)
            finger.addEventListener(FingerOperationType.End, this.handleFingerMoveComplete)
        })
        this.trigger(DragOperationType.Start)
        log.info(`[DragBase] handleTouchStart, fingers length: ${this.fingers.length}`)
    }
    private handleFingerMove = () => {
        this.currentOperationType = DragOperationType.Move
        this.trigger(DragOperationType.Move)
    }
    private handleFingerMoveComplete = () => {
        this.trigger(DragOperationType.End)
        this.currentOperationType = DragOperationType.End
        this.inertialMove()
    }
    private inertialMove() {
        const movePoseList = this.poses.filter(pose => pose.operationType === DragOperationType.Move)
        const lastMovePose = movePoseList[movePoseList.length - 1]
        const beforeLastMovePose = movePoseList[movePoseList.length - 2]
        const startTime = new Date().getTime()
        if (lastMovePose && beforeLastMovePose) {
            this.currentOperationType = DragOperationType.Inertial
            let distanceFunction: (() => Pose['position'] | undefined) | undefined = undefined
            if (lastMovePose.pose.position.x !== beforeLastMovePose.pose.position.x || lastMovePose.pose.position.y !== beforeLastMovePose.pose.position.y) {
                // TODO: 手感还是有点问题，需要考虑一些边界问题
                // 有移动
                // 最后一次移动的距离，单位：px
                const distance = Math.sqrt((lastMovePose.pose.position.x - beforeLastMovePose.pose.position.x) ** 2 + (lastMovePose.pose.position.y - beforeLastMovePose.pose.position.y) ** 2)
                if (distance > 1) {
                    // 最后一次移动的时间，单位：ms
                    const timeSpend = lastMovePose.time - beforeLastMovePose.time
                    const speed = distance / timeSpend
                    // 摩擦力（减速度），单位：px/ms^2
                    const deceleration = DEFAULT_DISTANCE_DECELERATION
                    const timingFunction = getInertialTimingFunction(speed, deceleration)
                    // 方向单位向量
                    const vector: Point = {
                        x: (lastMovePose.pose.position.x - beforeLastMovePose.pose.position.x) / distance,
                        y: (lastMovePose.pose.position.y - beforeLastMovePose.pose.position.y) / distance,
                    }
                    const movementDuration = speed / deceleration
                    distanceFunction = () => {
                        const currentTime = Date.now() - startTime
                        const currentDistance = timingFunction(currentTime)
                        if (currentTime > movementDuration || currentDistance < 0) {
                            return undefined
                        }
                        return {
                            x: lastMovePose.pose.position.x + vector.x * currentDistance,
                            y: lastMovePose.pose.position.y + vector.y * currentDistance,
                        }
                    }
                }
            }
            let rotateFunction: (() => Pose['rotation'] | undefined) | undefined = undefined
            if (lastMovePose.pose.rotation !== beforeLastMovePose.pose.rotation && lastMovePose.pose.rotation !== undefined && beforeLastMovePose.pose.rotation !== undefined) {
                // TODO: 考虑0和1.999PI其实只差0.001PI的情况，而不是-1.999PI
                // 有旋转
                // 最后一次旋转的角度，单位：rad
                const distance = lastMovePose.pose.rotation - beforeLastMovePose.pose.rotation
                // 最后一次缩放的时间，单位：ms
                const timeSpend = lastMovePose.time - beforeLastMovePose.time
                // 摩擦力（减速度），单位：rad/ms^2
                const deceleration = DEFAULT_ROTATION_DECELERATION
                const speed = distance / timeSpend
                const timingFunction = getInertialTimingFunction(speed, deceleration)
                const movementDuration = speed / deceleration
                rotateFunction = () => {
                    const currentTime = Date.now() - startTime
                    const currentDistance = timingFunction(currentTime)
                    if (currentTime > movementDuration) {
                            return undefined
                        }
                    return (lastMovePose.pose.rotation || 0) + currentDistance
                }
            }
            let scaleFunction: (() => Pose['scale'] | undefined) | undefined = undefined
            if (lastMovePose.pose.scale !== beforeLastMovePose.pose.scale && lastMovePose.pose.scale !== undefined && beforeLastMovePose.pose.scale !== undefined) {
                // 有缩放
                // 最后一次缩放的距离，单位：px
                const distance = lastMovePose.pose.scale - beforeLastMovePose.pose.scale
                // 最后一次缩放的时间，单位：ms
                const timeSpend = lastMovePose.time - beforeLastMovePose.time
                // 摩擦力（减速度），单位：px/ms^2
                const deceleration = DEFAULT_SCALE_DECELERATION
                const speed = distance / timeSpend
                const timingFunction = getInertialTimingFunction(speed, deceleration)
                const movementDuration = speed / deceleration
                scaleFunction = () => {
                    const currentTime = Date.now() - startTime
                    const currentDistance = timingFunction(currentTime)
                    if (currentTime > movementDuration || Math.abs(currentDistance) > MAX_SCALE_CHANGE) {
                            return undefined
                        }
                    return (lastMovePose.pose.scale || 1) * (currentDistance + 1)
                }
            }
            if (distanceFunction || scaleFunction || rotateFunction) {
                const job = () => {
                    if (this.currentOperationType === DragOperationType.Start || this.currentOperationType === DragOperationType.Move) {
                        // 一般是被打断了
                        log.info('[DragBase] Inertial is interrupted')
                        return
                    }
                    const distancePose = distanceFunction?.()
                    const scalePose = scaleFunction?.()
                    const rotatePose = rotateFunction?.()
                    if (!distancePose && !scalePose && !rotatePose) {
                        this.currentOperationType = DragOperationType.InertialEnd
                        return
                    }
                    const currentPose = {
                        position: distancePose,
                        scale: scalePose,
                        rotation: rotatePose,
                    }
                    this.setPose(this.element, currentPose, DragOperationType.Inertial)
                    requestAnimationFrame(job)
                }
                job()
            }
        }
    }
    protected getPose(element: HTMLElement): Pose {
        if (this.options?.getPose) {
            return this.options.getPose(element)
        }
        return defaultGetPose(element)
    }
    /**
     * 获取元素的全局坐标和尺寸信息
     * @param element 元素
     * @returns 元素的全局坐标和尺寸信息
     */
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
    protected setPose(element: HTMLElement, pose: Partial<Pose>, type: DragOperationType): void {
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
        if (type) {
            const currentPose = this.getPose(element)
            this.poses.push({
                pose: {
                    ...currentPose,
                    ...pose,
                },
                operationType: type,
                time: Date.now(),
            })
        }
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
    getFingers() {
        return this.fingers
    }
    setCurrentOperationType(type: DragOperationType) {
        this.currentOperationType = type
    }
    /**
     * 触发事件
     * @param type 事件类型
     * @param fingers 手指列表，选填，不填则使用当前类的手指列表
     */
    trigger(type: DragOperationType, fingers?: Finger[]) {
        if (!this.isEnabled) {
            return
        }
        const callbacks = this.events.get(type) ?? []
        callbacks.forEach(callback => callback(fingers ?? this.fingers))
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
    setEnabled(enabled: boolean = true) {
        this.isEnabled = enabled
    }
    setDisabled() {
        this.isEnabled = false
    }
    setPassive(passive: boolean = true) {
        this.isPassive = passive
    }
}
