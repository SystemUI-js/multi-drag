import { dragManager, type DragEvent } from '../dragManager'

export interface DragOptions {
  onDragStart?: (element: HTMLElement, event: DragEvent) => void
  onDragMove?: (element: HTMLElement, event: DragEvent) => void
  onDragEnd?: (element: HTMLElement, event: DragEvent) => void
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
  handleStart(event: DragEvent): boolean {
    // Check if the event target is this element or a child of this element
    const target = event.originalEvent.target as HTMLElement
    if (!this.element.contains(target)) {
      return false
    }

    // Check if this element is already being dragged (locking mechanism)
    if (dragManager.isElementBeingDragged(this.element)) {
      return false
    }

    this.isDragging = true

    // Call user-defined onDragStart callback
    if (this.options.onDragStart) {
      this.options.onDragStart(this.element, event)
    }

    return true
  }

  // Called by DragManager when a drag move event occurs
  handleMove(event: DragEvent): void {
    if (!this.isDragging) return

    // Call user-defined onDragMove callback
    if (this.options.onDragMove) {
      this.options.onDragMove(this.element, event)
    }
  }

  // Called by DragManager when a drag end event occurs
  handleEnd(event: DragEvent): void {
    if (!this.isDragging) return

    this.isDragging = false

    // Call user-defined onDragEnd callback
    if (this.options.onDragEnd) {
      this.options.onDragEnd(this.element, event)
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
