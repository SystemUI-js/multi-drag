import { Point } from '@system-ui-js/multi-drag-core'

type PointerEventInitWithFields = PointerEventInit & {
  pointerId?: number
  pointerType?: string
  isPrimary?: boolean
}

class TestPointerEvent extends MouseEvent {
  readonly pointerId: number
  readonly pointerType: string
  readonly isPrimary: boolean

  constructor(type: string, init: PointerEventInitWithFields = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
    this.pointerType = init.pointerType ?? 'mouse'
    this.isPrimary = init.isPrimary ?? false
  }
}

const RuntimePointerEvent =
  globalThis.PointerEvent ??
  (TestPointerEvent as unknown as typeof PointerEvent)

export function createAnElement() {
  const element = document.createElement('div')
  element.style.position = 'fixed'
  element.style.left = '0px'
  element.style.top = '0px'
  element.style.width = '100px'
  element.style.height = '100px'
  document.body.appendChild(element)
  return element
}

let touchCounter = 0

function nextPointerId() {
  touchCounter += 1
  return touchCounter
}

export function mockTouchMove(
  element: HTMLElement,
  initPoint: Point,
  movePoint: Point,
  fingerCount: number
) {
  const pointerIds = Array.from({ length: fingerCount }, () => nextPointerId())
  for (const [index, pointerId] of pointerIds.entries()) {
    element.dispatchEvent(
      new RuntimePointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: initPoint.x + index * 10,
        clientY: initPoint.y + index * 10,
        pointerId,
        pointerType: 'touch',
        isPrimary: index === 0
      })
    )
  }

  for (const [index, pointerId] of pointerIds.entries()) {
    document.dispatchEvent(
      new RuntimePointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: movePoint.x + index * 10,
        clientY: movePoint.y + index * 10,
        pointerId,
        pointerType: 'touch',
        isPrimary: index === 0
      })
    )
  }

  for (const [index, pointerId] of pointerIds.entries()) {
    document.dispatchEvent(
      new RuntimePointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: movePoint.x + index * 10,
        clientY: movePoint.y + index * 10,
        pointerId,
        pointerType: 'touch',
        isPrimary: index === 0
      })
    )
  }
}

export function mockMouseMove(
  element: HTMLElement,
  initPoint: Point,
  movePoint: Point
) {
  const pointerId = Math.floor(Math.random() * 1000000)
  element.dispatchEvent(
    new RuntimePointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: initPoint.x,
      clientY: initPoint.y,
      pointerId,
      pointerType: 'mouse',
      isPrimary: true
    })
  )
  document.dispatchEvent(
    new RuntimePointerEvent('pointermove', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: movePoint.x,
      clientY: movePoint.y,
      pointerId,
      pointerType: 'mouse',
      isPrimary: true
    })
  )
  document.dispatchEvent(
    new RuntimePointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: movePoint.x,
      clientY: movePoint.y,
      pointerId,
      pointerType: 'mouse',
      isPrimary: true
    })
  )
}
