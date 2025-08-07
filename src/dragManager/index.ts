import type { Drag } from '../drag'

// Unified drag event interface that abstracts mouse/touch differences
export interface DragEvent {
  // Unique identifier for this drag operation (mouse: 'mouse', touch: touch.identifier)
  identifier: string | number
  // Normalized coordinates
  clientX: number
  clientY: number
  // Original event for advanced use cases
  originalEvent: MouseEvent | TouchEvent
  // Event type for debugging
  type: 'mouse' | 'touch'
}

class DragManager {
  private static instance: DragManager
  private dragInstances: Set<Drag> = new Set()
  private isListening: boolean = false
  // Map to track multiple active drag operations: identifier -> Drag instance
  private activeDrags: Map<string | number, Drag> = new Map()
  // Set to track elements that are currently being dragged (for locking)
  private draggedElements: Set<HTMLElement> = new Set()

  // Utility function to convert MouseEvent to DragEvent
  private createMouseDragEvent(event: MouseEvent): DragEvent {
    return {
      identifier: 'mouse',
      clientX: event.clientX,
      clientY: event.clientY,
      originalEvent: event,
      type: 'mouse'
    }
  }

  // Utility function to convert TouchEvent to DragEvent array
  private createTouchDragEvents(event: TouchEvent): DragEvent[] {
    return Array.from(event.touches).map(touch => ({
      identifier: touch.identifier,
      clientX: touch.clientX,
      clientY: touch.clientY,
      originalEvent: event,
      type: 'touch' as const
    }))
  }

  private constructor() {
    this.setupEventListeners()
  }

  // Singleton pattern - get the single instance
  public static getInstance(): DragManager {
    if (!DragManager.instance) {
      DragManager.instance = new DragManager()
    }
    return DragManager.instance
  }

  // Register a Drag instance
  public register(dragInstance: Drag): void {
    this.dragInstances.add(dragInstance)
  }

  // Unregister a Drag instance
  public unregister(dragInstance: Drag): void {
    this.dragInstances.delete(dragInstance)
    // Remove from active drags if present
    for (const [identifier, activeDrag] of this.activeDrags.entries()) {
      if (activeDrag === dragInstance) {
        this.activeDrags.delete(identifier)
      }
    }
  }

  // Setup document event listeners
  private setupEventListeners(): void {
    if (this.isListening) return

    // Mouse events
    document.addEventListener('mousedown', this.handleMouseDown.bind(this), { passive: false })
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: false })
    document.addEventListener('mouseup', this.handleMouseUp.bind(this), { passive: false })

    // Touch events
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })

    this.isListening = true
  }

  // Handle mouse down events
  private handleMouseDown(event: MouseEvent): void {
    this.handleStart(event)
  }

  // Handle touch start events
  private handleTouchStart(event: TouchEvent): void {
    this.handleStart(event)
  }

  // Handle start events (mouse down or touch start)
  private handleStart(event: MouseEvent | TouchEvent): void {
    if (event instanceof MouseEvent) {
      // Handle mouse event
      const dragEvent = this.createMouseDragEvent(event)
      this.handleStartForDragEvent(dragEvent)
    } else if (event instanceof TouchEvent) {
      // Handle touch event - support multiple touches
      const dragEvents = this.createTouchDragEvents(event)
      for (const dragEvent of dragEvents) {
        this.handleStartForDragEvent(dragEvent)
      }
    }

    // Prevent default if any drag started
    if (this.activeDrags.size > 0) {
      event.preventDefault()
    }
  }

  // Handle start for a specific DragEvent
  private handleStartForDragEvent(dragEvent: DragEvent): void {
    // Skip if this identifier is already being dragged
    if (this.activeDrags.has(dragEvent.identifier)) {
      return
    }

    // Find which drag instance should handle this event
    for (const dragInstance of this.dragInstances) {
      if (dragInstance.handleStart(dragEvent)) {
        this.activeDrags.set(dragEvent.identifier, dragInstance)
        // Track the element as being dragged
        this.draggedElements.add(dragInstance.getElement())
        break
      }
    }
  }

  // Handle mouse move events
  private handleMouseMove(event: MouseEvent): void {
    this.handleMove(event)
  }

  // Handle touch move events
  private handleTouchMove(event: TouchEvent): void {
    this.handleMove(event)
  }

  // Handle move events (mouse move or touch move)
  private handleMove(event: MouseEvent | TouchEvent): void {
    if (event instanceof MouseEvent) {
      // Handle mouse event
      const dragEvent = this.createMouseDragEvent(event)
      this.handleMoveForDragEvent(dragEvent)
    } else if (event instanceof TouchEvent) {
      // Handle touch event - support multiple touches
      const dragEvents = this.createTouchDragEvents(event)
      for (const dragEvent of dragEvents) {
        this.handleMoveForDragEvent(dragEvent)
      }
    }

    // Prevent default if any drag is active
    if (this.activeDrags.size > 0) {
      event.preventDefault()
    }
  }

  // Handle move for a specific DragEvent
  private handleMoveForDragEvent(dragEvent: DragEvent): void {
    const dragInstance = this.activeDrags.get(dragEvent.identifier)
    if (dragInstance) {
      dragInstance.handleMove(dragEvent)
    }
  }

  // Handle mouse up events
  private handleMouseUp(event: MouseEvent): void {
    this.handleEnd(event)
  }

  // Handle touch end events
  private handleTouchEnd(event: TouchEvent): void {
    this.handleEnd(event)
  }

  // Handle end events (mouse up or touch end)
  private handleEnd(event: MouseEvent | TouchEvent): void {
    if (event instanceof MouseEvent) {
      // Handle mouse event
      const dragEvent = this.createMouseDragEvent(event)
      this.handleEndForDragEvent(dragEvent)
    } else if (event instanceof TouchEvent) {
      // Handle touch event - for touchend, we need to check which touches ended
      // TouchEvent.changedTouches contains the touches that ended
      const endedTouches = Array.from(event.changedTouches).map(touch => ({
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
        originalEvent: event,
        type: 'touch' as const
      }))

      for (const dragEvent of endedTouches) {
        this.handleEndForDragEvent(dragEvent)
      }
    }
  }

  // Handle end for a specific DragEvent
  private handleEndForDragEvent(dragEvent: DragEvent): void {
    const dragInstance = this.activeDrags.get(dragEvent.identifier)
    if (dragInstance) {
      dragInstance.handleEnd(dragEvent)
      this.activeDrags.delete(dragEvent.identifier)
      // Remove the element from being tracked as dragged
      this.draggedElements.delete(dragInstance.getElement())
    }
  }

  // Get all registered drag instances (for debugging)
  public getRegisteredInstances(): Drag[] {
    return Array.from(this.dragInstances)
  }

  // Check if currently dragging
  public isDragging(): boolean {
    return this.activeDrags.size > 0
  }

  // Get all active drag instances (for debugging)
  public getActiveDrags(): Map<string | number, Drag> {
    return new Map(this.activeDrags)
  }

  // Check if a specific element is currently being dragged
  public isElementBeingDragged(element: HTMLElement): boolean {
    return this.draggedElements.has(element)
  }
}

// Export the singleton instance
export const dragManager = DragManager.getInstance()
export { DragManager }
