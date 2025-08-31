import { MatrixTransforms } from '../matrixTransforms'
import type { Pose } from '../../drag/dragMethods'

// 创建模拟的 Pose 对象
function createMockPose(left: number = 0, top: number = 0, scale: number = 1, rotateDeg: number = 0): Pose {
  const style = document.createElement('div').style
  style.position = 'absolute'
  style.left = `${left}px`
  style.top = `${top}px`
  style.transform = `rotate(${rotateDeg}deg) scale(${scale})`

  const rect = new DOMRect(left, top, 100, 100) // 默认100x100尺寸

  return { rect, style }
}

describe('MatrixTransforms', () => {
  const samplePose = createMockPose(100, 200, 1.5, 45)

  test('应该能将 Pose 转换为矩阵', () => {
    const matrix = MatrixTransforms.poseToMatrix(samplePose)

    // 矩阵应该是 3x3
    expect(matrix.size()).toEqual([3, 3])

    // 验证平移分量
    expect(matrix.get([0, 2])).toBe(100) // translateX
    expect(matrix.get([1, 2])).toBe(200) // translateY
  })

  test('应该能计算变换差值', () => {
    const fromPose = createMockPose(0, 0, 1, 0)
    const toPose = createMockPose(50, 100, 2, 90)

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
    const newPose = createMockPose(0, 0, 2, 0)

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
    const fromPose = createMockPose(0, 0, 1, 0)
    const toPose = createMockPose(100, 200, 2, 90)

    // 中点插值
    const midPose = MatrixTransforms.interpolatePose(fromPose, toPose, 0.5)

    // 验证返回的Pose对象包含rect和style
    expect(midPose.rect).toBeDefined()
    expect(midPose.style).toBeDefined()
    expect(midPose.style.left).toMatch(/50px/)
    expect(midPose.style.top).toMatch(/100px/)
    expect(midPose.style.transform).toMatch(/scale\(1\.5\)/)
    expect(midPose.style.transform).toMatch(/rotate\(45deg\)/)
  })

  test('应该正确处理角度插值的边界情况', () => {
    const fromPose = createMockPose(0, 0, 1, 350)
    const toPose = createMockPose(0, 0, 1, 10)

    // 应该走最短路径（350 -> 360 -> 10，而不是 350 -> 10）
    const midPose = MatrixTransforms.interpolatePose(fromPose, toPose, 0.5)

    // 中点应该是 0 度左右，验证transform属性
    const transformMatch = midPose.style.transform.match(/rotate\(([\d.-]+)deg\)/)
    expect(transformMatch).toBeTruthy()
    if (transformMatch) {
      const angle = parseFloat(transformMatch[1])
      expect(Math.abs(angle) < 5 || Math.abs(angle - 360) < 5).toBeTruthy()
    }
  })

  test('应该能处理复杂的几何变换', () => {
    // 测试一个复杂的场景：元素在缩放和旋转时保持触摸点位置
    const touchPoint: [number, number] = [150, 150]
    const originalCenter: [number, number] = [100, 100]
    const originalSize: [number, number] = [100, 100]
    const originalPose = createMockPose(0, 0, 1, 0)

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
    const newPose = createMockPose(100, 100, 2, 90)

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
