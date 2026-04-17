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

interface InternalPointerState extends GesturePointerSnapshot {}

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

  constructor(private readonly options: GestureControllerOptions) {}

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
      for (const pointer of this.pointers.values()) {
        pointer.startPoint = { ...pointer.currentPoint }
        pointer.startTimestamp = pointer.currentTimestamp
      }

      this.initialPose = clonePose(context.pose)
      this.anchorCenter = context.anchorCenter
      this.pointers.set(input.pointerId, {
        pointerId: input.pointerId,
        startPoint: { ...input.point },
        currentPoint: { ...input.point },
        startTimestamp: input.timestamp,
        currentTimestamp: input.timestamp
      })

      return this.buildSnapshot(GesturePhase.Start, context.pose)
    }

    const pointer = this.pointers.get(input.pointerId)
    if (!pointer) {
      return this.buildSnapshot(GesturePhase.Idle, context.pose)
    }

    pointer.currentPoint = { ...input.point }
    pointer.currentTimestamp = input.timestamp

    if (!this.initialPose) {
      this.initialPose = clonePose(context.pose)
    }
    if (context.anchorCenter) {
      this.anchorCenter = context.anchorCenter
    }

    const phase =
      input.phase === PointerPhase.Move
        ? GesturePhase.Move
        : input.phase === PointerPhase.Cancel
          ? GesturePhase.Cancel
          : GesturePhase.End

    const pose = this.computePose(context.pose, features)
    const snapshot = this.buildSnapshot(phase, pose)

    if (
      input.phase === PointerPhase.End ||
      input.phase === PointerPhase.Cancel
    ) {
      this.pointers.delete(input.pointerId)
      if (this.pointers.size === 0) {
        this.initialPose = undefined
        this.anchorCenter = undefined
      }
    }

    return snapshot
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
