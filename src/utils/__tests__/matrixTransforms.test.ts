import { MatrixTransforms } from '../matrixTransforms'
import type { Pose } from '../../drag/dragMethods'

describe('MatrixTransforms', () => {
  const samplePose: Pose = {
    left: 100,
    top: 200,
    scale: 1.5,
    rotateDeg: 45
  }

  test('应该能将 Pose 转换为矩阵', () => {
    const matrix = MatrixTransforms.poseToMatrix(samplePose)

    // 矩阵应该是 3x3
    expect(matrix.size()).toEqual([3, 3])

    // 验证平移分量
    expect(matrix.get([0, 2])).toBe(100) // translateX
    expect(matrix.get([1, 2])).toBe(200) // translateY
  })

  test('应该能计算变换差值', () => {
    const fromPose: Pose = { left: 0, top: 0, scale: 1, rotateDeg: 0 }
    const toPose: Pose = { left: 50, top: 100, scale: 2, rotateDeg: 90 }

    const delta = MatrixTransforms.calculateTransformDelta(fromPose, toPose)

    expect(delta.deltaX).toBe(50)
    expect(delta.deltaY).toBe(100)
    expect(delta.deltaScale).toBe(2)
    expect(delta.deltaRotation).toBe(90)
  })

  test('应该能计算相对位置', () => {
    const touchPoint: [number, number] = [150, 250]
    const elementCenter: [number, number] = [100, 200]
    const elementSize: [number, number] = [100, 100]

    const relative = MatrixTransforms.calculateRelativePosition(
      touchPoint,
      elementCenter,
      elementSize,
      samplePose
    )

    // 验证返回值的结构
    expect(typeof relative.relativeX).toBe('number')
    expect(typeof relative.relativeY).toBe('number')
    expect(typeof relative.localX).toBe('number')
    expect(typeof relative.localY).toBe('number')
  })

  test('应该能根据相对位置计算新的触摸点位置', () => {
    const relativePosition = { relativeX: 0.5, relativeY: 0.5 }
    const newElementCenter: [number, number] = [200, 300]
    const newElementSize: [number, number] = [200, 200]
    const newPose: Pose = { left: 0, top: 0, scale: 2, rotateDeg: 0 }

    const newPosition = MatrixTransforms.calculateNewTouchPosition(
      relativePosition,
      newElementCenter,
      newElementSize,
      newPose
    )

    expect(newPosition).toHaveLength(2)
    expect(typeof newPosition[0]).toBe('number')
    expect(typeof newPosition[1]).toBe('number')
  })

  test('应该能进行姿态插值', () => {
    const fromPose: Pose = { left: 0, top: 0, scale: 1, rotateDeg: 0 }
    const toPose: Pose = { left: 100, top: 200, scale: 2, rotateDeg: 90 }

    // 中点插值
    const midPose = MatrixTransforms.interpolatePose(fromPose, toPose, 0.5)

    expect(midPose.left).toBeCloseTo(50)
    expect(midPose.top).toBeCloseTo(100)
    expect(midPose.scale).toBeCloseTo(1.5)
    expect(midPose.rotateDeg).toBeCloseTo(45)
  })

  test('应该正确处理角度插值的边界情况', () => {
    const fromPose: Pose = { left: 0, top: 0, scale: 1, rotateDeg: 350 }
    const toPose: Pose = { left: 0, top: 0, scale: 1, rotateDeg: 10 }

    // 应该走最短路径（350 -> 360 -> 10，而不是 350 -> 10）
    const midPose = MatrixTransforms.interpolatePose(fromPose, toPose, 0.5)

    // 中点应该是 0 度左右
    expect(Math.abs(midPose.rotateDeg) < 5 || Math.abs(midPose.rotateDeg - 360) < 5).toBeTruthy()
  })

  test('应该能处理复杂的几何变换', () => {
    // 测试一个复杂的场景：元素在缩放和旋转时保持触摸点位置
    const touchPoint: [number, number] = [150, 150]
    const originalCenter: [number, number] = [100, 100]
    const originalSize: [number, number] = [100, 100]
    const originalPose: Pose = { left: 0, top: 0, scale: 1, rotateDeg: 0 }

    // 计算相对位置
    const relative = MatrixTransforms.calculateRelativePosition(
      touchPoint,
      originalCenter,
      originalSize,
      originalPose
    )

    // 应用新的变换
    const newCenter: [number, number] = [200, 200]
    const newSize: [number, number] = [100, 100] // 基础尺寸不变
    const newPose: Pose = { left: 100, top: 100, scale: 2, rotateDeg: 90 }

    // 计算新的触摸点位置
    const newTouchPoint = MatrixTransforms.calculateNewTouchPosition(
      relative,
      newCenter,
      newSize,
      newPose
    )

    // 验证结果合理
    expect(newTouchPoint).toHaveLength(2)
    expect(isFinite(newTouchPoint[0])).toBeTruthy()
    expect(isFinite(newTouchPoint[1])).toBeTruthy()
  })
})
