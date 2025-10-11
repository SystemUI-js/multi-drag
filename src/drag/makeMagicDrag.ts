import { Drag, type DragOptions, type DragStartPayload } from './index'
import {
  keepTouchesRelative,
  type KeepTouchesRelativeOptions
} from './dragMethods'
import {
  type Pose,
  getPoseFromElement,
  applyPoseToElement
} from '../utils/dragUtils'
import type { GetPoseFunction, SetPoseFunction } from './makeDraggable'
import { Point } from '../utils/mathUtils'

export interface MakeMagicDragOptions extends KeepTouchesRelativeOptions {
  getPose?: GetPoseFunction
  setPose?: SetPoseFunction
}

const defaultGetPose: GetPoseFunction = (element: HTMLElement): Pose => getPoseFromElement(element)
const defaultSetPose: SetPoseFunction = (element: HTMLElement, pose: Pose): void => {
  applyPoseToElement(element, pose)
}

export function makeMagicDrag(
  element: HTMLElement,
  options: MakeMagicDragOptions = {}
): Drag {
  const {
    getPose = defaultGetPose,
    setPose = defaultSetPose,
    enableMove = true,
    enableScale = true,
    enableRotate = true,
    singleFingerPriority = ['drag'],
    transformOrigin = 'center center',
    transition
  } = options

  const dragOptions: DragOptions = {
    onDragStart: (element: HTMLElement, localPoints: Point[], globalPoints: Point[]) => {
      const initialPose = getPose(element)
      const computedStyle = window.getComputedStyle(element)
      if (computedStyle.position === 'static') {
        element.style.position = 'relative'
      }
      const payload: DragStartPayload<Pose> = { initialPose, startGlobalPoints: globalPoints, startLocalPoints: localPoints }
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
          enableMove,
          enableScale,
          enableRotate,
          singleFingerPriority,
          transformOrigin,
          transition
        },
        {
          getPose,
          setPose: (el, newPose, _opts) => setPose(el, newPose)
        }
      )
    },

    onDragEnd: (_element: HTMLElement, _localPoints: Point[], _globalPoints: Point[]) => {
      // Optional: Could add cleanup or final position adjustment here
    }
  }

  return new Drag(element, dragOptions)
}
