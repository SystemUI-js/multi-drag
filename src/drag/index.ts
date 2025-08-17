import { dragManager, type DragEvent } from '../dragManager'

export interface DragOptions {
  onDragStart?: (element: HTMLElement, events: DragEvent[]) => void
  onDragMove?: (element: HTMLElement, events: DragEvent[]) => void
  onDragEnd?: (element: HTMLElement, events: DragEvent[]) => void
}

export class Drag {
  private element: HTMLElement
  private options: DragOptions
  private isDragging: boolean = false

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

    // Call user-defined onDragStart callback
    if (this.options.onDragStart) {
      this.options.onDragStart(this.element, events)
    }

    return true
  }

  // Called by DragManager when a drag move event occurs
  handleMove(events: DragEvent[]): void {
    if (!this.isDragging) return

    // Call user-defined onDragMove callback
    if (this.options.onDragMove) {
      this.options.onDragMove(this.element, events)
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
      this.options.onDragEnd(this.element, events)
    }
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
