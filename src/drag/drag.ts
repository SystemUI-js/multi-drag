import { Point } from '../utils/mathUtils';
import { DragBase, DragOperationType, Options, Pose } from './base';
import { Finger, FingerOperationType } from './finger';
import { cloneDeep } from 'lodash'

export class Drag extends DragBase {
    private initialPosition: Point = { x: 0, y: 0 }
    constructor(element: HTMLElement, options?: Options) {
        super(element, { ...options, maxFingerCount: -1 })
        this.addEventListener(DragOperationType.Start, this.handleStart)
        this.addEventListener(DragOperationType.Move, this.handleMove)
        this.addEventListener(DragOperationType.End, this.handleEnd)
    }
    private handleStart = (fingers: Finger[]) => {
        if (!fingers.length) {
            return
        }
        const initialPose = cloneDeep(this.getPose(this.element))
        this.initialPosition = initialPose.position
    }
    private getPoseFromFingers(fingers: Finger[], type: FingerOperationType): Partial<Pose> | void {
        if (!fingers.length) {
            return
        }
        // 找到已经移动了的finger
        const validFingerMovements = fingers.map<Point | null>(finger => {
            const startPoint = finger.getLastOperation(FingerOperationType.Start)?.point
            const currentPoint = finger.getLastOperation(type)?.point
            if (startPoint && currentPoint) {
                return {
                    x: currentPoint.x - startPoint.x,
                    y: currentPoint.y - startPoint.y,
                }
            }
            return null
        }).filter(item => item !== null) as Point[]
        const initialPosition = this.initialPosition
        let newPositionX = initialPosition.x
        let newPositionY = initialPosition.y
        validFingerMovements.forEach(item => {
            newPositionX += item.x / validFingerMovements.length
            newPositionY += item.y / validFingerMovements.length
        })
        return { position: { x: newPositionX, y: newPositionY } }
    }
    private handleMove = (fingers: Finger[]) => {
        if (this.currentOperationType !== DragOperationType.Move && this.currentOperationType !== DragOperationType.Inertial) {
            return
        }
        if (!fingers.length) {
            return
        }
        const newPose = this.getPoseFromFingers(fingers, FingerOperationType.Move)
        if (newPose) {
            this.setPose(this.element, newPose, DragOperationType.Move)
        }
    }
    private handleEnd = (fingers: Finger[]) => {
        const newPose = this.getPoseFromFingers(fingers, FingerOperationType.End)
        if (newPose) {
            this.setPose(this.element, newPose, DragOperationType.End)
        }
    }
    // private handleInertialEnd = () => {
        // if (this.lastPose && this.initialPose) {
        //     this.setPose(this.element, this.lastPose, DragOperationType.InertialEnd)
        // }
    // }
}
