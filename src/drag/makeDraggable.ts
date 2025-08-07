import { Drag, type DragOptions } from './index'
import type { DragEvent } from '../dragManager'

// Position interface
export interface Position {
  x: number
  y: number
}

// Function types for getting and setting position
export type GetPositionFunction = (element: HTMLElement) => Position
export type SetPositionFunction = (element: HTMLElement, position: Position) => void

// Options for makeDraggable function
export interface MakeDraggableOptions {
  getPosition?: GetPositionFunction
  setPosition?: SetPositionFunction
}

// Default getPosition function - gets position from element's style
const defaultGetPosition: GetPositionFunction = (element: HTMLElement): Position => {
  const computedStyle = window.getComputedStyle(element)
  const left = parseFloat(computedStyle.left) || 0
  const top = parseFloat(computedStyle.top) || 0

  return { x: left, y: top }
}

// Default setPosition function - sets position to element's style
const defaultSetPosition: SetPositionFunction = (element: HTMLElement, position: Position): void => {
  element.style.left = `${position.x}px`
  element.style.top = `${position.y}px`
}

/**
 * Makes an element draggable with position management
 * @param element - The HTML element to make draggable
 * @param options - Optional configuration with custom getPosition and setPosition functions
 * @returns Drag instance for further control
 */
export function makeDraggable(
  element: HTMLElement,
  options: MakeDraggableOptions = {}
): Drag {
  const {
    getPosition = defaultGetPosition,
    setPosition = defaultSetPosition
  } = options

  // Store the initial position when drag starts
  let initialPosition: Position
  let startDragPosition: Position

  const dragOptions: DragOptions = {
    onDragStart: (element: HTMLElement, event: DragEvent) => {
      // Get the current position of the element
      initialPosition = getPosition(element)
      // Store the starting drag coordinates
      startDragPosition = { x: event.clientX, y: event.clientY }

      // Ensure the element has position absolute or relative for dragging
      const computedStyle = window.getComputedStyle(element)
      if (computedStyle.position === 'static') {
        element.style.position = 'relative'
      }
    },

    onDragMove: (element: HTMLElement, event: DragEvent) => {
      // Calculate the relative movement from the start position
      const deltaX = event.clientX - startDragPosition.x
      const deltaY = event.clientY - startDragPosition.y

      // Calculate new position based on initial position + delta
      const newPosition: Position = {
        x: initialPosition.x + deltaX,
        y: initialPosition.y + deltaY
      }

      // Set the new position
      setPosition(element, newPosition)
    },

    onDragEnd: (_element: HTMLElement, _event: DragEvent) => {
      // Optional: Could add cleanup or final position adjustment here
    }
  }

  // Create and return the Drag instance
  return new Drag(element, dragOptions)
}
