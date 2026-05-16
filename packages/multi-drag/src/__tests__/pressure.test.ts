import { PointerPhase } from '@system-ui-js/multi-drag-core'
import {
  normalizePointerEvent,
  normalizePressure
} from '../dom/normalize-pointer-event'
import { Finger, FingerOperationType } from '../drag/finger'
import { createPointerEvent } from './utils'

function createEvent(
  pointerType: string,
  fields: PointerEventInit & { webkitForce?: number } = {}
) {
  const { webkitForce, ...init } = fields
  const event = createPointerEvent('pointermove', {
    pointerType,
    ...init
  })

  if ('pressure' in init) {
    Object.defineProperty(event, 'pressure', {
      configurable: true,
      value: init.pressure
    })
  }

  if (typeof webkitForce === 'number') {
    Object.defineProperty(event, 'webkitForce', {
      configurable: true,
      value: webkitForce
    })
  }

  return event
}

describe('pressure support', () => {
  it('normalizes pen pressure with clamping', () => {
    expect(normalizePressure(createEvent('pen', { pressure: 0.75 }))).toBe(0.75)
    expect(normalizePressure(createEvent('pen', { pressure: 2 }))).toBe(1)
    expect(normalizePressure(createEvent('pen', { pressure: -0.25 }))).toBe(0)
  })

  it('normalizes mouse pressure only while buttons are active', () => {
    expect(normalizePressure(createEvent('mouse', { buttons: 1 }))).toBe(0.5)
    expect(
      normalizePressure(createEvent('mouse', { buttons: 0 }))
    ).toBeUndefined()
  })

  it('normalizes touch pressure and Safari webkitForce', () => {
    expect(normalizePressure(createEvent('touch', { pressure: 0.4 }))).toBe(0.4)
    expect(normalizePressure(createEvent('touch', { webkitForce: 0.6 }))).toBe(
      0.6
    )
  })

  it('returns pressure from normalized pointer input', () => {
    const event = createEvent('pen', {
      clientX: 10,
      clientY: 20,
      pointerId: 3,
      pressure: 0.8
    })

    expect(normalizePointerEvent(event, PointerPhase.Move)).toMatchObject({
      pointerId: 3,
      point: { x: 10, y: 20 },
      phase: PointerPhase.Move,
      pressure: 0.8,
      pointerType: 'pen'
    })
  })

  it('records pressure in finger path items', () => {
    const startEvent = createEvent('pen', {
      clientX: 0,
      clientY: 0,
      pointerId: 1,
      pressure: 0.2
    })
    const moveEvent = createEvent('pen', {
      clientX: 5,
      clientY: 8,
      pointerId: 1,
      pressure: 0.7
    })

    const finger = new Finger(startEvent)
    const moveItem = finger.record(FingerOperationType.Move, moveEvent)

    expect(finger.getPath()[0].pressure).toBe(0.2)
    expect(moveItem.pressure).toBe(0.7)
  })
})
