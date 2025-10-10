import { Point } from '../utils/mathUtils'
import type { Pose, ApplyPoseOptions } from '../utils/dragUtils'
import { getPoseFromElement, applyPoseToElement } from '../utils/dragUtils'

export interface GestureParams {
  element: HTMLElement
  initialPose: Pose
  startGlobalPoints: Point[]
  currentGlobalPoints: Point[]
}

export interface KeepTouchesRelativeOptions extends ApplyPoseOptions {
  enableScale?: boolean    // 是否启用缩放，默认 true
  enableRotate?: boolean   // 是否启用旋转，默认 true
  enableMove?: boolean     // 是否启用移动，默认 true
  singleFingerPriority?: ('scale' | 'rotate' | 'drag')[]  // 单指时的手势优先级列表，默认 ['drag']
}

// 允许外部自定义获取与设置位姿的适配器
export interface KeepTouchesRelativeAdapters {
  // 自定义获取位姿（默认使用 getPoseFromElement）
  getPose?: (element: HTMLElement) => Pose
  // 自定义设置位姿（默认使用 applyPoseToElement）
  setPose?: (element: HTMLElement, pose: Pose, options?: ApplyPoseOptions) => void
}

// 预编译正则，避免重复创建与潜在的慢回溯
const MATRIX_RE = /^(?:matrix)\(([-0-9eE.,\s]+)\)$/
const ROTATE_RE = /rotate\((-?(?:\d+)(?:\.\d+)?)deg\)/
const SCALE_RE = /scale\((-?(?:\d+)(?:\.\d+)?)\)/

function extractInitialTransformFromStyle(style: CSSStyleDeclaration): { initialScale: number, initialRotateDeg: number } {
  const transform = style.transform
  let initialScale = 1
  let initialRotateDeg = 0
  if (transform && transform !== 'none') {
    const matrixMatch = MATRIX_RE.exec(transform)
    if (matrixMatch) {
      const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()))
      const [a, b] = values
      initialScale = Math.sqrt((a || 1) * (a || 1) + (b || 0) * (b || 0)) || 1
      const rotateRad = Math.atan2(b || 0, a || 1)
      initialRotateDeg = (rotateRad * 180) / Math.PI
    } else {
      const rotateMatch = ROTATE_RE.exec(transform)
      const scaleMatch = SCALE_RE.exec(transform)
      if (rotateMatch) initialRotateDeg = parseFloat(rotateMatch[1])
      if (scaleMatch) initialScale = parseFloat(scaleMatch[1])
    }
  }
  return { initialScale, initialRotateDeg }
}

function computeSingleFingerUpdate(params: {
  enableMove: boolean
  enableScale: boolean
  enableRotate: boolean
  singleFingerPriority: Array<'scale' | 'rotate' | 'drag'>
  initial: { left: number, top: number, scale: number, rotateDeg: number }
  S: Point[]
  C: Point[]
  center: { x: number, y: number }
}): { left: number, top: number, scale: number, rotationRad: number } {
  const { enableMove, enableScale, enableRotate, singleFingerPriority, initial, S, C, center } = params
  let left = initial.left
  let top = initial.top
  let scale = initial.scale
  let rotationRad = initial.rotateDeg * Math.PI / 180

  for (const gesture of singleFingerPriority) {
    if (gesture === 'drag' && enableMove) {
      const dx = C[0].x - S[0].x
      const dy = C[0].y - S[0].y
      left = initial.left + dx
      top = initial.top + dy
      break
    }
    if (gesture === 'scale' && enableScale) {
      const initialDistance = Math.hypot(Math.abs(S[0].x - center.x), Math.abs(S[0].y - center.y))
      const currentDistance = Math.hypot(Math.abs(C[0].x - center.x), Math.abs(C[0].y - center.y))
      if (initialDistance > 0) scale = initial.scale * (currentDistance / initialDistance)
      break
    }
    if (gesture === 'rotate' && enableRotate) {
      const initialAngle = Math.atan2(S[0].y - center.y, S[0].x - center.x)
      const currentAngle = Math.atan2(C[0].y - center.y, C[0].x - center.x)
      rotationRad = (initial.rotateDeg * Math.PI / 180) + (currentAngle - initialAngle)
      break
    }
  }
  return { left, top, scale, rotationRad }
}

function computeMultiFingerUpdate(params: {
  enableMove: boolean
  enableScale: boolean
  enableRotate: boolean
  initial: { left: number, top: number, scale: number, rotateDeg: number }
  S: Point[]
  C: Point[]
}): { left: number, top: number, scale: number, rotationRad: number } {
  const { enableMove, enableScale, enableRotate, initial, S, C } = params
  let left = initial.left
  let top = initial.top
  let scale = initial.scale
  let rotationRad = initial.rotateDeg * Math.PI / 180

  if (enableRotate) {
    const initialAngle = Math.atan2(S[0].y - S[1].y, S[0].x - S[1].x)
    const currentAngle = Math.atan2(C[0].y - C[1].y, C[0].x - C[1].x)
    rotationRad = (initial.rotateDeg * Math.PI / 180) + (currentAngle - initialAngle)
  }

  if (enableScale) {
    const initialDistance = Math.hypot(S[1].x - S[0].x, S[1].y - S[0].y)
    const currentDistance = Math.hypot(C[1].x - C[0].x, C[1].y - C[0].y)
    if (initialDistance > 0) scale = initial.scale * (currentDistance / initialDistance)
  }

  if (enableMove) {
    const oldPolygonCenterX = S.reduce((sum, point) => sum + point.x, 0) / S.length
    const oldPolygonCenterY = S.reduce((sum, point) => sum + point.y, 0) / S.length
    const newPolygonCenterX = C.reduce((sum, point) => sum + point.x, 0) / C.length
    const newPolygonCenterY = C.reduce((sum, point) => sum + point.y, 0) / C.length
    left = initial.left + (newPolygonCenterX - oldPolygonCenterX)
    top = initial.top + (newPolygonCenterY - oldPolygonCenterY)
  }

  return { left, top, scale, rotationRad }
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
export function keepTouchesRelative(
  params: GestureParams,
  options?: KeepTouchesRelativeOptions,
  adapters?: KeepTouchesRelativeAdapters
): void {
  // 解析适配器，提供默认的获取/设置位姿方法
  const getPose = adapters?.getPose ?? getPoseFromElement
  const setPose = adapters?.setPose ?? applyPoseToElement

  const { element, initialPose: providedInitialPose, startGlobalPoints, currentGlobalPoints } = params

  // 解析配置选项，设置默认值
  const {
    enableScale = true,
    enableRotate = true,
    enableMove = true,
    singleFingerPriority = ['drag'],
    ...applyOptions
  } = options || {}

  const S = startGlobalPoints
  const C = currentGlobalPoints
  if (!S[0] || !C[0]) return

  // 若调用方未提供 initialPose，则使用适配器自动获取一次快照
  const initialPose = providedInitialPose ?? getPose(element)

  // 从 initialPose 中提取初始变换信息
  const initialLeft = parseFloat(initialPose.style.left) || 0
  const initialTop = parseFloat(initialPose.style.top) || 0

  // 解析初始的transform
  const { initialScale, initialRotateDeg } = extractInitialTransformFromStyle(initialPose.style)

  // 初始化结果变量
  let newLeft = initialLeft
  let newTop = initialTop
  let newScale = initialScale
  let newRotation = initialRotateDeg * Math.PI / 180
  const oldGlobalCenterX = initialPose.rect.left + initialPose.rect.width / 2
  const oldGlobalCenterY = initialPose.rect.top + initialPose.rect.height / 2

  // 判断是单指还是多指操作
  const isSingleFinger = S.length === 1 && C.length === 1

  if (isSingleFinger) {
    const update = computeSingleFingerUpdate({
      enableMove,
      enableScale,
      enableRotate,
      singleFingerPriority,
      initial: { left: initialLeft, top: initialTop, scale: initialScale, rotateDeg: initialRotateDeg },
      S,
      C,
      center: { x: oldGlobalCenterX, y: oldGlobalCenterY }
    })
    newLeft = update.left
    newTop = update.top
    newScale = update.scale
    newRotation = update.rotationRad
  } else if (S.length >= 2 && C.length >= 2) {
    const update = computeMultiFingerUpdate({
      enableMove,
      enableScale,
      enableRotate,
      initial: { left: initialLeft, top: initialTop, scale: initialScale, rotateDeg: initialRotateDeg },
      S,
      C
    })
    newLeft = update.left
    newTop = update.top
    newScale = update.scale
    newRotation = update.rotationRad
  }

  // 创建新的样式对象
  const newStyle = document.createElement('div').style

  // 设置位置
  newStyle.left = `${newLeft}px`
  newStyle.top = `${newTop}px`

  // 设置变换
  newStyle.transform = `rotate(${(newRotation * 180) / Math.PI}deg) scale(${newScale})`

  // 确保有定位属性
  if (!newStyle.position || newStyle.position === 'static') {
    newStyle.position = 'absolute'
  }

  // 创建新的Pose对象
  // 使用适配器的获取方法保证 rect 的来源可被重写（仅取 rect，style 使用上面计算的新样式）
  const rectFromAdapter = getPose(element).rect
  const newPose: Pose = {
    rect: rectFromAdapter,
    style: newStyle
  }

  // 使用适配器设置位姿，外部可自定义
  setPose(element, newPose, {
    transformOrigin: applyOptions?.transformOrigin ?? 'center center',
    transition: applyOptions?.transition
  })
}
