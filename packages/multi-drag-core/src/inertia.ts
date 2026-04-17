import { InertialProjection, Point, PoseRecord } from './types'

const DEFAULT_DISTANCE_DECELERATION = 0.007
const DEFAULT_ROTATION_DECELERATION = 0.0005
const DEFAULT_SCALE_DECELERATION = 0.0000001
const MAX_SCALE_CHANGE = 10

function getInertialTimingFunction(initSpeed: number, deceleration: number) {
  return (timeSpend: number) =>
    initSpeed * timeSpend - 0.5 * deceleration * timeSpend ** 2
}

function buildPositionProjection(records: PoseRecord[]) {
  const last = records.at(-1)
  const previous = records.at(-2)

  if (!last || !previous) {
    return undefined
  }

  const distance = Math.hypot(
    last.pose.position.x - previous.pose.position.x,
    last.pose.position.y - previous.pose.position.y
  )
  if (distance <= 1) {
    return undefined
  }

  const timeSpend = last.time - previous.time
  if (timeSpend <= 0) {
    return undefined
  }

  const speed = distance / timeSpend
  const timingFunction = getInertialTimingFunction(
    speed,
    DEFAULT_DISTANCE_DECELERATION
  )
  const vector: Point = {
    x: (last.pose.position.x - previous.pose.position.x) / distance,
    y: (last.pose.position.y - previous.pose.position.y) / distance
  }
  const duration = speed / DEFAULT_DISTANCE_DECELERATION

  return (elapsed: number) => {
    const currentDistance = timingFunction(elapsed)
    if (elapsed > duration || currentDistance < 0) {
      return undefined
    }

    return {
      x: last.pose.position.x + vector.x * currentDistance,
      y: last.pose.position.y + vector.y * currentDistance
    }
  }
}

function buildRotationProjection(records: PoseRecord[]) {
  const last = records.at(-1)
  const previous = records.at(-2)

  if (!last || !previous) {
    return undefined
  }

  if (
    last.pose.rotation === undefined ||
    previous.pose.rotation === undefined
  ) {
    return undefined
  }

  const distance = last.pose.rotation - previous.pose.rotation
  if (distance === 0) {
    return undefined
  }

  const timeSpend = last.time - previous.time
  if (timeSpend <= 0) {
    return undefined
  }

  const speed = distance / timeSpend
  const timingFunction = getInertialTimingFunction(
    speed,
    DEFAULT_ROTATION_DECELERATION
  )
  const duration = Math.abs(speed / DEFAULT_ROTATION_DECELERATION)

  return (elapsed: number) => {
    if (elapsed > duration) {
      return undefined
    }

    return (last.pose.rotation || 0) + timingFunction(elapsed)
  }
}

function buildScaleProjection(records: PoseRecord[]) {
  const last = records.at(-1)
  const previous = records.at(-2)

  if (!last || !previous) {
    return undefined
  }

  if (last.pose.scale === undefined || previous.pose.scale === undefined) {
    return undefined
  }

  const distance = last.pose.scale - previous.pose.scale
  if (distance === 0) {
    return undefined
  }

  const timeSpend = last.time - previous.time
  if (timeSpend <= 0) {
    return undefined
  }

  const speed = distance / timeSpend
  const timingFunction = getInertialTimingFunction(
    speed,
    DEFAULT_SCALE_DECELERATION
  )
  const duration = Math.abs(speed / DEFAULT_SCALE_DECELERATION)

  return (elapsed: number) => {
    const currentDistance = timingFunction(elapsed)
    if (elapsed > duration || Math.abs(currentDistance) > MAX_SCALE_CHANGE) {
      return undefined
    }

    return (last.pose.scale || 1) * (currentDistance + 1)
  }
}

export function createInertiaProjector(records: PoseRecord[]) {
  const positionProjection = buildPositionProjection(records)
  const rotationProjection = buildRotationProjection(records)
  const scaleProjection = buildScaleProjection(records)

  return (elapsed: number): InertialProjection | undefined => {
    const projection: InertialProjection = {
      position: positionProjection?.(elapsed),
      rotation: rotationProjection?.(elapsed),
      scale: scaleProjection?.(elapsed)
    }

    if (
      projection.position === undefined &&
      projection.rotation === undefined &&
      projection.scale === undefined
    ) {
      return undefined
    }

    return projection
  }
}
