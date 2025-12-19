import { DragBase, DragOperationType, Options } from './base'
import { Finger, FingerOperationType } from './finger'
import { Point } from '../utils/mathUtils'

export class Scale extends DragBase {
  private startScale = 1
  constructor(element: HTMLElement, options?: Options) {
    super(element, { ...options, maxFingerCount: 2 })
    this.addEventListener(DragOperationType.Start, this.handleStart)
    this.addEventListener(DragOperationType.Move, this.handleMove)
    this.addEventListener(DragOperationType.End, this.handleEnd)
    this.setStartScale()
  }
  private setStartScale() {
    this.startScale = this.getPose(this.element)?.scale || 1
  }
  handleStart = () => {
    this.setStartScale()
  }
  handleMove = (fingers: Finger[]) => {
    if (
      this.currentOperationType !== DragOperationType.Move &&
      this.currentOperationType !== DragOperationType.Inertial
    ) {
      return
    }
    if (!fingers.length) {
      return
    }
    const currentPose = this.getPose(this.element)
    if (!currentPose) {
      return
    }
    const scale =
      fingers.length === 1
        ? this.getScaleBySingleFingers(fingers[0])
        : this.getScaleByTwoFingers(fingers)
    this.setPose(
      this.element,
      { scale: this.startScale * scale },
      DragOperationType.Move
    )
  }
  getScaleBySingleFingers(finger: Finger): number {
    const currentPose = this.getGlobalPose(this.element)
    const center = {
      x: currentPose.position.x + currentPose.width / 2,
      y: currentPose.position.y + currentPose.height / 2
    }
    const startPoint = finger.getLastOperation(FingerOperationType.Start)?.point
    const currentPoint = finger.getLastOperation(
      FingerOperationType.Move
    )?.point
    if (startPoint && currentPoint) {
      return this.getScaleByTwoPoints(startPoint, center, currentPoint, center)
    }
    return 1
  }
  getScaleByTwoPoints(
    startPoint1: Point,
    startPoint2: Point,
    currentPoint1: Point,
    currentPoint2: Point
  ): number {
    const startDistance = Math.sqrt(
      Math.pow(startPoint2.y - startPoint1.y, 2) +
        Math.pow(startPoint2.x - startPoint1.x, 2)
    )
    const currentDistance = Math.sqrt(
      Math.pow(currentPoint2.y - currentPoint1.y, 2) +
        Math.pow(currentPoint2.x - currentPoint1.x, 2)
    )
    return currentDistance / startDistance
  }
  getScaleByTwoFingers(fingers: Finger[]): number {
    const finger1 = fingers[0]
    const finger2 = fingers[1]
    if (!finger1 || !finger2) {
      return 1
    }

    const startPoint1 = finger1.getLastOperation(
      FingerOperationType.Start
    )?.point
    const startPoint2 = finger2.getLastOperation(
      FingerOperationType.Start
    )?.point
    const currentPoint1 = finger1.getLastOperation(
      FingerOperationType.Move
    )?.point
    const currentPoint2 = finger2.getLastOperation(
      FingerOperationType.Move
    )?.point
    if (startPoint1 && startPoint2 && currentPoint1 && currentPoint2) {
      return this.getScaleByTwoPoints(
        startPoint1,
        startPoint2,
        currentPoint1,
        currentPoint2
      )
    }
    return 1
  }
  handleEnd = (fingers: Finger[]) => {
    const scale =
      fingers.length === 1
        ? this.getScaleBySingleFingers(fingers[0])
        : this.getScaleByTwoFingers(fingers)
    this.setPose(
      this.element,
      { scale: this.startScale * scale },
      DragOperationType.End
    )
  }
  handleInertialEnd = () => {}
}
