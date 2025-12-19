import { Point } from '../../utils/mathUtils'

export function createAnElement() {
  const element = document.createElement('div')
  element.style.position = 'fixed'
  element.style.left = '0px'
  element.style.top = '0px'
  element.style.width = '100px'
  element.style.height = '100px'
  return element
}

export let touchCnt = 0

export function getTouchCnt() {
  return touchCnt++
}

export function mockTouchMove(
  element: HTMLElement,
  initPoint: Point,
  movePoint: Point,
  fingerCnt: number
) {
  const pointerIds = Array.from({ length: fingerCnt }, () => getTouchCnt())
  const pointerDown = pointerIds.map((id, index) => {
    return () => {
      element.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          button: 0,
          clientX: initPoint.x + index * 10,
          clientY: initPoint.y + index * 10,
          pointerId: id,
          pointerType: 'touch',
          isPrimary: index === 0
        })
      )
    }
  })
  const pointerMove = pointerIds.map((id, index) => {
    return () => {
      document.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          button: 0,
          clientX: movePoint.x + index * 10,
          clientY: movePoint.y + index * 10,
          pointerId: id,
          pointerType: 'touch',
          isPrimary: index === 0
        })
      )
    }
  })
  const pointerUp = pointerIds.map((id, index) => {
    return () => {
      document.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          button: 0,
          clientX: movePoint.x + index * 10,
          clientY: movePoint.y + index * 10,
          pointerId: id,
          pointerType: 'touch',
          isPrimary: index === 0
        })
      )
    }
  })
  pointerDown.forEach((fn) => fn())
  pointerMove.forEach((fn) => fn())
  pointerUp.forEach((fn) => fn())
}

export function mockMouseMove(
  element: HTMLElement,
  initPoint: Point,
  movePoint: Point
) {
  const pointerId = Math.floor(Math.random() * 1000000)
  element.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: initPoint.x,
      clientY: initPoint.y,
      pointerId: pointerId,
      pointerType: 'mouse',
      isPrimary: true
    })
  )
  document.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: movePoint.x,
      clientY: movePoint.y,
      pointerId: pointerId,
      pointerType: 'mouse',
      isPrimary: true
    })
  )
  document.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: movePoint.x,
      clientY: movePoint.y,
      pointerId: pointerId,
      pointerType: 'mouse',
      isPrimary: true
    })
  )
}
