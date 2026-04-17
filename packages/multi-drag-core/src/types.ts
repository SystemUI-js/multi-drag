export interface Point {
  x: number
  y: number
}

export interface ReadonlyPoint extends Point {
  readonly x: number
  readonly y: number
}

export interface Pose {
  readonly position: ReadonlyPoint
  readonly rotation?: number
  readonly width: number
  readonly height: number
  readonly scale?: number
}

export enum PointerPhase {
  Start = 'start',
  Move = 'move',
  End = 'end',
  Cancel = 'cancel'
}

export enum GesturePhase {
  Idle = 'idle',
  Start = 'start',
  Move = 'move',
  End = 'end',
  Cancel = 'cancel'
}

export interface NormalizedPointerInput {
  pointerId: number
  point: Point
  phase: PointerPhase
  timestamp: number
  pointerType?: string
  isPrimary?: boolean
}

export interface GestureFeatures {
  drag?: boolean
  rotate?: boolean
  scale?: boolean
}

export interface GesturePointerSnapshot {
  pointerId: number
  startPoint: Point
  currentPoint: Point
  startTimestamp: number
  currentTimestamp: number
}

export interface GestureComputeContext {
  pose: Pose
  anchorCenter?: Point
  features?: GestureFeatures
}

export interface GestureSnapshot {
  phase: GesturePhase
  pose: Pose
  activePointers: GesturePointerSnapshot[]
}

export interface GestureControllerOptions {
  features: GestureFeatures
}

export interface PoseRecord {
  pose: Pose
  time: number
}

export interface InertialProjection {
  position?: Point
  rotation?: number
  scale?: number
}
