import log from 'loglevel'
import { Point, ReadonlyPoint } from '../utils/mathUtils'
import { Finger, FingerOperationType } from './finger'

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
  AllEnd = 'allEnd'
}

// 元素的位姿
export interface Pose {
  readonly position: ReadonlyPoint
  readonly rotation?: number
  readonly width: number
  readonly height: number
  readonly scale?: number
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
 * 从元素的当前样式与布局读取并返回其位姿（位置、旋转、缩放与尺寸）。
 *
 * @param element - 目标 HTMLElement
 * @returns 包含以下字段的 Pose：`position`（x 和 y，单位为像素，从 style.left/top 读取并解析），`rotation`（以度为单位），`scale`（缩放因子），`width` 与 `height`（以像素为单位，来自元素的布局尺寸）
 */
export function defaultGetPose(element: HTMLElement): Pose {
  const width = element.offsetWidth
  const height = element.offsetHeight
  const scale =
    Number(
      new RegExp(/scale\((-?\d+(?:\.\d+)?)\)/).exec(
        element.style.transform
      )?.[1]
    ) || 1
  return {
    position: {
      x: Number.parseFloat(element.style.left || '0'),
      y: Number.parseFloat(element.style.top || '0')
    },
    rotation:
      Number(
        new RegExp(/rotate\((-?\d+(?:\.\d+)?)deg\)/).exec(
          element.style.transform
        )?.[1]
      ) || 0,
    width: width,
    height: height,
    scale
  }
}

/**
 * 将部分位姿应用到元素样式上以更新其位置、旋转、缩放和尺寸。
 *
 * 仅会应用在 `pose` 中显式提供的字段：`position` 会设置元素的 `left`/`top`，`rotation` 和 `scale`
 * 会更新或追加到元素的 `transform`（保留其他 transform 部分），`width` 与 `height` 会设置元素的尺寸。
 *
 * @param element - 要应用位姿的 HTMLElement
 * @param pose - 部分位姿，包含要更新的字段
 */
export function defaultSetPose(
  element: HTMLElement,
  pose: Partial<Pose>
): void {
  if (Object.hasOwn(pose, 'position') && pose.position !== undefined) {
    element.style.left = `${pose.position.x}px`
    element.style.top = `${pose.position.y}px`
  }
  if (Object.hasOwn(pose, 'rotation') && pose.rotation !== undefined) {
    const originRotation = new RegExp(/rotate\((-?\d+(?:\.\d+)?)deg\)/).exec(
      element.style.transform
    )?.[1]
    if (originRotation === undefined) {
      element.style.transform += `rotate(${pose.rotation || 0}deg)`
    } else {
      element.style.transform =
        element.style.transform?.replace(
          /rotate\((-?\d+(?:\.\d+)?)deg\)/,
          `rotate(${pose.rotation || 0}deg)`
        ) || ''
    }
  }
  if (Object.hasOwn(pose, 'scale') && pose.scale !== undefined) {
    const originScale = new RegExp(/scale\((-?\d+(?:\.\d+)?)\)/).exec(
      element.style.transform
    )?.[1]
    if (originScale === undefined) {
      element.style.transform += `scale(${pose.scale || 1})`
    } else {
      element.style.transform =
        element.style.transform?.replace(
          /scale\((-?\d+(?:\.\d+)?)\)/,
          `scale(${pose.scale || 1})`
        ) || ''
    }
  }
  if (
    (Object.hasOwn(pose, 'width') && pose.width !== undefined) ||
    (Object.hasOwn(pose, 'height') && pose.height !== undefined)
  ) {
    element.style.width = `${pose.width || 0}px`
    element.style.height = `${pose.height || 0}px`
  }
}

export class DragBase {
  private readonly fingers: Finger[] = []
  private readonly poses: PoseRecord[] = []
  private readonly events: Map<
    DragOperationType,
    ((fingers: Finger[]) => void)[]
  > = new Map()
  protected currentOperationType: DragOperationType = DragOperationType.End
  private isEnabled: boolean = true
  private isPassive: boolean = false
  constructor(
    protected element: HTMLElement,
    protected options?: Options
  ) {
    this.isPassive = !!options?.passive
    element.addEventListener('pointerdown', this.handlePointerDown)
    this.element.style.touchAction = 'none'
  }
  private readonly handlePointerDown = (e: PointerEvent) => {
    if (!this.isEnabled || this.isPassive) {
      return
    }
    const maxFingerCount = this.options?.maxFingerCount ?? 1
    if (maxFingerCount !== -1 && this.fingers.length >= maxFingerCount) {
      return
    }
    // 只处理主按钮（左键）或触摸/笔
    if (e.pointerType === 'mouse' && e.button !== 0) {
      return
    }
    this.poses.push({
      pose:
        this.options?.getPose?.(this.element) || defaultGetPose(this.element),
      operationType: DragOperationType.Start,
      time: e.timeStamp
    })
    const finger = new Finger(e, {
      onDestroy: (f) => {
        // 清理手指，一般onDestroy调用时，Finger已经走完END事件，已经销毁，这里清理掉
        this.cleanFingers(f)
      }
    })
    const isValid = !finger.getIsDestroyed()
    if (isValid) {
      this.fingers.push(finger)
    }
    finger.addEventListener(FingerOperationType.Move, this.handleFingerMove)
    finger.addEventListener(
      FingerOperationType.End,
      this.handleFingerMoveComplete
    )
    this.currentOperationType = DragOperationType.Start
    this.trigger(DragOperationType.Start)
    log.info(
      `[DragBase] handlePointerDown, fingers length: ${this.fingers.length}`
    )
  }
  private readonly handleFingerMove = () => {
    this.currentOperationType = DragOperationType.Move
    this.trigger(DragOperationType.Move)
  }
  private readonly handleFingerMoveComplete = () => {
    this.trigger(DragOperationType.End)
    this.currentOperationType = DragOperationType.End
    if (this.options?.inertial) {
      this.inertialMove()
    }
  }
  private inertialMove() {
    const movePoseList = this.poses.filter(
      (pose) => pose.operationType === DragOperationType.Move
    )
    const lastMovePose = movePoseList.at(-1)
    const beforeLastMovePose = movePoseList.at(-2)
    const startTime = Date.now()
    if (lastMovePose && beforeLastMovePose) {
      this.currentOperationType = DragOperationType.Inertial
      let distanceFunction: (() => Pose['position'] | undefined) | undefined =
        undefined
      if (
        lastMovePose.pose.position.x !== beforeLastMovePose.pose.position.x ||
        lastMovePose.pose.position.y !== beforeLastMovePose.pose.position.y
      ) {
        // LATER-DO: 手感还是有点问题，需要考虑一些边界问题
        // 有移动
        // 最后一次移动的距离，单位：px
        const distance = Math.hypot(
          lastMovePose.pose.position.x - beforeLastMovePose.pose.position.x,
          lastMovePose.pose.position.y - beforeLastMovePose.pose.position.y
        )
        if (distance > 1) {
          // 最后一次移动的时间，单位：ms
          const timeSpend = lastMovePose.time - beforeLastMovePose.time
          const speed = distance / timeSpend
          // 摩擦力（减速度），单位：px/ms^2
          const deceleration = DEFAULT_DISTANCE_DECELERATION
          const timingFunction = getInertialTimingFunction(speed, deceleration)
          // 方向单位向量
          const vector: Point = {
            x:
              (lastMovePose.pose.position.x -
                beforeLastMovePose.pose.position.x) /
              distance,
            y:
              (lastMovePose.pose.position.y -
                beforeLastMovePose.pose.position.y) /
              distance
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
              y: lastMovePose.pose.position.y + vector.y * currentDistance
            }
          }
        }
      }
      let rotateFunction: (() => Pose['rotation'] | undefined) | undefined =
        undefined
      if (
        lastMovePose.pose.rotation !== beforeLastMovePose.pose.rotation &&
        lastMovePose.pose.rotation !== undefined &&
        beforeLastMovePose.pose.rotation !== undefined
      ) {
        // LATER-DO: 考虑0度和359度其实只差1度的情况，而不是-359度
        // 有旋转
        // 最后一次旋转的角度，单位：deg
        const distance =
          lastMovePose.pose.rotation - beforeLastMovePose.pose.rotation
        // 最后一次缩放的时间，单位：ms
        const timeSpend = lastMovePose.time - beforeLastMovePose.time
        // 摩擦力（减速度），单位：deg/ms^2
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
      let scaleFunction: (() => Pose['scale'] | undefined) | undefined =
        undefined
      if (
        lastMovePose.pose.scale !== beforeLastMovePose.pose.scale &&
        lastMovePose.pose.scale !== undefined &&
        beforeLastMovePose.pose.scale !== undefined
      ) {
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
          if (
            currentTime > movementDuration ||
            Math.abs(currentDistance) > MAX_SCALE_CHANGE
          ) {
            return undefined
          }
          return (lastMovePose.pose.scale || 1) * (currentDistance + 1)
        }
      }
      if (distanceFunction || scaleFunction || rotateFunction) {
        const job = () => {
          if (
            this.currentOperationType === DragOperationType.Start ||
            this.currentOperationType === DragOperationType.Move
          ) {
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
            rotation: rotatePose
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
        y: rect.y
      }
    }
  }
  protected setPose(
    element: HTMLElement,
    pose: Partial<Pose>,
    type: DragOperationType
  ): void {
    if (this.options && type === DragOperationType.End) {
      if (this.options.setPoseOnEnd) {
        this.options.setPoseOnEnd(element, pose)
        return
      }
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
          ...pose
        },
        operationType: type,
        time: Date.now()
      })
    }
  }
  addEventListener(
    type: DragOperationType,
    callback: (fingers: Finger[]) => void
  ) {
    const callbacks = this.events.get(type) ?? []
    callbacks.push(callback)
    this.events.set(type, callbacks)
  }
  removeEventListener(
    type: DragOperationType,
    callback?: (fingers: Finger[]) => void
  ) {
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
    callbacks.forEach((callback) => callback(fingers ?? this.fingers))
  }
  getCurrentOperationType() {
    return this.currentOperationType
  }
  private readonly cleanFingers = (f: Finger) => {
    const index = this.fingers.indexOf(f)
    if (index !== -1) {
      this.fingers.splice(index, 1)
    }
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
