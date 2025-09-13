import type { DragEvent } from '../dragManager'
import { Point } from './mathUtils'

/**
 * Pose 接口定义了元素的位置和样式信息
 */
export interface Pose {
  /** 从元素的getBoundingClientRect获取的信息 */
  rect: DOMRect
  /** 元素的style */
  style: CSSStyleDeclaration
}

/**
 * ApplyPoseOptions 接口定义了应用位姿时的可选配置
 */
export interface ApplyPoseOptions {
  transformOrigin?: string
  transition?: string
}

/**
 * 将 DragEvent 数组转换为 Point 数组
 * @param events DragEvent 数组
 * @returns Point 数组
 */
export function toPoints(events: DragEvent[]): Point[] {
  return (events || []).map(e => ({ x: e.clientX, y: e.clientY }))
}

/**
 * 从 HTMLElement 获取当前的位姿信息
 * @param element 目标元素
 * @returns 包含元素位置和样式信息的 Pose 对象
 */
export function getPoseFromElement(element: HTMLElement): Pose {
  // 获取元素的边界矩形信息
  const rectData = element.getBoundingClientRect()
  // 确保返回的是DOMRect对象（在测试环境中可能需要转换）
  type RectLike = { x?: number; y?: number; left?: number; top?: number; width?: number; height?: number }
  const rect: DOMRect = rectData instanceof DOMRect
    ? rectData
    : (() => {
        const isRectLike = (v: unknown): v is RectLike => typeof v === 'object' && v !== null
        const rUnknown = rectData as unknown
        if (isRectLike(rUnknown)) {
          const x = (typeof rUnknown.x === 'number' ? rUnknown.x : rUnknown.left) ?? 0
          const y = (typeof rUnknown.y === 'number' ? rUnknown.y : rUnknown.top) ?? 0
          const width = (typeof rUnknown.width === 'number' ? rUnknown.width : 0)
          const height = (typeof rUnknown.height === 'number' ? rUnknown.height : 0)
          return new DOMRect(x, y, width, height)
        }
        return new DOMRect(0, 0, 0, 0)
      })()

  // 创建样式的快照，而不是引用
  // 这是修复叠加问题的关键：确保initialPose保存的是拖动开始时的状态快照
  const style = document.createElement('div').style

  // 复制关键的样式属性到快照中
  if (element.style.left) style.left = element.style.left
  if (element.style.top) style.top = element.style.top
  if (element.style.right) style.right = element.style.right
  if (element.style.bottom) style.bottom = element.style.bottom
  if (element.style.transform) style.transform = element.style.transform
  if (element.style.position) style.position = element.style.position
  if (element.style.transformOrigin) style.transformOrigin = element.style.transformOrigin

  return { rect, style }
}

/**
 * 将位姿信息应用到 HTMLElement 上
 * @param element 目标元素
 * @param pose 位姿信息
 * @param options 可选的配置项
 */
export function applyPoseToElement(element: HTMLElement, pose: Pose, options?: ApplyPoseOptions): void {
  /**
   * 修复说明：之前的实现会将 pose.style 中的所有样式属性都应用到元素上，
   * 这导致每次拖动时样式会不断叠加，产生不正确的变换效果。
   *
   * 现在只应用特定的样式属性，确保：
   * 1. 只覆盖必要的样式属性，而不是全部属性
   * 2. 每次调用都是完全替换而不是叠加
   * 3. 防止意外的样式继承问题
   */

  // 位置相关属性 - 用于元素的绝对定位
  // 避免对不同类型进行恒真的 !== 比较，统一使用长度检查
  if (typeof pose.style.left === 'string' && pose.style.left.length > 0) {
    element.style.left = pose.style.left
  }
  if (typeof pose.style.top === 'string' && pose.style.top.length > 0) {
    element.style.top = pose.style.top
  }
  if (typeof pose.style.right === 'string' && pose.style.right.length > 0) {
    element.style.right = pose.style.right
  }
  if (typeof pose.style.bottom === 'string' && pose.style.bottom.length > 0) {
    element.style.bottom = pose.style.bottom
  }

  // 变换属性 - 包含旋转、缩放等变换，这是防止叠加的关键
  if (typeof pose.style.transform === 'string' && pose.style.transform.length > 0) {
    element.style.transform = pose.style.transform
  }

  // 定位模式 - 确保元素可以被绝对定位
  if (typeof pose.style.position === 'string' && pose.style.position.length > 0) {
    element.style.position = pose.style.position
  }

  // 应用额外的选项
  if (options?.transformOrigin !== undefined) {
    element.style.transformOrigin = options.transformOrigin
  }
  if (options?.transition !== undefined) {
    element.style.transition = options.transition
  }
}