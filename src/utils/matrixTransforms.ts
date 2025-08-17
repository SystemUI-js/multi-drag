import { MathUtils } from './mathUtils'
import type { Pose } from '../drag/dragMethods'

/**
 * 使用 math.js 进行高级矩阵变换的工具类
 * 这些函数可以用于更复杂的几何变换计算
 */
export class MatrixTransforms {
  /**
   * 将 Pose 转换为变换矩阵
   * @param pose 元素的姿态信息
   */
  static poseToMatrix(pose: Pose) {
    const rotation = MathUtils.degToRad(pose.rotateDeg)
    return MathUtils.createTransformMatrix(
      pose.left,
      pose.top,
      pose.scale,
      pose.scale,
      rotation
    )
  }

  /**
   * 计算两个变换之间的差值矩阵
   * 可用于计算从一个状态到另一个状态需要的变换
   * @param fromPose 起始姿态
   * @param toPose 目标姿态
   */
  static calculateTransformDelta(fromPose: Pose, toPose: Pose) {
    // 计算差值（这里是简化版本，实际可能需要矩阵求逆）
    return {
      deltaX: toPose.left - fromPose.left,
      deltaY: toPose.top - fromPose.top,
      deltaScale: toPose.scale / fromPose.scale,
      deltaRotation: toPose.rotateDeg - fromPose.rotateDeg
    }
  }

  /**
   * 使用数学公式验证触摸点的相对位置计算
   * @param touchPoint 触摸点坐标 [x, y]
   * @param elementCenter 元素中心坐标 [x, y]
   * @param elementSize 元素尺寸 [width, height]
   * @param pose 元素当前姿态
   */
  static calculateRelativePosition(
    touchPoint: [number, number],
    elementCenter: [number, number],
    elementSize: [number, number],
    pose: Pose
  ) {
    // 使用 math.js 进行精确计算
    const [touchX, touchY] = touchPoint
    const [centerX, centerY] = elementCenter
    const [width, height] = elementSize

    // 计算相对于元素中心的偏移
    const offsetX = touchX - centerX
    const offsetY = touchY - centerY

    // 考虑旋转的影响，计算触摸点在元素局部坐标系中的位置
    const rotation = MathUtils.degToRad(pose.rotateDeg)
    const cosR = Math.cos(rotation)
    const sinR = Math.sin(rotation)

    // 逆旋转变换
    const localX = (offsetX * cosR + offsetY * sinR) / pose.scale
    const localY = (-offsetX * sinR + offsetY * cosR) / pose.scale

    // 转换为相对百分比
    const relativeX = localX / width
    const relativeY = localY / height

    return {
      relativeX,
      relativeY,
      localX,
      localY,
      offsetX,
      offsetY
    }
  }

  /**
   * 根据相对位置和新的姿态计算新的触摸点位置
   * @param relativePosition 相对位置信息
   * @param newElementCenter 新的元素中心
   * @param newElementSize 新的元素尺寸
   * @param newPose 新的姿态
   */
  static calculateNewTouchPosition(
    relativePosition: { relativeX: number, relativeY: number },
    newElementCenter: [number, number],
    newElementSize: [number, number],
    newPose: Pose
  ): [number, number] {
    const [centerX, centerY] = newElementCenter
    const [width, height] = newElementSize
    const { relativeX, relativeY } = relativePosition

    // 计算局部坐标
    const localX = relativeX * width
    const localY = relativeY * height

    // 应用缩放
    const scaledX = localX * newPose.scale
    const scaledY = localY * newPose.scale

    // 应用旋转
    const rotation = MathUtils.degToRad(newPose.rotateDeg)
    const cosR = Math.cos(rotation)
    const sinR = Math.sin(rotation)

    const rotatedX = scaledX * cosR - scaledY * sinR
    const rotatedY = scaledX * sinR + scaledY * cosR

    // 转换为全局坐标
    const globalX = centerX + rotatedX
    const globalY = centerY + rotatedY

    return [globalX, globalY]
  }

  /**
   * 使用 math.js 计算复杂的几何插值
   * 可用于动画或平滑过渡
   * @param fromPose 起始姿态
   * @param toPose 目标姿态
   * @param t 插值参数 (0-1)
   */
  static interpolatePose(fromPose: Pose, toPose: Pose, t: number): Pose {
    // 使用 math.js 的表达式计算进行插值
    const lerpX = MathUtils.evaluate('from + (to - from) * t', {
      from: fromPose.left,
      to: toPose.left,
      t
    })

    const lerpY = MathUtils.evaluate('from + (to - from) * t', {
      from: fromPose.top,
      to: toPose.top,
      t
    })

    const lerpScale = MathUtils.evaluate('from + (to - from) * t', {
      from: fromPose.scale,
      to: toPose.scale,
      t
    })

    // 角度插值需要考虑最短路径
    let angleDiff = toPose.rotateDeg - fromPose.rotateDeg
    if (angleDiff > 180) angleDiff -= 360
    if (angleDiff < -180) angleDiff += 360

    const lerpRotation = fromPose.rotateDeg + angleDiff * t

    return {
      left: lerpX,
      top: lerpY,
      scale: lerpScale,
      rotateDeg: lerpRotation
    }
  }
}

// 导出一些有用的数学常数和函数
export { MathUtils }
