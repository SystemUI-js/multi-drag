import log from 'loglevel'
import {
  createInertiaProjector,
  GestureController,
  PointerPhase,
  type GestureFeatures,
  type Pose,
  type PoseRecord
} from '@system-ui-js/multi-drag-core'
import { normalizePointerEvent } from '../dom/normalize-pointer-event'
import { defaultGetPose, defaultSetPose, getAnchorCenter } from '../dom/pose'
import { Finger, FingerOperationType } from './finger'

export interface Options {
  maxFingerCount?: number
  inertial?: boolean
  passive?: boolean
  getPose?: (element: HTMLElement) => Pose
  setPose?: (element: HTMLElement, pose: Partial<Pose>) => void
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

export type { Pose }

export class DragBase {
  private readonly controller: GestureController
  private readonly gestureFeatures: GestureFeatures
  private readonly fingers = new Map<number, Finger>()
  private readonly poses: PoseRecord[] = []
  private readonly events = new Map<
    DragOperationType,
    ((fingers: Finger[]) => void)[]
  >()
  protected currentOperationType: DragOperationType = DragOperationType.End
  private isEnabled = true
  private isPassive = false

  constructor(
    protected readonly element: HTMLElement,
    protected readonly options: Options = {},
    gestureFeatures: GestureFeatures = { drag: true }
  ) {
    this.gestureFeatures = gestureFeatures
    this.controller = new GestureController({ features: gestureFeatures })
    this.isPassive = !!options.passive
    this.element.style.touchAction = 'none'
    this.element.addEventListener('pointerdown', this.handlePointerDown)
    document.addEventListener('pointermove', this.handlePointerMove)
    document.addEventListener('pointerup', this.handlePointerEnd)
    document.addEventListener('pointercancel', this.handlePointerCancel)
  }

  destroy() {
    this.element.removeEventListener('pointerdown', this.handlePointerDown)
    document.removeEventListener('pointermove', this.handlePointerMove)
    document.removeEventListener('pointerup', this.handlePointerEnd)
    document.removeEventListener('pointercancel', this.handlePointerCancel)
    this.fingers.clear()
    this.controller.reset()
  }

  protected getPose(element: HTMLElement): Pose {
    return this.options.getPose?.(element) || defaultGetPose(element)
  }

  protected setPose(
    element: HTMLElement,
    pose: Partial<Pose>,
    type: DragOperationType
  ) {
    if (type === DragOperationType.End && this.options.setPoseOnEnd) {
      this.options.setPoseOnEnd(element, pose)
    } else if (this.options.setPose) {
      this.options.setPose(element, pose)
    } else {
      defaultSetPose(element, pose)
    }

    const currentPose = this.getPose(element)
    this.poses.push({
      pose: {
        ...currentPose,
        ...pose,
        position: pose.position || currentPose.position
      },
      time: Date.now()
    })
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
        y: rect.y
      }
    }
  }

  protected resolveGestureFeatures(pointerCount: number): GestureFeatures {
    if (pointerCount <= 0) {
      return this.gestureFeatures
    }

    return this.gestureFeatures
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
    this.events.set(
      type,
      (this.events.get(type) ?? []).filter((item) => item !== callback)
    )
  }

  trigger(type: DragOperationType, fingers?: Finger[]) {
    if (!this.isEnabled) {
      return
    }
    for (const callback of this.events.get(type) ?? []) {
      callback(fingers ?? this.getFingers())
    }
  }

  getFingers() {
    return [...this.fingers.values()]
  }

  getCurrentOperationType() {
    return this.currentOperationType
  }

  setCurrentOperationType(type: DragOperationType) {
    this.currentOperationType = type
  }

  setEnabled(enabled = true) {
    this.isEnabled = enabled
  }

  setDisabled() {
    this.isEnabled = false
  }

  setPassive(passive = true) {
    this.isPassive = passive
  }

  private readonly handlePointerDown = (event: PointerEvent) => {
    if (!this.isEnabled || this.isPassive) {
      return
    }
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    const maxFingerCount = this.options.maxFingerCount ?? 1
    if (maxFingerCount !== -1 && this.fingers.size >= maxFingerCount) {
      return
    }

    const finger = new Finger(event, {
      onDestroy: (instance) => {
        this.fingers.delete(instance.pointerId)
        if (this.fingers.size === 0) {
          this.currentOperationType = DragOperationType.AllEnd
          this.trigger(DragOperationType.AllEnd)
        }
      }
    })
    this.fingers.set(event.pointerId, finger)

    const pose = this.getPose(this.element)
    this.poses.push({ pose, time: event.timeStamp })
    this.controller.process(normalizePointerEvent(event, PointerPhase.Start), {
      pose,
      anchorCenter: getAnchorCenter(this.element),
      features: this.resolveGestureFeatures(this.fingers.size)
    })

    this.currentOperationType = DragOperationType.Start
    this.trigger(DragOperationType.Start)
    log.info(`[DragBase] pointerdown, fingers: ${this.fingers.size}`)
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    const finger = this.fingers.get(event.pointerId)
    if (!finger || !this.isEnabled) {
      return
    }

    finger.record(FingerOperationType.Move, event)
    const snapshot = this.controller.process(
      normalizePointerEvent(event, PointerPhase.Move),
      {
        pose: this.getPose(this.element),
        anchorCenter: getAnchorCenter(this.element),
        features: this.resolveGestureFeatures(this.fingers.size)
      }
    )

    this.currentOperationType = DragOperationType.Move
    this.setPose(this.element, snapshot.pose, DragOperationType.Move)
    this.trigger(DragOperationType.Move)
  }

  private readonly handlePointerEnd = (event: PointerEvent) => {
    this.finishPointer(event, PointerPhase.End, FingerOperationType.End)
  }

  private readonly handlePointerCancel = (event: PointerEvent) => {
    this.finishPointer(event, PointerPhase.Cancel, FingerOperationType.End)
  }

  private finishPointer(
    event: PointerEvent,
    phase: PointerPhase.End | PointerPhase.Cancel,
    fingerOperationType: FingerOperationType.End
  ) {
    const finger = this.fingers.get(event.pointerId)
    if (!finger || !this.isEnabled) {
      return
    }

    const activePointerCount = this.fingers.size
    finger.record(fingerOperationType, event)
    const snapshot = this.controller.process(
      normalizePointerEvent(event, phase),
      {
        pose: this.getPose(this.element),
        anchorCenter: getAnchorCenter(this.element),
        features: this.resolveGestureFeatures(activePointerCount)
      }
    )

    this.currentOperationType = DragOperationType.End
    this.setPose(this.element, snapshot.pose, DragOperationType.End)
    this.trigger(DragOperationType.End)

    if (this.options.inertial && this.fingers.size === 0) {
      this.runInertial()
    }
  }

  private runInertial() {
    const projector = createInertiaProjector(this.poses)
    const startTime = Date.now()

    const frame = () => {
      if (
        this.currentOperationType === DragOperationType.Start ||
        this.currentOperationType === DragOperationType.Move
      ) {
        return
      }

      const projection = projector(Date.now() - startTime)
      if (!projection) {
        this.currentOperationType = DragOperationType.InertialEnd
        return
      }

      this.currentOperationType = DragOperationType.Inertial
      this.setPose(this.element, projection, DragOperationType.Inertial)
      this.trigger(DragOperationType.Inertial)
      requestAnimationFrame(frame)
    }

    frame()
  }
}

export { defaultGetPose, defaultSetPose }
