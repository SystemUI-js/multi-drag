import { MathUtils } from './mathUtils'
import type { Pose } from '../utils/dragUtils'

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
    // 从style中解析变换信息
    const left = parseFloat(pose.style.left) || 0
    const top = parseFloat(pose.style.top) || 0

        // 解析transform获取scale和rotation
    const transform = pose.style.transform
    let scale = 1
    let rotateDeg = 0

    if (transform && transform !== 'none') {
      // 尝试解析matrix格式
      // 使用更具体、无回溯风险的正则（字符类与量词受限）
      const matrixMatch = /^(?:matrix)\(([-0-9eE.,\s]+)\)$/.exec(transform)
      if (matrixMatch) {
        const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()))
        const [a, b] = values
        scale = Math.sqrt((a || 1) * (a || 1) + (b || 0) * (b || 0)) || 1
        const rotateRad = Math.atan2(b || 0, a || 1)
        rotateDeg = (rotateRad * 180) / Math.PI
      } else {
        // 尝试解析rotate和scale函数格式
        const rotateMatch = /rotate\((-?(?:\d+)(?:\.\d+)?)deg\)/.exec(transform)
        const scaleMatch = /scale\((-?(?:\d+)(?:\.\d+)?)\)/.exec(transform)

        if (rotateMatch) {
          rotateDeg = parseFloat(rotateMatch[1])
        }
        if (scaleMatch) {
          scale = parseFloat(scaleMatch[1])
        }
      }
    }

    const rotation = MathUtils.degToRad(rotateDeg)
    return MathUtils.createTransformMatrix(
      left,
      top,
      scale,
      scale,
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
    // 从style中提取变换信息
    const fromLeft = parseFloat(fromPose.style.left) || 0
    const fromTop = parseFloat(fromPose.style.top) || 0
    const toLeft = parseFloat(toPose.style.left) || 0
    const toTop = parseFloat(toPose.style.top) || 0

        // 解析scale和rotation
    const extractTransformInfo = (style: CSSStyleDeclaration) => {
      const transform = style.transform
      let scale = 1
      let rotateDeg = 0

      if (transform && transform !== 'none') {
        // 尝试解析matrix格式
        const matrixMatch = /^(?:matrix)\(([-0-9eE.,\s]+)\)$/.exec(transform)
        if (matrixMatch) {
          const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()))
          const [a, b] = values
          scale = Math.sqrt((a || 1) * (a || 1) + (b || 0) * (b || 0)) || 1
          const rotateRad = Math.atan2(b || 0, a || 1)
          rotateDeg = (rotateRad * 180) / Math.PI
        } else {
          // 尝试解析rotate和scale函数格式
          const rotateMatch = /rotate\((-?(?:\d+)(?:\.\d+)?)deg\)/.exec(transform)
          const scaleMatch = /scale\((-?(?:\d+)(?:\.\d+)?)\)/.exec(transform)

          if (rotateMatch) {
            rotateDeg = parseFloat(rotateMatch[1])
          }
          if (scaleMatch) {
            scale = parseFloat(scaleMatch[1])
          }
        }
      }

      return { scale, rotateDeg }
    }

    const fromTransform = extractTransformInfo(fromPose.style)
    const toTransform = extractTransformInfo(toPose.style)

    // 计算差值（这里是简化版本，实际可能需要矩阵求逆）
    return {
      deltaX: toLeft - fromLeft,
      deltaY: toTop - fromTop,
      deltaScale: fromTransform.scale !== 0 ? toTransform.scale / fromTransform.scale : toTransform.scale,
      deltaRotation: toTransform.rotateDeg - fromTransform.rotateDeg
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

        // 从style中解析变换信息
    const transform = pose.style.transform
    let scale = 1
    let rotateDeg = 0

    if (transform && transform !== 'none') {
      // 尝试解析matrix格式
      const matrixMatch = /^(?:matrix)\(([-0-9eE.,\s]+)\)$/.exec(transform)
      if (matrixMatch) {
        const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()))
        const [a, b] = values
        scale = Math.sqrt((a || 1) * (a || 1) + (b || 0) * (b || 0)) || 1
        const rotateRad = Math.atan2(b || 0, a || 1)
        rotateDeg = (rotateRad * 180) / Math.PI
      } else {
        // 尝试解析rotate和scale函数格式
        const rotateMatch = /rotate\((-?(?:\d+)(?:\.\d+)?)deg\)/.exec(transform)
        const scaleMatch = /scale\((-?(?:\d+)(?:\.\d+)?)\)/.exec(transform)

        if (rotateMatch) {
          rotateDeg = parseFloat(rotateMatch[1])
        }
        if (scaleMatch) {
          scale = parseFloat(scaleMatch[1])
        }
      }
    }

    // 考虑旋转的影响，计算触摸点在元素局部坐标系中的位置
    const rotation = MathUtils.degToRad(rotateDeg)
    const cosR = Math.cos(rotation)
    const sinR = Math.sin(rotation)

    // 逆旋转变换
    const localX = (offsetX * cosR + offsetY * sinR) / scale
    const localY = (-offsetX * sinR + offsetY * cosR) / scale

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

        // 从style中解析变换信息
    const transform = newPose.style.transform
    let scale = 1
    let rotateDeg = 0

    if (transform && transform !== 'none') {
      // 尝试解析matrix格式
      const matrixMatch = /^(?:matrix)\(([-0-9eE.,\s]+)\)$/.exec(transform)
      if (matrixMatch) {
        const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()))
        const [a, b] = values
        scale = Math.sqrt((a || 1) * (a || 1) + (b || 0) * (b || 0)) || 1
        const rotateRad = Math.atan2(b || 0, a || 1)
        rotateDeg = (rotateRad * 180) / Math.PI
      } else {
        // 尝试解析rotate和scale函数格式
        const rotateMatch = /rotate\((-?(?:\d+)(?:\.\d+)?)deg\)/.exec(transform)
        const scaleMatch = /scale\((-?(?:\d+)(?:\.\d+)?)\)/.exec(transform)

        if (rotateMatch) {
          rotateDeg = parseFloat(rotateMatch[1])
        }
        if (scaleMatch) {
          scale = parseFloat(scaleMatch[1])
        }
      }
    }

    // 应用缩放
    const scaledX = localX * scale
    const scaledY = localY * scale

    // 应用旋转
    const rotation = MathUtils.degToRad(rotateDeg)
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
        // 从style中提取变换信息
    const extractTransformInfo = (style: CSSStyleDeclaration) => {
      const left = parseFloat(style.left) || 0
      const top = parseFloat(style.top) || 0
      const transform = style.transform
      let scale = 1
      let rotateDeg = 0

      if (transform && transform !== 'none') {
        // 尝试解析matrix格式
        const matrixMatch = /^(?:matrix)\(([-0-9eE.,\s]+)\)$/.exec(transform)
        if (matrixMatch) {
          const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()))
          const [a, b] = values
          scale = Math.sqrt((a || 1) * (a || 1) + (b || 0) * (b || 0)) || 1
          const rotateRad = Math.atan2(b || 0, a || 1)
          rotateDeg = (rotateRad * 180) / Math.PI
        } else {
          // 尝试解析rotate和scale函数格式
          const rotateMatch = /rotate\((-?(?:\d+)(?:\.\d+)?)deg\)/.exec(transform)
          const scaleMatch = /scale\((-?(?:\d+)(?:\.\d+)?)\)/.exec(transform)

          if (rotateMatch) {
            rotateDeg = parseFloat(rotateMatch[1])
          }
          if (scaleMatch) {
            scale = parseFloat(scaleMatch[1])
          }
        }
      }

      return { left, top, scale, rotateDeg }
    }

    const fromTransform = extractTransformInfo(fromPose.style)
    const toTransform = extractTransformInfo(toPose.style)

    // 使用 math.js 的表达式计算进行插值
    const lerpX = MathUtils.evaluate('from + (to - from) * t', {
      from: fromTransform.left,
      to: toTransform.left,
      t
    })

    const lerpY = MathUtils.evaluate('from + (to - from) * t', {
      from: fromTransform.top,
      to: toTransform.top,
      t
    })

    const lerpScale = MathUtils.evaluate('from + (to - from) * t', {
      from: fromTransform.scale,
      to: toTransform.scale,
      t
    })

    // 角度插值需要考虑最短路径
    let angleDiff = toTransform.rotateDeg - fromTransform.rotateDeg
    if (angleDiff > 180) angleDiff -= 360
    if (angleDiff < -180) angleDiff += 360

    const lerpRotation = fromTransform.rotateDeg + angleDiff * t

    // 创建插值后的样式
    const interpolatedStyle = document.createElement('div').style
    interpolatedStyle.position = 'absolute'
    interpolatedStyle.left = `${lerpX}px`
    interpolatedStyle.top = `${lerpY}px`
    interpolatedStyle.transform = `rotate(${lerpRotation}deg) scale(${lerpScale})`

    // 创建插值后的矩形（简化版本，实际可能需要更复杂的计算）
    const interpolatedRect = new DOMRect(
      lerpX,
      lerpY,
      fromPose.rect.width,
      fromPose.rect.height
    )

    return {
      rect: interpolatedRect,
      style: interpolatedStyle
    }
  }
}

// 导出一些有用的数学常数和函数
export { MathUtils }
