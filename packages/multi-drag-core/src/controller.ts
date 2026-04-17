import {
  computeDraggedPosition,
  computeRotationDelta,
  computeScaleDelta
} from './geometry'
import {
  GesturePhase,
  PointerPhase,
  type GestureComputeContext,
  type GestureControllerOptions,
  type GesturePointerSnapshot,
  type GestureSnapshot,
  type NormalizedPointerInput,
  type Pose
} from './types'

type InternalPointerState = GesturePointerSnapshot

type GestureControllerRuntimeOptions = GestureControllerOptions

interface MutablePose {
  position: { x: number; y: number }
  width: number
  height: number
  rotation?: number
  scale?: number
}

function clonePose(pose: Pose): MutablePose {
  return {
    ...pose,
    position: { ...pose.position }
  }
}

export class GestureController {
  private readonly pointers = new Map<number, InternalPointerState>()
  private initialPose?: Pose
  private anchorCenter?: { x: number; y: number }

  constructor(private readonly options: GestureControllerRuntimeOptions) {}

  reset() {
    this.pointers.clear()
    this.initialPose = undefined
    this.anchorCenter = undefined
  }

  process(
    input: NormalizedPointerInput,
    context: GestureComputeContext
  ): GestureSnapshot {
    const features = context.features ?? this.options.features

    if (input.phase === PointerPhase.Start) {
      this.beginPointer(input, context.pose, context.anchorCenter)
      return this.buildSnapshot(GesturePhase.Start, context.pose)
    }

    const pointer = this.pointers.get(input.pointerId)
    if (!pointer) {
      return this.buildSnapshot(GesturePhase.Idle, context.pose)
    }

    this.updatePointer(pointer, input, context)

    const phase = this.resolvePhase(input.phase)

    const pose = this.computePose(context.pose, features)
    const snapshot = this.buildSnapshot(phase, pose)

    if (
      input.phase === PointerPhase.End ||
      input.phase === PointerPhase.Cancel
    ) {
      this.finishPointer(input.pointerId, pose, context.anchorCenter)
    }

    return snapshot
  }

  private beginPointer(
    input: NormalizedPointerInput,
    pose: Pose,
    anchorCenter: { x: number; y: number } | undefined
  ) {
    for (const pointer of this.pointers.values()) {
      pointer.startPoint = { ...pointer.currentPoint }
      pointer.startTimestamp = pointer.currentTimestamp
    }

    this.initialPose = clonePose(pose)
    this.anchorCenter = anchorCenter
    this.pointers.set(input.pointerId, {
      pointerId: input.pointerId,
      startPoint: { ...input.point },
      currentPoint: { ...input.point },
      startTimestamp: input.timestamp,
      currentTimestamp: input.timestamp
    })
  }

  private updatePointer(
    pointer: InternalPointerState,
    input: NormalizedPointerInput,
    context: GestureComputeContext
  ) {
    pointer.currentPoint = { ...input.point }
    pointer.currentTimestamp = input.timestamp

    if (!this.initialPose) {
      this.initialPose = clonePose(context.pose)
    }

    if (context.anchorCenter) {
      this.anchorCenter = context.anchorCenter
    }
  }

  private resolvePhase(phase: NormalizedPointerInput['phase']) {
    if (phase === PointerPhase.Move) {
      return GesturePhase.Move
    }

    if (phase === PointerPhase.Cancel) {
      return GesturePhase.Cancel
    }

    return GesturePhase.End
  }

  private finishPointer(
    pointerId: number,
    pose: Pose,
    anchorCenter: { x: number; y: number } | undefined
  ) {
    const endedPointer = this.pointers.get(pointerId)
    this.pointers.delete(pointerId)

    if (this.pointers.size > 0 && endedPointer) {
      this.initialPose = clonePose(pose)
      this.anchorCenter = anchorCenter ?? this.anchorCenter

      for (const pointer of this.pointers.values()) {
        pointer.startPoint = { ...pointer.currentPoint }
        pointer.startTimestamp = pointer.currentTimestamp
      }
    }

    if (this.pointers.size === 0) {
      this.initialPose = undefined
      this.anchorCenter = undefined
    }
  }

  private computePose(
    fallbackPose: Pose,
    features: GestureControllerOptions['features']
  ): Pose {
    const basePose = clonePose(this.initialPose ?? fallbackPose)
    const pointers = [...this.pointers.values()]

    if (pointers.length === 0) {
      return basePose
    }

    if (features.drag) {
      basePose.position = computeDraggedPosition(basePose.position, pointers)
    }

    if (features.rotate) {
      const anchorCenter = this.anchorCenter ?? {
        x: basePose.position.x + basePose.width / 2,
        y: basePose.position.y + basePose.height / 2
      }
      basePose.rotation =
        (this.initialPose?.rotation || 0) +
        computeRotationDelta(pointers, anchorCenter)
    }

    if (features.scale) {
      const anchorCenter = this.anchorCenter ?? {
        x: basePose.position.x + basePose.width / 2,
        y: basePose.position.y + basePose.height / 2
      }
      basePose.scale =
        (this.initialPose?.scale || 1) +
        (computeScaleDelta(pointers, anchorCenter) - 1) *
          (this.initialPose?.scale || 1)
    }

    return basePose
  }

  private buildSnapshot(phase: GesturePhase, pose: Pose): GestureSnapshot {
    return {
      phase,
      pose,
      activePointers: [...this.pointers.values()].map((pointer) => ({
        pointerId: pointer.pointerId,
        startPoint: { ...pointer.startPoint },
        currentPoint: { ...pointer.currentPoint },
        startTimestamp: pointer.startTimestamp,
        currentTimestamp: pointer.currentTimestamp
      }))
    }
  }
}
