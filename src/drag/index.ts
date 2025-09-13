import { dragManager, type DragEvent } from '../dragManager'
import type { Pose } from '../utils/dragUtils'

export interface DragStartPayload<PoseType = Pose> {
  initialPose: PoseType
  startEvents: DragEvent[]
}

export interface DragOptions {
  // onDragStart 返回携带 initPose 与 startEvents 的 payload
  onDragStart?: (element: HTMLElement, events: DragEvent[]) => DragStartPayload | void
  // onDragMove 接收 onDragStart 的返回 payload
  onDragMove?: (element: HTMLElement, events: DragEvent[], startPayload?: DragStartPayload) => void
  // onDragEnd 同样接收 payload
  onDragEnd?: (element: HTMLElement, events: DragEvent[], startPayload?: DragStartPayload) => void
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

    // 重置 startPayload
    this.startPayload = undefined

    // Call user-defined onDragStart callback 并接收可选 payload
    if (this.options.onDragStart) {
      const payload = this.options.onDragStart(this.element, events)
      if (payload) this.startPayload = payload
    }

    return true
  }

  // Called by DragManager when a drag move event occurs
  handleMove(events: DragEvent[]): void {
    if (!this.isDragging) return

    // Call user-defined onDragMove callback
    if (this.options.onDragMove) {
      this.options.onDragMove(this.element, events, this.startPayload)
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
      this.options.onDragEnd(this.element, events, this.startPayload)
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
