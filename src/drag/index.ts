import { dragManager, type DragEvent } from '../dragManager'
import type { Pose } from '../utils/dragUtils'
import type { Point } from '../utils/mathUtils'

/**
 * 将全局坐标转换为元素内的本地坐标
 * @param globalPoints 全局坐标点数组
 * @param element 目标元素
 * @returns 本地坐标点数组
 */
function convertToLocalPoints(globalPoints: Point[], element: HTMLElement): Point[] {
  const rect = element.getBoundingClientRect()
  return globalPoints.map(point => ({
    x: point.x - rect.left,
    y: point.y - rect.top
  }))
}

/**
 * 将DragEvent数组转换为全局坐标点数组
 * @param events DragEvent数组
 * @returns 全局坐标点数组
 */
export function convertToGlobalPoints(events: DragEvent[]): Point[] {
  return events.map(event => ({
    x: event.clientX,
    y: event.clientY
  }))
}

export interface DragStartPayload<PoseType = Pose> {
  initialPose: PoseType
  /** 拖拽开始时在元素内的坐标点 */
  startLocalPoints: Point[]
  /** 拖拽开始时在视窗内的坐标点（clientX/Y） */
  startGlobalPoints: Point[]
}

export interface DragOptions {
  /**
   * 拖拽开始回调 - 返回携带 initPose 与坐标点的 payload
   * @param element 被拖拽的元素
   * @param localPoints 在元素内的坐标点
   * @param globalPoints 在视窗内的坐标点（clientX/Y）
   */
  onDragStart?: (element: HTMLElement, localPoints: Point[], globalPoints: Point[]) => DragStartPayload | void
  /**
   * 拖拽移动回调 - 接收 onDragStart 的返回 payload
   * @param element 被拖拽的元素
   * @param localPoints 在元素内的坐标点
   * @param globalPoints 在视窗内的坐标点（clientX/Y）
   * @param startPayload 拖拽开始时的payload
   */
  onDragMove?: (element: HTMLElement, localPoints: Point[], globalPoints: Point[], startPayload?: DragStartPayload) => void
  /**
   * 拖拽结束回调 - 同样接收 payload
   * @param element 被拖拽的元素
   * @param localPoints 在元素内的坐标点
   * @param globalPoints 在视窗内的坐标点（clientX/Y）
   * @param startPayload 拖拽开始时的payload
   */
  onDragEnd?: (element: HTMLElement, localPoints: Point[], globalPoints: Point[], startPayload?: DragStartPayload) => void
}

export class Drag {
  private element: HTMLElement
  private options: DragOptions
  private isDragging: boolean = false
  // onDragStart 可返回并保存的 payload
  private startPayload: DragStartPayload | undefined

  constructor(element: HTMLElement, options: DragOptions = {}) {
    this.element = element
    this.options = options

    // Register with DragManager
    dragManager.register(this)
  }

  /**
   * 处理拖拽开始事件
   * @param events DragEvent数组
   * @returns 是否成功开始拖拽
   */
  handleStart(events: DragEvent[]): boolean {
    if (!events || events.length === 0) return false
    // Ensure at least one event's target is inside this element
    const isTargeted = events.some(e => {
      const target = e.target as HTMLElement | null
      return target ? this.element.contains(target) : false
    })
    if (!isTargeted) return false

    // Allow multiple touches on same element; mark dragging on first batch
    this.isDragging = true

    // 重置 startPayload
    this.startPayload = undefined

    // Call user-defined onDragStart callback 并接收可选 payload
    if (this.options.onDragStart) {
      // 转换坐标点
      const globalPoints = convertToGlobalPoints(events)
      const localPoints = convertToLocalPoints(globalPoints, this.element)

      const payload = this.options.onDragStart(this.element, localPoints, globalPoints)
      if (payload) this.startPayload = payload
    }

    return true
  }

  /**
   * 处理拖拽移动事件
   * @param events DragEvent数组
   */
  handleMove(events: DragEvent[]): void {
    if (!this.isDragging) return

    // Call user-defined onDragMove callback
    if (this.options.onDragMove) {
      // 转换坐标点
      const globalPoints = convertToGlobalPoints(events)
      const localPoints = convertToLocalPoints(globalPoints, this.element)

      this.options.onDragMove(this.element, localPoints, globalPoints, this.startPayload)
    }
  }

  /**
   * 处理拖拽结束事件
   * @param events DragEvent数组
   */
  handleEnd(events: DragEvent[]): void {
    if (!this.isDragging) return

    // If all identifiers associated to this element ended, DragManager will clear lock;
    // at Drag level we can mark false when we receive any end group
    this.isDragging = false

    // Call user-defined onDragEnd callback
    if (this.options.onDragEnd) {
      // 转换坐标点
      const globalPoints = convertToGlobalPoints(events)
      const localPoints = convertToLocalPoints(globalPoints, this.element)

      this.options.onDragEnd(this.element, localPoints, globalPoints, this.startPayload)
    }

    // 结束后清理保存的 payload
    this.startPayload = undefined
  }

  // Getter for the element
  getElement(): HTMLElement {
    return this.element
  }

  // Check if currently dragging
  getIsDragging(): boolean {
    return this.isDragging
  }

  // Unregister from DragManager
  destroy(): void {
    dragManager.unregister(this)
  }
}
