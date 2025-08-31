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

// 拖拽方法和工具函数导出
export {
  getPoseFromElement,
  applyPoseToElement,
  keepTouchesRelative,
  type Pose,
  type Point,
  type GestureParams,
  type ApplyPoseOptions,
  type KeepTouchesRelativeOptions,
  type KeepTouchesRelativeAdapters
} from './drag/dragMethods'

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
