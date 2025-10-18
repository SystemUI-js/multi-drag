import { DragBase, DragOperationType, Options } from './base';
import { Finger, FingerOperationType } from './finger';
import { Point } from '../utils/mathUtils';

export class Rotate extends DragBase {
    private initialRotation?: number
    constructor(element: HTMLElement, options?: Options) {
        super(element, { ...options, maxFingerCount: 2 })
        this.addEventListener(DragOperationType.Start, this.handleStart)
        this.addEventListener(DragOperationType.Move, this.handleMove)
        this.addEventListener(DragOperationType.End, this.handleEnd)
        this.addEventListener(DragOperationType.Inertial, this.handleMove)
        this.addEventListener(DragOperationType.InertialEnd, this.handleInertialEnd)
    }
    handleStart = () => {
        if (this.currentOperationType !== DragOperationType.Start) {
            return
        }
        const initialPose = this.getPose(this.element)
        this.initialRotation = initialPose.rotation || 0
    }
    handleMove = (fingers: Finger[]) => {
        if (this.currentOperationType !== DragOperationType.Inertial && this.currentOperationType !== DragOperationType.Move) {
            return
        }
        const initialRotation = this.initialRotation || 0
        if (!fingers.length) {
            return
        }
        const angle = fingers.length === 1 ? this.getAngleBySingleFingers(fingers[0]) : this.getAngleByTwoFingers(fingers)
        const newPose = { rotation: initialRotation + angle }
        this.setPose(this.element, newPose, DragOperationType.Move)
    }
    getAngleBySingleFingers(finger: Finger): number {
        const globalPose = this.getGlobalPose(this.element)
        const center = {
            x: globalPose.position.x + globalPose.width / 2,
            y: globalPose.position.y + globalPose.height / 2,
        }
        if (!center) {
            return 1
        }
        const startPoint = finger.getLastOperation(FingerOperationType.Start)?.point
        const currentPoint = finger.getLastOperation(FingerOperationType.Move)?.point
        if (startPoint && currentPoint) {
            return this.getAngleByTwoPoints(
                startPoint,
                center,
                currentPoint,
                center
            )
        }
        return 1
    }
    getAngleByTwoPoints(startPoint1: Point, startPoint2: Point, currentPoint1: Point, currentPoint2: Point): number {
        const startVector = { y: startPoint2.y - startPoint1.y, x: startPoint2.x - startPoint1.x }
        const currentVector = { y: currentPoint2.y - currentPoint1.y, x: currentPoint2.x - currentPoint1.x }
        // 计算向量夹角
        const angle = Math.atan2(currentVector.y, currentVector.x) - Math.atan2(startVector.y, startVector.x)
        return angle * 180 / Math.PI
    }
    getAngleByTwoFingers(fingers: Finger[]): number {
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
            return this.getAngleByTwoPoints(
                startPoint1,
                startPoint2,
                currentPoint1,
                currentPoint2
            )
        }
        return 1
    }
    handleEnd = () => {
        // if (this.lastPose && this.initialPose) {
        //     this.setPose(this.element, this.lastPose, DragOperationType.End)
        // }
    }
    handleInertialEnd = () => {
        // if (this.lastPose && this.initialPose) {
        //     this.setPose(this.element, this.lastPose, DragOperationType.InertialEnd)
        // }
    }
}
