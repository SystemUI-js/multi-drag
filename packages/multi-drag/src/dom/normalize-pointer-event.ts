import type {
  NormalizedPointerInput,
  PointerPhase
} from '@system-ui-js/multi-drag-core'

interface PointerEventWithWebkitForce extends PointerEvent {
  webkitForce?: number
}

function clampPressure(pressure: number) {
  return Math.min(Math.max(pressure, 0), 1)
}

function getEventPressure(event: PointerEvent) {
  const pressure = event.pressure
  if (typeof pressure === 'number') {
    return pressure
  }

  const webkitForce = (event as PointerEventWithWebkitForce).webkitForce
  return typeof webkitForce === 'number' ? webkitForce : undefined
}

export function normalizePressure(event: PointerEvent): number | undefined {
  if (event.pointerType === 'mouse') {
    const webkitForce = (event as PointerEventWithWebkitForce).webkitForce
    if (typeof webkitForce === 'number' && webkitForce > 0) {
      return clampPressure(webkitForce)
    }
    return event.buttons > 0 ? 0.5 : undefined
  }

  const pressure = getEventPressure(event)
  return typeof pressure === 'number' ? clampPressure(pressure) : undefined
}

export function normalizePointerEvent(
  event: PointerEvent,
  phase: PointerPhase
): NormalizedPointerInput {
  return {
    pointerId: event.pointerId,
    point: {
      x: event.clientX,
      y: event.clientY
    },
    phase,
    timestamp: event.timeStamp,
    pressure: normalizePressure(event),
    pointerType: event.pointerType,
    isPrimary: event.isPrimary
  }
}
