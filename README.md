# 多指操作（Multi Drag Project）

## DEMO

![DEMO](./assets/demo.gif)

[DEMO](https://systemui-js.github.io/multi-drag/)

## 特性（Features）

支持多个手指**同时**拖动多个元素（当然也支持鼠标拖动）

Support MULTI fingers drag MULTI Items(also support mouse dragging)

## 现代化打包构建工具，支持TS（Modern tools of Project Building, support TypeScript）

基于Vite + TypeScript打造

Build with Vite + TypeScript

## API 文档（中文）

> 本文档涵盖 `Drag`、`makeDraggable`、`dragManager`/`DragManager`、拖拽手势方法（`dragMethods`）与工具库（`MatrixTransforms`、`MathUtils`）。示例均为 TypeScript，示例中包含注释以帮助理解。

### 安装与引入

```bash
# 安装
yarn add multi-drag
# 或
npm i multi-drag
```

```ts
// 典型引入方式
import {
  Drag,
  dragManager,
  makeDraggable,
  makeMagicDrag,
  makeScalable,
  makeRotatable,
  getPoseFromElement,
  applyPoseToElement,
  keepTouchesRelative,
  MatrixTransforms,
  MathUtils
} from 'multi-drag'
```

### 快速开始

```ts
// 让一个元素具备拖拽能力（单指或鼠标）
const box = document.getElementById('box') as HTMLElement

// 最简用法：内部通过 Pose 快照管理位置/变换
const drag = makeDraggable(box)

// 可选：自定义位姿读取/写入
// const drag = makeDraggable(box, {
//   getPose: (el) => getPoseFromElement(el),
//   setPose: (el, pose) => applyPoseToElement(el, pose)
// })

// 销毁
// drag.destroy()
```

---

### Drag 类

```ts
new Drag(element: HTMLElement, options?: DragOptions)
```

- 参数：
  - `element`：要拖拽的元素。
  - `options`：回调配置。
    - `onDragStart?(element, events)`：开始拖拽时回调。
    - `onDragMove?(element, events)`：拖拽过程中回调。
    - `onDragEnd?(element, events)`：结束拖拽时回调。
- 方法：
  - `getElement(): HTMLElement`：返回绑定的元素。
  - `getIsDragging(): boolean`：当前是否在拖拽。
  - `destroy(): void`：注销当前实例。

```ts
interface DragStartPayload<PoseType = Pose> {
  initialPose: PoseType
  startEvents: DragEvent[]
}

interface DragOptions {
  onDragStart?: (element: HTMLElement, events: DragEvent[]) => DragStartPayload | void
  onDragMove?: (element: HTMLElement, events: DragEvent[], startPayload?: DragStartPayload) => void
  onDragEnd?: (element: HTMLElement, events: DragEvent[], startPayload?: DragStartPayload) => void
}
```

- 说明：`events` 为标准化的指针事件数组，兼容鼠标与触摸，便于多指场景；`startPayload` 为 `onDragStart` 返回的上下文。

参数表（DragOptions）：

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| onDragStart | (element, events) => DragStartPayload \| void | 拖拽开始回调；可返回初始位姿与起始触点作为上下文 |
| onDragMove | (element, events, startPayload?) => void | 拖拽过程回调；第三参接收 `onDragStart` 返回的 `payload` |
| onDragEnd | (element, events, startPayload?) => void | 拖拽结束回调；第三参接收 `onDragStart` 返回的 `payload` |

参数表（DragStartPayload）：

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| initialPose | Pose | 拖拽开始时的元素位姿快照（防止样式叠加） |
| startEvents | DragEvent[] | 拖拽开始时的触点列表 |

### makeDraggable 函数

```ts
function makeDraggable(
  element: HTMLElement,
  options?: MakeDraggableOptions
): Drag

interface MakeDraggableOptions {
  getPose?: (el: HTMLElement) => Pose
  setPose?: (el: HTMLElement, pose: Pose) => void
}
```

- 作用：为元素提供“拖拽即位移”的快捷能力，内部基于 `Pose` 快照，避免样式叠加。
- 默认行为：
  - `getPose` 默认使用 `getPoseFromElement(el)`；
  - `setPose` 默认使用 `applyPoseToElement(el, pose)`；
  - 若元素 `position` 为 `static`，会自动设置为 `relative` 以便移动。

参数表（MakeDraggableOptions）：

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| getPose | (el) => Pose | 自定义如何读取元素位姿，用于初始化与后续计算 |
| setPose | (el, pose) => void | 自定义如何应用新位姿到元素（位置/transform/transition 等） |

### dragManager 与 DragManager

- `dragManager`：单例，自动挂载文档级监听，聚合多指事件并分发给相应的 `Drag` 实例。
- 关键行为：
  - 多指/鼠标事件的标准化（统一为 `DragEvent`）；
  - 将同一元素上的多触点“成组”分发；
  - 跟踪活跃拖拽指针，并在 `end` 时正确清理。

```ts
interface DragEvent {
  identifier: string | number
  clientX: number
  clientY: number
  target: EventTarget | null
  originalEvent: MouseEvent | TouchEvent
  type: 'mouse' | 'touch'
}
```

- 常用方法：
  - `dragManager.isDragging(): boolean`
  - `dragManager.getRegisteredInstances(): Drag[]`
  - `dragManager.getActiveDrags(): Map<string | number, Drag>`
  - `dragManager.isElementBeingDragged(el: HTMLElement): boolean`

> 一般无需直接调用 `register/unregister`，`new Drag(...)` 会自动注册，`destroy()` 会自动注销。

参数表（DragEvent）：

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| identifier | string \| number | 指针唯一标识（鼠标为 'mouse'，触摸为 touch.identifier） |
| clientX | number | 统一后的屏幕 X 坐标 |
| clientY | number | 统一后的屏幕 Y 坐标 |
| target | EventTarget \| null | 原始事件目标元素 |
| originalEvent | MouseEvent \| TouchEvent | 原始事件，用于进阶场景 |
| type | 'mouse' \| 'touch' | 事件来源类型（调试用） |

### 拖拽手势方法（dragMethods）

- `getPoseFromElement(element): Pose`
  - 读取元素 `DOMRect` 与关键 `style` 的“快照”以避免叠加污染。
- `applyPoseToElement(element, pose, options?)`
  - 仅应用必要的样式属性，避免 transform 叠加。
- `keepTouchesRelative(params, options?)`
  - 在单指/多指拖拽过程中，使触点在元素中的相对位置保持稳定；
  - 支持同时移动、缩放、旋转的组合；
  - 单指场景支持优先级配置：`['drag']`/`['scale']`/`['rotate']`。

```ts
interface Pose { rect: DOMRect; style: CSSStyleDeclaration }
interface Point { x: number; y: number }
interface GestureParams {
  element: HTMLElement
  initialPose: Pose
  startEvents: DragEvent[]
  currentEvents: DragEvent[]
}
interface ApplyPoseOptions {
  transformOrigin?: string
  transition?: string
}
interface KeepTouchesRelativeOptions extends ApplyPoseOptions {
  enableScale?: boolean
  enableRotate?: boolean
  enableMove?: boolean
  singleFingerPriority?: ('scale' | 'rotate' | 'drag')[]
}
interface KeepTouchesRelativeAdapters {
  getPose?: (element: HTMLElement) => Pose
  setPose?: (element: HTMLElement, pose: Pose, options?: ApplyPoseOptions) => void
}
```

示例：结合 `keepTouchesRelative` 实现“多指移动/旋转/缩放”。

```ts
const el = document.getElementById('target') as HTMLElement

let initialPose: Pose
const drag = new Drag(el, {
  onDragStart: (_el, startEvents) => {
    // 在拖拽开始时拍下元素姿态快照
    initialPose = getPoseFromElement(el)
  },
  onDragMove: (_el, currentEvents) => {
    // 将起始/当前触点列表传入，计算并应用新的姿态
    keepTouchesRelative(
      {
        element: el,
        initialPose,
        startEvents: [], // 可存储第一次 onDragStart 的 events
        currentEvents // 当前 move 事件的触点列表
      },
      {
        enableMove: true,
        enableScale: true,
        enableRotate: true,
        transformOrigin: 'center center'
      }
    )
  }
})
```

> 注意：示例中 `startEvents`/`currentEvents` 的管理策略可按需缓存与传递，只要满足 `GestureParams` 的约定即可。

参数表（GestureParams）：

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| element | HTMLElement | 要操作的目标元素 |
| initialPose | Pose | 拖拽开始时的位姿快照 |
| startEvents | DragEvent[] | 开始时的触点列表，用于相对计算基准 |
| currentEvents | DragEvent[] | 当前 move 阶段触点列表 |

参数表（KeepTouchesRelativeOptions）：

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| enableMove | boolean | 是否启用移动，默认 true |
| enableScale | boolean | 是否启用缩放，默认 true |
| enableRotate | boolean | 是否启用旋转，默认 true |
| singleFingerPriority | ('scale' \| 'rotate' \| 'drag')[] | 单指优先级，默认 ['drag'] |
| transformOrigin | string | 透传到应用姿态时的 transform-origin |
| transition | string | 透传到应用姿态时的 transition |

参数表（KeepTouchesRelativeAdapters）：

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| getPose | (el) => Pose | 自定义读取位姿（默认 `getPoseFromElement`） |
| setPose | (el, pose, options?) => void | 自定义写入位姿（默认 `applyPoseToElement`） |

返回值：`void`

行为说明：

- 单指：按照 `singleFingerPriority` 只执行一个手势（拖拽/缩放/旋转）。
- 多指：在启用的情况下同时计算移动/缩放/旋转，并合成最终姿态。

---

### 快捷封装：makeMagicDrag / makeScalable / makeRotatable

这三个方法均基于 `Drag` + `keepTouchesRelative` 的组合，预设了不同的启用项：

```ts
function makeMagicDrag(element: HTMLElement, options?: MakeMagicDragOptions): Drag
interface MakeMagicDragOptions extends KeepTouchesRelativeOptions {
  getPose?: (el: HTMLElement) => Pose
  setPose?: (el: HTMLElement, pose: Pose) => void
}

function makeScalable(element: HTMLElement, options?: { getPose?: (el: HTMLElement) => Pose; setPose?: (el: HTMLElement, pose: Pose) => void }): Drag

function makeRotatable(element: HTMLElement, options?: { getPose?: (el: HTMLElement) => Pose; setPose?: (el: HTMLElement, pose: Pose) => void }): Drag
```

参数表（MakeMagicDragOptions 重点）：

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| enableMove | boolean | 启用移动，默认 true |
| enableScale | boolean | 启用缩放，默认 true |
| enableRotate | boolean | 启用旋转，默认 true |
| singleFingerPriority | ('scale' \| 'rotate' \| 'drag')[] | 单指优先级，默认 ['drag'] |
| transformOrigin | string | 姿态应用的 transform-origin，默认 'center center' |
| transition | string | 姿态应用的 transition |
| getPose | (el) => Pose | 自定义读取位姿 |
| setPose | (el, pose) => void | 自定义写入位姿 |

### 工具类 MatrixTransforms

```ts
class MatrixTransforms {
  static poseToMatrix(pose: Pose)
  static calculateTransformDelta(fromPose: Pose, toPose: Pose)
  static calculateRelativePosition(
    touchPoint: [number, number],
    elementCenter: [number, number],
    elementSize: [number, number],
    pose: Pose
  )
  static calculateNewTouchPosition(
    relativePosition: { relativeX: number; relativeY: number },
    newElementCenter: [number, number],
    newElementSize: [number, number],
    newPose: Pose
  ): [number, number]
  static interpolatePose(fromPose: Pose, toPose: Pose, t: number): Pose
}
```

- 用途：简化复杂几何变换/插值的计算，内部配合 `MathUtils`。

常用方法说明：

| 方法 | 参数 | 返回 | 描述 |
| --- | --- | --- | --- |
| poseToMatrix | pose: Pose | 任意 | 将姿态转为矩阵表示（内部结构依赖实现） |
| calculateTransformDelta | fromPose: Pose, toPose: Pose | 任意 | 计算两姿态之间的变换差值 |
| calculateRelativePosition | touchPoint, elementCenter, elementSize, pose | 任意 | 计算触点在元素局部坐标中的相对位置 |
| calculateNewTouchPosition | relativePosition, newElementCenter, newElementSize, newPose | [number, number] | 根据新姿态反推新的触点位置 |
| interpolatePose | fromPose, toPose, t | Pose | 在两姿态间插值 |

### 数学工具 MathUtils 及导出

```ts
class MathUtils {
  static createTransformMatrix(tx: number, ty: number, sx: number, sy: number, rotRad: number)
  static transformPoint(point: [number, number], mat: any)
  static distance(p1: [number, number], p2: [number, number]): number
  static angle(p1: [number, number], p2: [number, number]): number
  static evaluate(expression: string, scope?: Record<string, any>): any
  static degToRad(deg: number): number
  static radToDeg(rad: number): number
}

// 还会转出常用 math.js 方法
export { evaluate, matrix, multiply, subtract, add, norm, cos, sin, pi }
```

常用方法说明：

| 方法 | 描述 |
| --- | --- |
| createTransformMatrix | 创建平移/缩放/旋转的组合矩阵（弧度制） |
| transformPoint | 将点乘以矩阵进行坐标变换 |
| distance | 计算两点距离 |
| angle | 计算两点连线的极角（弧度） |
| evaluate | 计算表达式（math.js） |
| degToRad / radToDeg | 角度/弧度转换 |

---

### 版本与类型

- 项目使用 TypeScript 提供完整类型定义，详见 `dist/*.d.ts`。
- 任何 API 变动会在发布说明中记录。
