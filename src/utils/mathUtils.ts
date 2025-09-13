import { evaluate, matrix, multiply, subtract, add, norm, cos, sin, pi } from 'mathjs'
import type { Matrix } from 'mathjs'

/**
 * 数学工具函数，使用 math.js 进行复杂的数学计算
 */

// 示例：矩阵变换相关的数学运算
export class MathUtils {
  /**
   * 创建2D变换矩阵
   * @param translateX X轴平移
   * @param translateY Y轴平移
   * @param scaleX X轴缩放
   * @param scaleY Y轴缩放
   * @param rotation 旋转角度（弧度）
   */
  static createTransformMatrix(
    translateX: number,
    translateY: number,
    scaleX: number,
    scaleY: number,
    rotation: number
  ) {
    const cosR = cos(rotation) as number
    const sinR = sin(rotation) as number

    // 创建变换矩阵 [sx*cos, -sx*sin, tx; sy*sin, sy*cos, ty; 0, 0, 1]
    return matrix([
      [scaleX * cosR, -scaleX * sinR, translateX],
      [scaleY * sinR, scaleY * cosR, translateY],
      [0, 0, 1]
    ])
  }

  /**
   * 将点应用变换矩阵
   * @param point 2D点 {x, y}
   * @param transformMatrix 3x3变换矩阵
   */
  static transformPoint(point: Point, transformMatrix: Matrix) {
    const homogeneousPoint = matrix([point.x, point.y, 1])
    const result = multiply(transformMatrix, homogeneousPoint) as Matrix
    return { x: result.get([0]), y: result.get([1]) }
  }

  /**
   * 计算两点之间的距离
   * @param p1 点1 {x, y}
   * @param p2 点2 {x, y}
   */
  static distance(p1: Point, p2: Point): number {
    const diff = subtract([p2.x, p2.y], [p1.x, p1.y]) as number[]
    return norm(diff) as number
  }

  /**
   * 计算两点之间的角度（弧度）
   * @param p1 起始点 {x, y}
   * @param p2 结束点 {x, y}
   */
  static angle(p1: Point, p2: Point): number {
    const diff = subtract([p2.x, p2.y], [p1.x, p1.y]) as number[]
    return Math.atan2(diff[1], diff[0])
  }

  /**
   * 使用 math.js 进行复杂表达式计算
   * @param expression 数学表达式字符串
   * @param scope 变量作用域
   */
  static evaluate<T = number>(expression: string, scope?: Record<string, unknown>): T {
    if (scope) {
      return evaluate(expression, scope) as T
    }
    return evaluate(expression) as T
  }

  /**
   * 将角度转换为弧度
   * @param degrees 角度
   */
  static degToRad(degrees: number): number {
    return (degrees * pi as number) / 180
  }

  /**
   * 将弧度转换为角度
   * @param radians 弧度
   */
  static radToDeg(radians: number): number {
    return (radians * 180) / (pi as number)
  }

  /**
   * 计算多个点的中点（质心）
   * @param points 点数组
   * @returns 所有点的中点坐标 {x, y}
   */
  static getCentroid(points: Point[]): Point {
    if (points.length === 0) {
      throw new Error('点数组不能为空')
    }
    
    const sum = points.reduce(
      (acc, point) => {
        acc.x += point.x
        acc.y += point.y
        return acc
      },
      { x: 0, y: 0 }
    )
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    }
  }
}

// 导出一些常用的 math.js 函数
export { evaluate, matrix, multiply, subtract, add, norm, cos, sin, pi }

export interface Point {
  x: number
  y: number
}
