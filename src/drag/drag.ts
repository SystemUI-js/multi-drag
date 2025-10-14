import { Point } from '../utils/mathUtils';
import { DragBase, DragOperationType, Options, Pose } from './base';
import { Finger, FingerOperationType, FingerPathItem } from './finger';
import { cloneDeep } from 'lodash'

export function defaultGetPose(element: HTMLElement): Pose {
    return {
        position: {
            x: parseFloat(element.style.left || '0'),
            y: parseFloat(element.style.top || '0'),
        }
    }
}

export function defaultSetPose(element: HTMLElement, pose: Pose): void {
    element.style.left = `${pose.position.x}px`
    element.style.top = `${pose.position.y}px`
}

export class Drag extends DragBase {
    constructor(element: HTMLElement, options?: Options) {
        super(element, { ...options, maxFingerCount: -1 })
        this.options = options || {}
        this.addEventListener(DragOperationType.Move, this.handleMove)
    }
    handleMove = (fingers: Finger[]) => {
        console.log('handleMove', fingers.length)
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
        validFingerMovements.forEach(item => {
            initialPose.position.x += item.x / validFingerMovements.length
            initialPose.position.y += item.y / validFingerMovements.length
        })
        this.options?.setPose?.(this.element, initialPose) || defaultSetPose(this.element, initialPose)
    }
}
