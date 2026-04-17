import type { Pose } from '@system-ui-js/multi-drag-core'

function parsePixelValue(value: string): number {
  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : 0
}

function toBoxModelSize(
  element: HTMLElement,
  property: 'width' | 'height',
  size: number
): string {
  const computedStyle = window.getComputedStyle(element)
  if (computedStyle.boxSizing === 'border-box') {
    return `${size}px`
  }

  const paddingStart = parsePixelValue(
    property === 'width' ? computedStyle.paddingLeft : computedStyle.paddingTop
  )
  const paddingEnd = parsePixelValue(
    property === 'width'
      ? computedStyle.paddingRight
      : computedStyle.paddingBottom
  )
  const borderStart = parsePixelValue(
    property === 'width'
      ? computedStyle.borderLeftWidth
      : computedStyle.borderTopWidth
  )
  const borderEnd = parsePixelValue(
    property === 'width'
      ? computedStyle.borderRightWidth
      : computedStyle.borderBottomWidth
  )

  return `${Math.max(
    size - paddingStart - paddingEnd - borderStart - borderEnd,
    0
  )}px`
}

function replaceOrAppendTransform(
  transform: string,
  pattern: RegExp,
  value: string
): string {
  const matched = pattern.exec(transform)?.[1]

  if (matched === undefined) {
    return `${transform}${value}`
  }

  return transform.replace(pattern, value) || ''
}

function applyPosition(element: HTMLElement, pose: Partial<Pose>): void {
  if (Object.hasOwn(pose, 'position') && pose.position !== undefined) {
    element.style.left = `${pose.position.x}px`
    element.style.top = `${pose.position.y}px`
  }
}

function applyRotation(element: HTMLElement, pose: Partial<Pose>): void {
  if (Object.hasOwn(pose, 'rotation') && pose.rotation !== undefined) {
    element.style.transform = replaceOrAppendTransform(
      element.style.transform,
      /rotate\((-?\d+(?:\.\d+)?)deg\)/,
      `rotate(${pose.rotation || 0}deg)`
    )
  }
}

function applyScale(element: HTMLElement, pose: Partial<Pose>): void {
  if (Object.hasOwn(pose, 'scale') && pose.scale !== undefined) {
    element.style.transform = replaceOrAppendTransform(
      element.style.transform,
      /scale\((-?\d+(?:\.\d+)?)\)/,
      `scale(${pose.scale || 1})`
    )
  }
}

function applySize(element: HTMLElement, pose: Partial<Pose>): void {
  if (
    (Object.hasOwn(pose, 'width') && pose.width !== undefined) ||
    (Object.hasOwn(pose, 'height') && pose.height !== undefined)
  ) {
    if (Object.hasOwn(pose, 'width') && pose.width !== undefined) {
      element.style.width = toBoxModelSize(element, 'width', pose.width)
    }
    if (Object.hasOwn(pose, 'height') && pose.height !== undefined) {
      element.style.height = toBoxModelSize(element, 'height', pose.height)
    }
  }
}

export function defaultGetPose(element: HTMLElement): Pose {
  const width = element.offsetWidth
  const height = element.offsetHeight
  const scale =
    Number(/scale\((-?\d+(?:\.\d+)?)\)/.exec(element.style.transform)?.[1]) || 1

  return {
    position: {
      x: Number.parseFloat(element.style.left || '0'),
      y: Number.parseFloat(element.style.top || '0')
    },
    rotation:
      Number(
        /rotate\((-?\d+(?:\.\d+)?)deg\)/.exec(element.style.transform)?.[1]
      ) || 0,
    width,
    height,
    scale
  }
}

export function defaultSetPose(
  element: HTMLElement,
  pose: Partial<Pose>
): void {
  applyPosition(element, pose)
  applyRotation(element, pose)
  applyScale(element, pose)
  applySize(element, pose)
}

export function getAnchorCenter(element: HTMLElement) {
  const rect = element.getBoundingClientRect()

  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  }
}
