import log from 'loglevel';
import { Point } from '../utils/mathUtils';
import { DragBase, DragOperationType, Options, defaultGetPose, defaultSetPose } from './base';
import { Finger, FingerOperationType } from './finger';
import { cloneDeep } from 'lodash'

export class Drag extends DragBase {
    private isDragComplete = false
    constructor(element: HTMLElement, options?: Options) {
        super(element, { ...options, maxFingerCount: -1 })
        this.addEventListener(DragOperationType.Start, this.handleStart)
        this.addEventListener(DragOperationType.Move, this.handleMove)
        this.addEventListener(DragOperationType.End, this.handleEnd)
    }
    handleStart = (fingers: Finger[]) => {
        log.info('handleStart', fingers.length)
        this.isDragComplete = false
    }
    handleMove = (fingers: Finger[]) => {
        log.info('handleMove', fingers.length)
        if (this.isDragComplete) {
            return
        }
        const initialPose = cloneDeep(this.initialPose || this.options?.getPose?.(this.element) || defaultGetPose(this.element))
        if (!fingers.length) {
            return
        }
        // 找到已经移动了的finger
        const validFingerMovements = fingers.map<Point | null>(finger => {
            const startPoint = finger.getLastOperation(FingerOperationType.Start)?.point
            const currentPoint = finger.getLastOperation(FingerOperationType.Move)?.point
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
        if (this.options?.setPose) {
            this.options?.setPose(this.element, { ...initialPose, position: { x: newPositionX, y: newPositionY } }, initialPose)
        } else {
            defaultSetPose(this.element, { ...initialPose, position: { x: newPositionX, y: newPositionY } }, initialPose)
        }
    }
    handleEnd = (fingers: Finger[]) => {
        log.info('handleEnd', fingers.length)
        // 目前设定为1指完成，就停止setPose
        this.isDragComplete = true
    }
}
