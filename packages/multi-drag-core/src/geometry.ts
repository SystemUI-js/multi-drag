import { GesturePointerSnapshot, Point } from './types'

function averagePoint(points: Point[]): Point {
  const total = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y
    }),
    { x: 0, y: 0 }
  )

  return {
    x: total.x / points.length,
    y: total.y / points.length
  }
}

export function getCenter(pointA: Point, pointB: Point): Point {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2
  }
}

export function getDistance(pointA: Point, pointB: Point): number {
  return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y)
}

export function getAngleByTwoPoints(
  startPoint1: Point,
  startPoint2: Point,
  currentPoint1: Point,
  currentPoint2: Point
): number {
  const startVector = {
    y: startPoint2.y - startPoint1.y,
    x: startPoint2.x - startPoint1.x
  }
  const currentVector = {
    y: currentPoint2.y - currentPoint1.y,
    x: currentPoint2.x - currentPoint1.x
  }
  const angle =
    Math.atan2(currentVector.y, currentVector.x) -
    Math.atan2(startVector.y, startVector.x)

  return (angle * 180) / Math.PI
}

export function computeDraggedPosition(
  initialPosition: Point,
  pointers: GesturePointerSnapshot[]
): Point {
  const startCenter = averagePoint(
    pointers.map((pointer) => pointer.startPoint)
  )
  const currentCenter = averagePoint(
    pointers.map((pointer) => pointer.currentPoint)
  )

  return {
    x: initialPosition.x + currentCenter.x - startCenter.x,
    y: initialPosition.y + currentCenter.y - startCenter.y
  }
}

export function computeRotationDelta(
  pointers: GesturePointerSnapshot[],
  anchorCenter: Point
): number {
  if (pointers.length >= 2) {
    return getAngleByTwoPoints(
      pointers[0].startPoint,
      pointers[1].startPoint,
      pointers[0].currentPoint,
      pointers[1].currentPoint
    )
  }

  const pointer = pointers[0]
  if (!pointer) {
    return 0
  }

  return getAngleByTwoPoints(
    pointer.startPoint,
    anchorCenter,
    pointer.currentPoint,
    anchorCenter
  )
}

export function computeScaleDelta(
  pointers: GesturePointerSnapshot[],
  anchorCenter: Point
): number {
  if (pointers.length >= 2) {
    const startDistance = getDistance(
      pointers[0].startPoint,
      pointers[1].startPoint
    )
    const currentDistance = getDistance(
      pointers[0].currentPoint,
      pointers[1].currentPoint
    )

    return startDistance === 0 ? 1 : currentDistance / startDistance
  }

  const pointer = pointers[0]
  if (!pointer) {
    return 1
  }

  const startDistance = getDistance(pointer.startPoint, anchorCenter)
  const currentDistance = getDistance(pointer.currentPoint, anchorCenter)

  return startDistance === 0 ? 1 : currentDistance / startDistance
}
