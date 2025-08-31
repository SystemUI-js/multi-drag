# API Docs (English)

> This covers `Drag`, `makeDraggable`, `dragManager`/`DragManager`, gesture helpers in `dragMethods`, and utilities `MatrixTransforms` and `MathUtils`. Examples include inline comments for clarity.

## Install & Import

```bash
# install
yarn add multi-drag
# or
npm i multi-drag
```

```ts
import {
  Drag,
  dragManager,
  makeDraggable,
  getPoseFromElement,
  applyPoseToElement,
  keepTouchesRelative,
  MatrixTransforms,
  MathUtils
} from 'multi-drag'
```

## Quick Start

```ts
const box = document.getElementById('box') as HTMLElement

// make the element draggable by moving left/top
const drag = makeDraggable(box, {
  getPosition: (el) => ({
    x: parseFloat(getComputedStyle(el).left) || 0,
    y: parseFloat(getComputedStyle(el).top) || 0
  }),
  setPosition: (el, pos) => {
    el.style.left = `${pos.x}px`
    el.style.top = `${pos.y}px`
  }
})

// drag.destroy()
```

---

## Drag class

```ts
new Drag(element: HTMLElement, options?: DragOptions)
```

- `options`:
  - `onDragStart?(element, events)`
  - `onDragMove?(element, events)`
  - `onDragEnd?(element, events)`
- Methods: `getElement()`, `getIsDragging()`, `destroy()`

```ts
interface DragOptions {
  onDragStart?: (element: HTMLElement, events: DragEvent[]) => void
  onDragMove?: (element: HTMLElement, events: DragEvent[]) => void
  onDragEnd?: (element: HTMLElement, events: DragEvent[]) => void
}
```

## makeDraggable

```ts
function makeDraggable(
  element: HTMLElement,
  options?: {
    getPosition?: (el: HTMLElement) => { x: number; y: number }
    setPosition?: (el: HTMLElement, pos: { x: number; y: number }) => void
  }
): Drag
```

- Adds move-by-drag behavior with optional custom position getters/setters.
- Defaults read/write `style.left/top`, sets `position: relative` if `static`.

## dragManager / DragManager

- Singleton that normalizes mouse/touch into `DragEvent` and groups touches by target `Drag` instance.

```ts
interface DragEvent {
  identifier: string | number
  clientX: number
  clientY: number
  target: EventTarget | null
  originalEvent: MouseEvent | TouchEvent
  type: 'mouse' | 'touch'
}
```

- Useful methods:
  - `isDragging()`
  - `getRegisteredInstances()`
  - `getActiveDrags()`
  - `isElementBeingDragged(element)`

## dragMethods

- `getPoseFromElement(element): Pose` — snapshot DOMRect and selected styles.
- `applyPoseToElement(element, pose, options?)` — apply only relevant styles to avoid transform stacking.
- `keepTouchesRelative(params, options?)` — keep touch points relatively stable within the element while moving/scaling/rotating.

```ts
interface Pose { rect: DOMRect; style: CSSStyleDeclaration }
interface GestureParams {
  element: HTMLElement
  initialPose: Pose
  startEvents: DragEvent[]
  currentEvents: DragEvent[]
}
interface KeepTouchesRelativeOptions {
  enableScale?: boolean
  enableRotate?: boolean
  enableMove?: boolean
  singleFingerPriority?: ('scale' | 'rotate' | 'drag')[]
  transformOrigin?: string
  transition?: string
}
```

## MatrixTransforms

```ts
class MatrixTransforms {
  static poseToMatrix(pose: Pose)
  static calculateTransformDelta(fromPose: Pose, toPose: Pose)
  static calculateRelativePosition(
    touchPoint: [number, number],
    elementCenter: [number, number],
    elementSize: [number, number],
    pose: Pose
  )
  static calculateNewTouchPosition(
    relativePosition: { relativeX: number; relativeY: number },
    newElementCenter: [number, number],
    newElementSize: [number, number],
    newPose: Pose
  ): [number, number]
  static interpolatePose(fromPose: Pose, toPose: Pose, t: number): Pose
}
```

## MathUtils and re-exports

```ts
class MathUtils {
  static createTransformMatrix(tx: number, ty: number, sx: number, sy: number, rotRad: number)
  static transformPoint(point: [number, number], mat: any)
  static distance(p1: [number, number], p2: [number, number]): number
  static angle(p1: [number, number], p2: [number, number]): number
  static evaluate(expression: string, scope?: Record<string, any>): any
  static degToRad(deg: number): number
  static radToDeg(rad: number): number
}

export { evaluate, matrix, multiply, subtract, add, norm, cos, sin, pi }
```
