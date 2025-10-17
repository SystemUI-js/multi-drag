import { Point } from '../utils/mathUtils';
import { DragBase, DragOperationType, Options, Pose } from './base';
import { Finger, FingerOperationType } from './finger';
import { cloneDeep } from 'lodash'

export class Drag extends DragBase {
    private lastPose: Pose | null = null
    constructor(element: HTMLElement, options?: Options) {
        super(element, { ...options, maxFingerCount: -1 })
        // this.addEventListener(DragOperationType.Start, this.handleStart)
        this.addEventListener(DragOperationType.Move, this.handleMove)
        this.addEventListener(DragOperationType.End, this.handleEnd)
        this.addEventListener(DragOperationType.Inertial, this.handleMove)
        this.addEventListener(DragOperationType.InertialEnd, this.handleInertialEnd)
    }
    handleMove = (fingers: Finger[]) => {
        if (this.currentOperationType !== DragOperationType.Move && this.currentOperationType !== DragOperationType.Inertial) {
            return
        }
        const initialPose = cloneDeep(this.initialPose || this.getPose(this.element))
        if (!fingers.length) {
            return
        }
        // 找到已经移动了的finger
        const validFingerMovements = fingers.map<Point | null>(finger => {
            const startPoint = finger.getLastOperation(FingerOperationType.Start)?.point
            const currentPoint = finger.getLastOperation(FingerOperationType.Inertial)?.point || finger.getLastOperation(FingerOperationType.Move)?.point
            if (startPoint && currentPoint) {
                return {
                    x: currentPoint.x - startPoint.x,
                    y: currentPoint.y - startPoint.y,
                }
            }
            return null
        }).filter(item => item !== null) as Point[]
        let newPositionX = initialPose.position.x
        let newPositionY = initialPose.position.y
        validFingerMovements.forEach(item => {
            newPositionX += item.x / validFingerMovements.length
            newPositionY += item.y / validFingerMovements.length
        })
        const newPose = { ...initialPose, position: { x: newPositionX, y: newPositionY } }
        this.setPose(this.element, newPose, initialPose)
        this.lastPose = newPose
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
