import type { DragEvent } from '../dragManager'

export interface Pose {
  left: number
  top: number
  scale: number
  rotateDeg: number
  width?: number   // 元素宽度（可选）
  height?: number  // 元素高度（可选）
}

export interface Point {
  x: number
  y: number
}

export interface GestureParams {
  element: HTMLElement
  initialPose: Pose
  startEvents: DragEvent[]
  currentEvents: DragEvent[]
}

export interface ApplyPoseOptions {
  transformOrigin?: string
  transition?: string
}

export interface KeepTouchesRelativeOptions extends ApplyPoseOptions {
  enableScale?: boolean    // 是否启用缩放，默认 true
  enableRotate?: boolean   // 是否启用旋转，默认 true
  enableMove?: boolean     // 是否启用移动，默认 true
  singleFingerPriority?: ('scale' | 'rotate' | 'drag')[]  // 单指时的手势优先级列表，默认 ['drag']
}

export function getPoseFromElement(element: HTMLElement): Pose {
  const style = window.getComputedStyle(element)

  // 从 left 和 top 样式获取位置
  const left = parseFloat(style.left) || 0
  const top = parseFloat(style.top) || 0
  // const globalLeft = element.getBoundingClientRect().left
  // const globalTop = element.getBoundingClientRect().top

  // 从 transform 获取缩放和旋转
  const transform = style.transform
  let scale = 1
  let rotateDeg = 0

  if (transform && transform !== 'none') {
    const match = transform.match(/^matrix\(([-0-9eE.,\s]+)\)$/)
    if (match) {
      const values = match[1].split(',').map(v => parseFloat(v.trim()))
      const [a, b] = values
      scale = Math.sqrt((a || 1) * (a || 1) + (b || 0) * (b || 0)) || 1
      const rotateRad = Math.atan2(b || 0, a || 1)
      rotateDeg = (rotateRad * 180) / Math.PI
    }
  }

  return { left, top, scale, rotateDeg }
}

export function applyPoseToElement(element: HTMLElement, pose: Pose, options?: ApplyPoseOptions): void {
  // 确保元素具有定位属性
  if (!element.style.position || element.style.position === 'static') {
    element.style.position = 'absolute'
  }

  // 设置位置使用 left 和 top
  element.style.left = `${pose.left}px`
  element.style.top = `${pose.top}px`

  // transform 只包含缩放和旋转
  element.style.transform = `rotate(${pose.rotateDeg}deg) scale(${pose.scale})`

  if (options?.transformOrigin !== undefined) {
    element.style.transformOrigin = options.transformOrigin
  }
  if (options?.transition !== undefined) {
    element.style.transition = options.transition
  }
}



function toPoints(events: DragEvent[]): Point[] {
  return (events || []).map(e => ({ x: e.clientX, y: e.clientY }))
}



// 4) 保持 currentEvents 的触摸点在元素中的相对位置（百分比）不变
// 思路：
// - 单指时：根据优先级配置执行第一个可用的手势
// - 多指时：同时应用所有启用的手势，计算新的缩放、旋转和位置
//
// 支持配置选项：
// - enableScale: 是否启用缩放功能（默认 true）
// - enableRotate: 是否启用旋转功能（默认 true）
// - enableMove: 是否启用移动功能（默认 true）
// - singleFingerPriority: 单指时的手势优先级列表（默认 ['drag']）
export function keepTouchesRelative(params: GestureParams, options?: KeepTouchesRelativeOptions): void {
  const { element, initialPose, startEvents, currentEvents } = params

  // 解析配置选项，设置默认值
  const {
    enableScale = true,
    enableRotate = true,
    enableMove = true,
    singleFingerPriority = ['drag'],
    ...applyOptions
  } = options || {}

  const S = toPoints(startEvents)
  const C = toPoints(currentEvents)
  if (!S[0] || !C[0]) return

  // 初始化结果变量
  let newLeft = initialPose.left
  let newTop = initialPose.top
  let newScale = initialPose.scale
  let newRotation = initialPose.rotateDeg * Math.PI / 180
  const oldGlobalCenterX = initialPose.left + (initialPose.width || 0) / 2
  const oldGlobalCenterY = initialPose.top + (initialPose.height || 0) / 2

  // 判断是单指还是多指操作
  const isSingleFinger = S.length === 1 && C.length === 1

  if (isSingleFinger) {
    // 单指操作：根据优先级配置执行第一个可用的手势
    for (const gesture of singleFingerPriority) {
      if (gesture === 'drag' && enableMove) {
        // 执行拖拽操作
        const dx = C[0].x - S[0].x
        const dy = C[0].y - S[0].y
        newLeft = initialPose.left + dx
        newTop = initialPose.top + dy
        break
      } else if (gesture === 'scale' && enableScale) {
        // 单指缩放：基于触点移动距离计算缩放
        const initialDistance = Math.hypot(Math.abs(S[0].x - oldGlobalCenterX), Math.abs(S[0].y - oldGlobalCenterY))
        const currentDistance = Math.hypot(Math.abs(C[0].x - oldGlobalCenterX), Math.abs(C[0].y - oldGlobalCenterY))
        if (initialDistance > 0) {
          const scaleChange = currentDistance / initialDistance
          newScale = initialPose.scale * scaleChange
        }
        break
      } else if (gesture === 'rotate' && enableRotate) {
        // 单指旋转：基于触点相对于元素中心的角度变化
        const initialRect = element.getBoundingClientRect()
        const centerX = initialRect.left + initialRect.width / 2
        const centerY = initialRect.top + initialRect.height / 2

        const initialAngle = Math.atan2(S[0].y - centerY, S[0].x - centerX)
        const currentAngle = Math.atan2(C[0].y - centerY, C[0].x - centerX)
        const angleChange = currentAngle - initialAngle
        newRotation = (initialPose.rotateDeg * Math.PI / 180) + angleChange
        break
      }
    }
  } else if (S.length >= 2 && C.length >= 2) {
    // 多指操作：同时应用所有启用的手势

    // 计算旋转变化
    if (enableRotate) {
      const initialAngle = Math.atan2(S[0].y - S[1].y, S[0].x - S[1].x)
      const currentAngle = Math.atan2(C[0].y - C[1].y, C[0].x - C[1].x)
      const angleChange = currentAngle - initialAngle
      newRotation = (initialPose.rotateDeg * Math.PI / 180) + angleChange
    }

    // 计算缩放变化
    if (enableScale) {
      const initialDistance = Math.hypot(S[1].x - S[0].x, S[1].y - S[0].y)
      const currentDistance = Math.hypot(C[1].x - C[0].x, C[1].y - C[0].y)
      if (initialDistance > 0) {
        const scaleChange = currentDistance / initialDistance
        newScale = initialPose.scale * scaleChange
      }
    }

    // 计算移动变化
    if (enableMove) {
      const oldPolygonCenterX = S.reduce((sum, point) => sum + point.x, 0) / S.length
      const oldPolygonCenterY = S.reduce((sum, point) => sum + point.y, 0) / S.length
      const newPolygonCenterX = C.reduce((sum, point) => sum + point.x, 0) / C.length
      const newPolygonCenterY = C.reduce((sum, point) => sum + point.y, 0) / C.length

      const offsetX = newPolygonCenterX - oldPolygonCenterX
      const offsetY = newPolygonCenterY - oldPolygonCenterY

      newLeft = initialPose.left + offsetX
      newTop = initialPose.top + offsetY
    }
  }

  applyPoseToElement(
    element,
    {
      left: newLeft,
      top: newTop,
      scale: newScale,
      rotateDeg: (newRotation * 180) / Math.PI
    },
    { transformOrigin: applyOptions?.transformOrigin ?? 'center center', transition: applyOptions?.transition }
  )
}
