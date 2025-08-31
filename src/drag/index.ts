import { dragManager, type DragEvent } from '../dragManager'
import type { Pose } from './dragMethods'

export interface DragOptions {
  // onDragStart 允许返回 Pose（可缺省）。
  // 若返回，则 Drag 会保存该 Pose 并在后续回调中作为第三个参数传回。
  onDragStart?: (element: HTMLElement, events: DragEvent[]) => Pose | void
  // onDragMove 增加第三个参数 pose（可能为 undefined），用于传递 onDragStart 返回并保存的 Pose
  onDragMove?: (element: HTMLElement, events: DragEvent[], pose?: Pose) => void
  // onDragEnd 同样增加第三个参数 pose（可能为 undefined）
  onDragEnd?: (element: HTMLElement, events: DragEvent[], pose?: Pose) => void
}

export class Drag {
  private element: HTMLElement
  private options: DragOptions
  private isDragging: boolean = false
  // onDragStart 可返回并保存的位姿 Pose
  private startPose: Pose | undefined

  constructor(element: HTMLElement, options: DragOptions = {}) {
    this.element = element
    this.options = options

    // Register with DragManager
    dragManager.register(this)
  }

  // Called by DragManager when a drag start event occurs
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

    // 重置 startPose
    this.startPose = undefined

    // Call user-defined onDragStart callback 并接收可选 Pose
    if (this.options.onDragStart) {
      const pose = this.options.onDragStart(this.element, events)
      if (pose) this.startPose = pose
    }

    return true
  }

  // Called by DragManager when a drag move event occurs
  handleMove(events: DragEvent[]): void {
    if (!this.isDragging) return

    // Call user-defined onDragMove callback
    if (this.options.onDragMove) {
      this.options.onDragMove(this.element, events, this.startPose)
    }
  }

  // Called by DragManager when a drag end event occurs
  handleEnd(events: DragEvent[]): void {
    if (!this.isDragging) return

    // If all identifiers associated to this element ended, DragManager will clear lock;
    // at Drag level we can mark false when we receive any end group
    this.isDragging = false

    // Call user-defined onDragEnd callback
    if (this.options.onDragEnd) {
      this.options.onDragEnd(this.element, events, this.startPose)
    }

    // 结束后清理保存的 Pose
    this.startPose = undefined
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
