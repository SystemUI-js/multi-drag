import { Drag, type DragOptions, type DragStartPayload } from './index'
import { type Pose, getPoseFromElement, applyPoseToElement, keepTouchesRelative } from './dragMethods'
import type { DragEvent } from '../dragManager'
import type { GetPoseFunction, SetPoseFunction } from './makeDraggable'

export interface MakeRotatableOptions {
  getPose?: GetPoseFunction
  setPose?: SetPoseFunction
}

const defaultGetPose: GetPoseFunction = (element: HTMLElement): Pose => getPoseFromElement(element)
const defaultSetPose: SetPoseFunction = (element: HTMLElement, pose: Pose): void => {
  applyPoseToElement(element, pose)
}

export function makeRotatable(
  element: HTMLElement,
  options: MakeRotatableOptions = {}
): Drag {
  const {
    getPose = defaultGetPose,
    setPose = defaultSetPose
  } = options

  const dragOptions: DragOptions = {
    onDragStart: (element: HTMLElement, events: DragEvent[]) => {
      const initialPose = getPose(element)
      const computedStyle = window.getComputedStyle(element)
      if (computedStyle.position === 'static') {
        element.style.position = 'relative'
      }
      const payload: DragStartPayload<Pose> = { initialPose, startEvents: events }
      return payload
    },

    onDragMove: (element: HTMLElement, events: DragEvent[], startPayload?: DragStartPayload<Pose>) => {
      keepTouchesRelative(
        {
          element,
          initialPose: startPayload?.initialPose ?? getPose(element),
          startEvents: startPayload?.startEvents ?? [],
          currentEvents: events
        },
        {
          enableMove: false,
          enableScale: false,
          enableRotate: true,
          transformOrigin: 'center center'
        },
        {
          getPose,
          setPose: (el, newPose) => setPose(el, newPose)
        }
      )
    },

    onDragEnd: (_element: HTMLElement, _events: DragEvent[]) => {
      // no-op for now
    }
  }

  return new Drag(element, dragOptions)
}

