import { Drag, type DragOptions, type DragStartPayload } from './index'
import { type Pose, getPoseFromElement, applyPoseToElement, keepTouchesRelative } from './dragMethods'
import type { DragEvent } from '../dragManager'

// Position interface
export interface Position {
  x: number
  y: number
}

// Function types for getting and setting position (兼容保留)
export type GetPositionFunction = (element: HTMLElement) => Position
export type SetPositionFunction = (element: HTMLElement, position: Position) => void

// 新的位姿（Pose）类型函数
export type GetPoseFunction = (element: HTMLElement) => Pose
export type SetPoseFunction = (element: HTMLElement, pose: Pose) => void

// Options for makeDraggable function
export interface MakeDraggableOptions {
  // 使用 Pose 的新配置
  getPose?: GetPoseFunction
  setPose?: SetPoseFunction
}

// 默认的 Pose 适配：读取/设置位姿
const defaultGetPose: GetPoseFunction = (element: HTMLElement): Pose => getPoseFromElement(element)
const defaultSetPose: SetPoseFunction = (element: HTMLElement, pose: Pose): void => {
  applyPoseToElement(element, pose)
}

/**
 * Makes an element draggable with position management
 * @param element - The HTML element to make draggable
 * @param options - Optional configuration with custom getPose and setPose functions (基于 Pose)
 * @returns Drag instance for further control
 */
export function makeDraggable(
  element: HTMLElement,
  options: MakeDraggableOptions = {}
): Drag {
  const {
    getPose = defaultGetPose,
    setPose = defaultSetPose
  } = options

  const dragOptions: DragOptions = {
    onDragStart: (element: HTMLElement, events: DragEvent[]) => {
      const initialPose = getPose(element)
      // Ensure the element has position absolute or relative for dragging
      const computedStyle = window.getComputedStyle(element)
      if (computedStyle.position === 'static') {
        element.style.position = 'relative'
      }
      // 返回 payload：包含 initPose 与 startEvents
      const payload: DragStartPayload<Pose> = { initialPose, startEvents: events }
      return payload
    },

    onDragMove: (element: HTMLElement, events: DragEvent[], startPayload?: DragStartPayload<Pose>) => {
      // 使用 keepTouchesRelative 仅启用移动，禁用缩放与旋转
      keepTouchesRelative(
        {
          element,
          initialPose: startPayload?.initialPose ?? getPose(element),
          startEvents: startPayload?.startEvents ?? [],
          currentEvents: events
        },
        {
          enableMove: true,
          enableScale: false,
          enableRotate: false,
          transformOrigin: 'center center'
        },
        {
          getPose,
          setPose: (el, newPose) => setPose(el, newPose)
        }
      )
    },

    onDragEnd: (_element: HTMLElement, _events: DragEvent[]) => {
      // Optional: Could add cleanup or final position adjustment here
    }
  }

  // Create and return the Drag instance
  return new Drag(element, dragOptions)
}
