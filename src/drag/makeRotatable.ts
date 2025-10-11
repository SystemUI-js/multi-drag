import { Drag, type DragOptions, type DragStartPayload } from './index'
import { keepTouchesRelative } from './dragMethods'
import { type Pose } from '../utils/dragUtils'
import { getPoseFromElement, applyPoseToElement } from '../utils/dragUtils'
import type { GetPoseFunction, SetPoseFunction } from './makeDraggable'
import { Point } from '../utils/mathUtils'

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
    onDragStart: (element: HTMLElement, localPoints: Point[], globalPoints: Point[]) => {
      const initialPose = getPose(element)
      const computedStyle = window.getComputedStyle(element)
      if (computedStyle.position === 'static') {
        element.style.position = 'relative'
      }
      const payload: DragStartPayload<Pose> = { initialPose, startLocalPoints: localPoints, startGlobalPoints: globalPoints }
      return payload
    },

    onDragMove: (element: HTMLElement, _, globalPoints: Point[], startPayload?: DragStartPayload<Pose>) => {
      keepTouchesRelative(
        {
          element,
          initialPose: startPayload?.initialPose ?? getPose(element),
          startGlobalPoints: startPayload?.startGlobalPoints ?? [],
          currentGlobalPoints: globalPoints
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

    onDragEnd: (_element: HTMLElement, _localPoints: Point[], _globalPoints: Point[], _startPayload?: DragStartPayload<Pose>) => {
      // no-op for now
    }
  }

  return new Drag(element, dragOptions)
}
