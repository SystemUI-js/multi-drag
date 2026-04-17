import {
    NormalizedPointerInput,
    PointerPhase
} from '@system-ui-js/multi-drag-core'

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
        pointerType: event.pointerType,
        isPrimary: event.isPrimary
    }
}
