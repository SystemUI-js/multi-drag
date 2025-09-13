import { MathUtils, matrix, pi } from '../mathUtils'

describe('MathUtils with math.js', () => {
  test('应该能创建和应用变换矩阵', () => {
    // 创建一个简单的变换矩阵（平移10,20，缩放2,2，旋转45度）
    const transform = MathUtils.createTransformMatrix(10, 20, 2, 2, Math.PI / 4)

    // 应用到点 (1, 0)
    const result = MathUtils.transformPoint({x: 1, y: 0}, transform)

    // 验证结果合理
    expect(typeof result.x).toBe('number')
    expect(typeof result.y).toBe('number')
  })

  test('应该能计算两点距离', () => {
    const distance = MathUtils.distance({x: 0, y: 0}, {x: 3, y: 4})
    expect(distance).toBeCloseTo(5) // 3-4-5 直角三角形
  })

  test('应该能计算两点角度', () => {
    const angle = MathUtils.angle({x: 0, y: 0}, {x: 1, y: 1})
    expect(angle).toBeCloseTo(Math.PI / 4) // 45度
  })

  test('应该能进行数学表达式计算', () => {
    // 简单计算
    expect(MathUtils.evaluate('2 + 3 * 4')).toBe(14)

    // 使用变量
    const result = MathUtils.evaluate('x^2 + y^2', { x: 3, y: 4 })
    expect(result).toBe(25)
  })

  test('应该能进行角度弧度转换', () => {
    expect(MathUtils.degToRad(180)).toBeCloseTo(Math.PI)
    expect(MathUtils.radToDeg(Math.PI)).toBeCloseTo(180)
  })

  test('应该能使用 math.js 的矩阵功能', () => {
    const m = matrix([[1, 2], [3, 4]])
    expect(m.size()).toEqual([2, 2])
    expect(m.get([0, 0])).toBe(1)
    expect(m.get([1, 1])).toBe(4)
  })

  test('应该能访问数学常数', () => {
    expect(pi).toBeCloseTo(Math.PI)
  })

  test('应该能进行复杂的矩阵运算', () => {
    // 测试组合变换：先缩放再旋转再平移
    const scale = MathUtils.createTransformMatrix(0, 0, 2, 2, 0)
    const rotate = MathUtils.createTransformMatrix(0, 0, 1, 1, Math.PI / 2)
    const translate = MathUtils.createTransformMatrix(10, 20, 1, 1, 0)

    // 原点 (1, 0)
    let point = {x: 1, y: 0}

    // 应用缩放
    point = MathUtils.transformPoint(point, scale)
    expect(point.x).toBeCloseTo(2)
    expect(point.y).toBeCloseTo(0)

    // 应用旋转
    point = MathUtils.transformPoint(point, rotate)
    expect(point.x).toBeCloseTo(0, 5)
    expect(point.y).toBeCloseTo(2, 5)

    // 应用平移
    point = MathUtils.transformPoint(point, translate)
    expect(point.x).toBeCloseTo(10, 5)
    expect(point.y).toBeCloseTo(22, 5)
  })
})
