// 主要拖拽功能导出
export { Drag, type DragOptions, type DragStartPayload } from './drag'
export { dragManager, DragManager, type DragEvent } from './dragManager'
export {
  makeDraggable,
  type Position,
  type GetPositionFunction,
  type SetPositionFunction,
  type MakeDraggableOptions
} from './drag/makeDraggable'

export {
  makeScalable,
  type MakeScalableOptions
} from './drag/makeScalable'

export {
  makeRotatable,
  type MakeRotatableOptions
} from './drag/makeRotatable'

export {
  makeMagicDrag,
  type MakeMagicDragOptions
} from './drag/makeMagicDrag'

export {
  type Point
} from './utils/mathUtils'

// 拖拽方法和工具函数导出
export {
  keepTouchesRelative,
  type GestureParams,
  type KeepTouchesRelativeOptions,
  type KeepTouchesRelativeAdapters
} from './drag/dragMethods'

export {
  getPoseFromElement,
  applyPoseToElement,
  type ApplyPoseOptions,
  type Pose
} from './utils/dragUtils'

// 工具函数导出
export {
  MatrixTransforms,
  MathUtils
} from './utils/matrixTransforms'

export {
  MathUtils as MathUtilsClass,
  evaluate,
  matrix,
  multiply,
  subtract,
  add,
  norm,
  cos,
  sin,
  pi
} from './utils/mathUtils'
