import { Drag, type DragOptions } from './index'
import { type Pose, getPoseFromElement, applyPoseToElement } from './dragMethods'
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

  // Store the initial pose when drag starts
  let initialPose: Pose
  let startDragPosition: Position

  const dragOptions: DragOptions = {
    onDragStart: (element: HTMLElement, events: DragEvent[]) => {
      const event = events[0]
      // 获取元素初始位姿（Pose）
      initialPose = getPose(element)
      // Store the starting drag coordinates
      startDragPosition = { x: event.clientX, y: event.clientY }

      // Ensure the element has position absolute or relative for dragging
      const computedStyle = window.getComputedStyle(element)
      if (computedStyle.position === 'static') {
        element.style.position = 'relative'
      }
    },

    onDragMove: (element: HTMLElement, events: DragEvent[]) => {
      const event = events[0]
      // Calculate the relative movement from the start position
      const deltaX = event.clientX - startDragPosition.x
      const deltaY = event.clientY - startDragPosition.y

      // 基于初始 Pose 计算新的 left/top
      const initialLeft = parseFloat(initialPose.style.left) || 0
      const initialTop = parseFloat(initialPose.style.top) || 0

      // 生成新的样式快照，保留原 transform 等关键属性
      const newStyle = document.createElement('div').style
      newStyle.left = `${initialLeft + deltaX}px`
      newStyle.top = `${initialTop + deltaY}px`
      if (typeof initialPose.style.transform === 'string' && initialPose.style.transform.length > 0) {
        newStyle.transform = initialPose.style.transform
      }
      if (typeof initialPose.style.position === 'string' && initialPose.style.position.length > 0) {
        newStyle.position = initialPose.style.position
      } else {
        newStyle.position = 'absolute'
      }

      const newPose: Pose = {
        rect: initialPose.rect,
        style: newStyle
      }

      // 应用新的位姿
      setPose(element, newPose)
    },

    onDragEnd: (_element: HTMLElement, _events: DragEvent[]) => {
      // Optional: Could add cleanup or final position adjustment here
    }
  }

  // Create and return the Drag instance
  return new Drag(element, dragOptions)
}
