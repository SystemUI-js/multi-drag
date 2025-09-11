import type { Drag } from '../drag'

// Unified drag event interface that abstracts mouse/touch differences
export interface DragEvent {
  // Unique identifier for this drag operation (mouse: 'mouse', touch: touch.identifier)
  identifier: string | number
  // Normalized coordinates
  clientX: number
  clientY: number
  // The originating target element for this pointer/touch (if available)
  target: EventTarget | null
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
      target: event.target,
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
      target: touch.target || null,
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
    if (event instanceof MouseEvent) this.handleStartMouse(event)
    else if (event instanceof TouchEvent) this.handleStartTouch(event)
    if (this.activeDrags.size > 0) event.preventDefault()
  }

  // 将鼠标开始逻辑拆分，降低复杂度
  private handleStartMouse(event: MouseEvent): void {
    const dragEvent = this.createMouseDragEvent(event)
    const targetElement = dragEvent.target as HTMLElement | null
    for (const dragInstance of this.dragInstances) {
        // 这里不能用contains因为如果嵌套了就凉了
      if (targetElement && dragInstance.getElement() === targetElement) {
        const didStart = dragInstance.handleStart([dragEvent])
        if (didStart) {
          this.activeDrags.set(dragEvent.identifier, dragInstance)
          this.draggedElements.add(dragInstance.getElement())
        }
        break
      }
    }
  }

  // 将触摸开始逻辑拆分，降低复杂度
  private handleStartTouch(event: TouchEvent): void {
    const dragEvents = this.createTouchDragEvents(event)
    const group = new Map<import('../drag').Drag, DragEvent[]>()
    for (const dragEvent of dragEvents) {
      const targetElement = dragEvent.target as HTMLElement | null
      if (!targetElement) continue
      for (const dragInstance of this.dragInstances) {
        // 这里不能用contains因为如果嵌套了就凉了
        if (dragInstance.getElement() === targetElement) {
          const list = group.get(dragInstance) || []
          list.push(dragEvent)
          group.set(dragInstance, list)
          break
        }
      }
    }
    for (const [dragInstance, eventsForInstance] of group.entries()) {
      const didStart = dragInstance.handleStart(eventsForInstance)
      if (didStart) {
        for (const ev of eventsForInstance) this.activeDrags.set(ev.identifier, dragInstance)
        this.draggedElements.add(dragInstance.getElement())
      }
    }
  }

  // (Deprecated) Per-event start handler is replaced by grouped handling

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
      const dragEvent = this.createMouseDragEvent(event)
      const dragInstance = this.activeDrags.get(dragEvent.identifier)
      if (dragInstance) {
        dragInstance.handleMove([dragEvent])
      }
    } else if (event instanceof TouchEvent) {
      // Handle touch event - support multiple touches grouped by active drag instance
      const dragEvents = this.createTouchDragEvents(event)
      const group = new Map<import('../drag').Drag, DragEvent[]>()
      for (const dragEvent of dragEvents) {
        const dragInstance = this.activeDrags.get(dragEvent.identifier)
        if (dragInstance) {
          const list = group.get(dragInstance) || []
          list.push(dragEvent)
          group.set(dragInstance, list)
        }
      }
      for (const [dragInstance, eventsForInstance] of group.entries()) {
        dragInstance.handleMove(eventsForInstance)
      }
    }

    // Prevent default if any drag is active
    if (this.activeDrags.size > 0) {
      event.preventDefault()
    }
  }

  // (Deprecated) Per-event move handler is replaced by grouped handling

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
    if (event instanceof MouseEvent) this.handleEndMouse(event)
    else if (event instanceof TouchEvent) this.handleEndTouch(event)
  }

  private handleEndMouse(event: MouseEvent): void {
    const dragEvent = this.createMouseDragEvent(event)
    const dragInstance = this.activeDrags.get(dragEvent.identifier)
    if (!dragInstance) return
    dragInstance.handleEnd([dragEvent])
    this.activeDrags.delete(dragEvent.identifier)
    const stillActiveForInstance = Array.from(this.activeDrags.values()).some(inst => inst === dragInstance)
    if (!stillActiveForInstance) this.draggedElements.delete(dragInstance.getElement())
  }

  private handleEndTouch(event: TouchEvent): void {
    const endedTouches = Array.from(event.changedTouches).map(touch => ({
      identifier: touch.identifier,
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: touch.target || null,
      originalEvent: event,
      type: 'touch' as const
    }))
    const group = new Map<import('../drag').Drag, DragEvent[]>()
    for (const dragEvent of endedTouches) {
      const dragInstance = this.activeDrags.get(dragEvent.identifier)
      if (!dragInstance) continue
      const list = group.get(dragInstance) || []
      list.push(dragEvent)
      group.set(dragInstance, list)
    }
    for (const [dragInstance, eventsForInstance] of group.entries()) {
      dragInstance.handleEnd(eventsForInstance)
      for (const ev of eventsForInstance) this.activeDrags.delete(ev.identifier)
      const stillActiveForInstance = Array.from(this.activeDrags.values()).some(inst => inst === dragInstance)
      if (!stillActiveForInstance) this.draggedElements.delete(dragInstance.getElement())
    }
  }

  // (Deprecated) Per-event end handler is replaced by grouped handling

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
