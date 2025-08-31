import type { DragEvent } from '../dragManager'

export interface Pose {
  rect: DOMRect        // 从元素的getBoundingClientRect获取的信息
  style: CSSStyleDeclaration  // 元素的style
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

// 允许外部自定义获取与设置位姿的适配器
export interface KeepTouchesRelativeAdapters {
  // 自定义获取位姿（默认使用 getPoseFromElement）
  getPose?: (element: HTMLElement) => Pose
  // 自定义设置位姿（默认使用 applyPoseToElement）
  setPose?: (element: HTMLElement, pose: Pose, options?: ApplyPoseOptions) => void
}

export function getPoseFromElement(element: HTMLElement): Pose {
  // 获取元素的边界矩形信息
  const rectData = element.getBoundingClientRect()
  // 确保返回的是DOMRect对象（在测试环境中可能需要转换）
  type RectLike = { x?: number; y?: number; left?: number; top?: number; width?: number; height?: number }
  const rect: DOMRect = rectData instanceof DOMRect
    ? rectData
    : (() => {
        const isRectLike = (v: unknown): v is RectLike => typeof v === 'object' && v !== null
        const rUnknown = rectData as unknown
        if (isRectLike(rUnknown)) {
          const x = (typeof rUnknown.x === 'number' ? rUnknown.x : rUnknown.left) ?? 0
          const y = (typeof rUnknown.y === 'number' ? rUnknown.y : rUnknown.top) ?? 0
          const width = (typeof rUnknown.width === 'number' ? rUnknown.width : 0)
          const height = (typeof rUnknown.height === 'number' ? rUnknown.height : 0)
          return new DOMRect(x, y, width, height)
        }
        return new DOMRect(0, 0, 0, 0)
      })()

  // 创建样式的快照，而不是引用
  // 这是修复叠加问题的关键：确保initialPose保存的是拖动开始时的状态快照
  const style = document.createElement('div').style

  // 复制关键的样式属性到快照中
  if (element.style.left) style.left = element.style.left
  if (element.style.top) style.top = element.style.top
  if (element.style.right) style.right = element.style.right
  if (element.style.bottom) style.bottom = element.style.bottom
  if (element.style.transform) style.transform = element.style.transform
  if (element.style.position) style.position = element.style.position
  if (element.style.transformOrigin) style.transformOrigin = element.style.transformOrigin

  return { rect, style }
}

export function applyPoseToElement(element: HTMLElement, pose: Pose, options?: ApplyPoseOptions): void {
  /**
   * 修复说明：之前的实现会将 pose.style 中的所有样式属性都应用到元素上，
   * 这导致每次拖动时样式会不断叠加，产生不正确的变换效果。
   *
   * 现在只应用特定的样式属性，确保：
   * 1. 只覆盖必要的样式属性，而不是全部属性
   * 2. 每次调用都是完全替换而不是叠加
   * 3. 防止意外的样式继承问题
   */

  // 位置相关属性 - 用于元素的绝对定位
  if (pose.style.left !== undefined && pose.style.left !== '') {
    element.style.left = pose.style.left
  }
  if (pose.style.top !== undefined && pose.style.top !== '') {
    element.style.top = pose.style.top
  }
  if (pose.style.right !== undefined && pose.style.right !== '') {
    element.style.right = pose.style.right
  }
  if (pose.style.bottom !== undefined && pose.style.bottom !== '') {
    element.style.bottom = pose.style.bottom
  }

  // 变换属性 - 包含旋转、缩放等变换，这是防止叠加的关键
  if (pose.style.transform !== undefined && pose.style.transform !== '') {
    element.style.transform = pose.style.transform
  }

  // 定位模式 - 确保元素可以被绝对定位
  if (pose.style.position !== undefined && pose.style.position !== '') {
    element.style.position = pose.style.position
  }

  // 应用额外的选项
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
export function keepTouchesRelative(
  params: GestureParams,
  options?: KeepTouchesRelativeOptions,
  adapters?: KeepTouchesRelativeAdapters
): void {
  // 解析适配器，提供默认的获取/设置位姿方法
  const getPose = adapters?.getPose ?? getPoseFromElement
  const setPose = adapters?.setPose ?? applyPoseToElement

  const { element, initialPose: providedInitialPose, startEvents, currentEvents } = params

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

  // 若调用方未提供 initialPose，则使用适配器自动获取一次快照
  const initialPose = providedInitialPose ?? getPose(element)

  // 从 initialPose 中提取初始变换信息
  const initialLeft = parseFloat(initialPose.style.left) || 0
  const initialTop = parseFloat(initialPose.style.top) || 0

  // 解析初始的transform
  const transform = initialPose.style.transform
  let initialScale = 1
  let initialRotateDeg = 0

  if (transform && transform !== 'none') {
    // 尝试解析matrix格式
    const matrixMatch = transform.match(/^matrix\(([-0-9eE.,\s]+)\)$/)
    if (matrixMatch) {
      const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()))
      const [a, b] = values
      initialScale = Math.sqrt((a || 1) * (a || 1) + (b || 0) * (b || 0)) || 1
      const rotateRad = Math.atan2(b || 0, a || 1)
      initialRotateDeg = (rotateRad * 180) / Math.PI
    } else {
      // 尝试解析rotate和scale函数格式
      const rotateMatch = transform.match(/rotate\(([-0-9.]+)deg\)/)
      const scaleMatch = transform.match(/scale\(([-0-9.]+)\)/)

      if (rotateMatch) {
        initialRotateDeg = parseFloat(rotateMatch[1])
      }
      if (scaleMatch) {
        initialScale = parseFloat(scaleMatch[1])
      }
    }
  }

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
    // 单指操作：根据优先级配置执行第一个可用的手势
    for (const gesture of singleFingerPriority) {
      if (gesture === 'drag' && enableMove) {
        // 执行拖拽操作
        const dx = C[0].x - S[0].x
        const dy = C[0].y - S[0].y
        newLeft = initialLeft + dx
        newTop = initialTop + dy
        break
      } else if (gesture === 'scale' && enableScale) {
        // 单指缩放：基于触点移动距离计算缩放
        const initialDistance = Math.hypot(Math.abs(S[0].x - oldGlobalCenterX), Math.abs(S[0].y - oldGlobalCenterY))
        const currentDistance = Math.hypot(Math.abs(C[0].x - oldGlobalCenterX), Math.abs(C[0].y - oldGlobalCenterY))
        if (initialDistance > 0) {
          const scaleChange = currentDistance / initialDistance
          newScale = initialScale * scaleChange
        }
        break
      } else if (gesture === 'rotate' && enableRotate) {
        // 单指旋转：基于触点相对于元素中心的角度变化
        const centerX = oldGlobalCenterX
        const centerY = oldGlobalCenterY

        const initialAngle = Math.atan2(S[0].y - centerY, S[0].x - centerX)
        const currentAngle = Math.atan2(C[0].y - centerY, C[0].x - centerX)
        const angleChange = currentAngle - initialAngle
        newRotation = (initialRotateDeg * Math.PI / 180) + angleChange
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
      newRotation = (initialRotateDeg * Math.PI / 180) + angleChange
    }

    // 计算缩放变化
    if (enableScale) {
      const initialDistance = Math.hypot(S[1].x - S[0].x, S[1].y - S[0].y)
      const currentDistance = Math.hypot(C[1].x - C[0].x, C[1].y - C[0].y)
      if (initialDistance > 0) {
        const scaleChange = currentDistance / initialDistance
        newScale = initialScale * scaleChange
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

      newLeft = initialLeft + offsetX
      newTop = initialTop + offsetY
    }
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
