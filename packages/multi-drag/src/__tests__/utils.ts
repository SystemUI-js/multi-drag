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

export function createPointerEvent(
  type: string,
  init: PointerEventInitWithFields = {}
) {
  return new RuntimePointerEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init
  })
}

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
      createPointerEvent('pointerdown', {
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
      createPointerEvent('pointermove', {
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
      createPointerEvent('pointerup', {
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
    createPointerEvent('pointerdown', {
      clientX: initPoint.x,
      clientY: initPoint.y,
      pointerId,
      pointerType: 'mouse',
      isPrimary: true
    })
  )
  document.dispatchEvent(
    createPointerEvent('pointermove', {
      clientX: movePoint.x,
      clientY: movePoint.y,
      pointerId,
      pointerType: 'mouse',
      isPrimary: true
    })
  )
  document.dispatchEvent(
    createPointerEvent('pointerup', {
      clientX: movePoint.x,
      clientY: movePoint.y,
      pointerId,
      pointerType: 'mouse',
      isPrimary: true
    })
  )
}
