import { evaluate, matrix, multiply, subtract, add, norm, cos, sin, pi } from 'mathjs'

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
   * @param point 2D点 [x, y]
   * @param transformMatrix 3x3变换矩阵
   */
  static transformPoint(point: [number, number], transformMatrix: any) {
    const homogeneousPoint = matrix([point[0], point[1], 1])
    const result = multiply(transformMatrix, homogeneousPoint)
    return [result.get([0]), result.get([1])] as [number, number]
  }

  /**
   * 计算两点之间的距离
   * @param p1 点1 [x, y]
   * @param p2 点2 [x, y]
   */
  static distance(p1: [number, number], p2: [number, number]): number {
    const diff = subtract(p2, p1)
    return norm(diff) as number
  }

  /**
   * 计算两点之间的角度（弧度）
   * @param p1 起始点 [x, y]
   * @param p2 结束点 [x, y]
   */
  static angle(p1: [number, number], p2: [number, number]): number {
    const diff = subtract(p2, p1)
    return Math.atan2(diff[1], diff[0])
  }

  /**
   * 使用 math.js 进行复杂表达式计算
   * @param expression 数学表达式字符串
   * @param scope 变量作用域
   */
  static evaluate(expression: string, scope?: Record<string, any>): any {
    if (scope) {
      return evaluate(expression, scope)
    } else {
      return evaluate(expression)
    }
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
}

// 导出一些常用的 math.js 函数
export { evaluate, matrix, multiply, subtract, add, norm, cos, sin, pi }
