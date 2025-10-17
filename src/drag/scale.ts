import { DragBase, DragOperationType, Options, Pose } from './base';
import { Finger, FingerOperationType } from './finger';
import { cloneDeep } from 'lodash';
import { Point } from '../utils/mathUtils';

export class Scale extends DragBase {
    private startPose: Pose | null = null
    private startGlobalCenter: Point | null = null
    private lastPose: Pose | null = null
    constructor(element: HTMLElement, options?: Options) {
        super(element, { ...options, maxFingerCount: 2 })
        this.addEventListener(DragOperationType.Start, this.handleStart)
        this.addEventListener(DragOperationType.Move, this.handleMove)
        this.addEventListener(DragOperationType.End, this.handleEnd)
        this.addEventListener(DragOperationType.Inertial, this.handleMove)
        this.addEventListener(DragOperationType.InertialEnd, this.handleInertialEnd)
        this.setStartPose()
        this.setStartGlobalCenter()
    }
    private setStartPose() {
        this.startPose = this.getPose(this.element)
    }
    private setStartGlobalCenter() {
        const rect = this.element.getBoundingClientRect()
        this.startGlobalCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        }
    }
    handleStart = () => {
        this.setStartPose()
        this.setStartGlobalCenter()
    }
    handleMove = (fingers: Finger[]) => {
        if (this.currentOperationType !== DragOperationType.Move && this.currentOperationType !== DragOperationType.Inertial) {
            return
        }
        const startPose = cloneDeep(this.startPose || this.getPose(this.element))
        if (!fingers.length || !startPose) {
            return
        }
        const scale = fingers.length === 1 ? this.getScaleBySingleFingers(fingers[0]) : this.getScaleByTwoFingers(fingers, startPose)
        const newPose = { ...startPose, scale: (startPose?.scale || 1) * scale }
        this.setPose(this.element, newPose, startPose)
        this.lastPose = newPose
    }
    getScaleBySingleFingers(finger: Finger): number {
        const center = this.startGlobalCenter
        if (!center) {
            return 1
        }
        const startPoint = finger.getLastOperation(FingerOperationType.Start)?.point
        const currentPoint = finger.getLastOperation(FingerOperationType.Inertial)?.point || finger.getLastOperation(FingerOperationType.Move)?.point
        if (startPoint && currentPoint) {
            return this.getScaleByTwoPoints(
                startPoint,
                center,
                currentPoint,
                center
            )
        }
        return 1
    }
    getScaleByTwoPoints(startPoint1: Point, startPoint2: Point, currentPoint1: Point, currentPoint2: Point): number {
        const startDistance = Math.sqrt(Math.pow(startPoint2.y - startPoint1.y, 2) + Math.pow(startPoint2.x - startPoint1.x, 2))
        const currentDistance = Math.sqrt(Math.pow(currentPoint2.y - currentPoint1.y, 2) + Math.pow(currentPoint2.x - currentPoint1.x, 2))
        return currentDistance / startDistance
    }
    getScaleByTwoFingers(fingers: Finger[], _pose: Pose): number {
        const finger1 = fingers[0]
        const finger2 = fingers[1]
        if (!finger1 || !finger2) {
            return 1
        }

        const startPoint1 = finger1.getLastOperation(FingerOperationType.Start)?.point
        const startPoint2 = finger2.getLastOperation(FingerOperationType.Start)?.point
        const currentPoint1 = finger1.getLastOperation(FingerOperationType.Move)?.point
        const currentPoint2 = finger2.getLastOperation(FingerOperationType.Move)?.point
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
    handleEnd = () => {
        if (this.lastPose && this.initialPose) {
            this.setPose(this.element, this.lastPose, this.initialPose, DragOperationType.End)
        }
    }
    handleInertialEnd = () => {
        if (this.lastPose && this.initialPose) {
            this.setPose(this.element, this.lastPose, this.initialPose, DragOperationType.InertialEnd)
        }
    }
}
