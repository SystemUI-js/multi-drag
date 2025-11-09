# 多指操作库（Multi Drag Project）

一个功能强大、灵活的前端多指拖拽操作库，支持多元素同时拖拽、旋转和缩放，同时提供完整的TypeScript类型支持。

## 🎯 核心特性

- **多指协同操作**：支持多个手指同时拖动多个元素，实现复杂交互
- **鼠标拖拽**：支持鼠标拖拽操作
- **支持手写笔**：支持手写笔拖拽
- **丰富的手势支持**：内置拖拽（Drag）、旋转（Rotate）、缩放（Scale）等手势
- **灵活的组合机制**：通过Mixin模式轻松组合多种手势功能
- **单指/多指智能区分**：根据触点数量智能切换操作模式
- **惯性支持**：可选的惯性拖拽效果，提升用户体验
- **TypeScript原生支持**：完整的类型定义，提供优秀的开发体验
- **轻量级设计**：核心逻辑简洁，易于集成和扩展

## 📺 演示

通过以下代码就可以实现多个元素同时拖拽

```typescript
const drag1 = new Mixin(item1, {}, [MixinType.Drag, MixinType.Scale])

const drag2 = new Mixin(item2, {}, [MixinType.Rotate, MixinType.Scale])

const drag3 = new Mixin(item3, {}, [MixinType.Drag, MixinType.Rotate, MixinType.Scale])
```

![DEMO](https://github.com/SystemUI-js/multi-drag/raw/main/assets/demo.gif)

通过以下代码就可以实现双摇杆功能

```typescript
const limit75 = (element: HTMLElement, pose: Partial<Pose>) => {
    // 拖动不能超过原来中心75px
    const center = { x: 50, y: 50 }
    const { position } = pose
    if (position) {
        const newPosition = { x: position.x, y: position.y }
        const distance = Math.sqrt(Math.pow(center.x - newPosition.x, 2) + Math.pow(center.y - newPosition.y, 2))
        if (distance > 75) {
            const ratio = distance / 75
            newPosition.x = (position.x - center.x) / ratio + center.x
            newPosition.y = (position.y - center.y) / ratio + center.y
        }
        defaultSetPose(element, { ...pose, position: newPosition })
    }
}
const joystickGoBack = (ele: HTMLElement) => {
    ele.style.left = '50px'
    ele.style.top = '50px'
}
new Drag(joystick1, {
    setPoseOnEnd: joystickGoBack,
    setPose: limit75
})
new Drag(joystick2, {
    setPoseOnEnd: joystickGoBack,
    setPose: limit75
})
```

![DEMO2](https://github.com/SystemUI-js/multi-drag/raw/main/assets/demo2.gif)

[在线演示](https://systemui-js.github.io/multi-drag/demo/)

## 📦 安装

```bash
# 使用 npm
npm install @system-ui-js/multi-drag

# 使用 yarn
yarn add @system-ui-js/multi-drag
```

## 🚀 快速开始

### 基本导入

```typescript
import {
  Drag,
  Scale,
  Rotate,
  Mixin,
  MixinType,
  defaultSetPose,
  defaultGetPose
} from '@system-ui-js/multi-drag';
```

### 简单拖拽示例

```typescript
// 获取要操作的元素
const element = document.getElementById('my-element') as HTMLElement;

// 创建基本拖拽实例
const drag = new Drag(element);

// 销毁实例（清理事件监听）
drag.destroy();
```

### 组合手势示例

```typescript
// 创建一个同时支持拖拽、旋转和缩放的实例
const multiGesture = new Mixin(
  element,
  {},
  [MixinType.Drag, MixinType.Rotate, MixinType.Scale]
);

// 配置惯性拖拽
const inertialDrag = new Drag(element, { inertial: true });
```

## 📚 详细API

### 1. Mixin 类

Mixin类是本库的核心特色，允许灵活组合多种手势功能。

```typescript
new Mixin(element, options, mixinTypes);
```

**参数说明：**
- `element`: 要应用手势的HTML元素
- `options`: 配置选项
- `mixinTypes`: 要组合的手势类型数组

**MixinType 枚举：**
```typescript
enum MixinType {
  Drag = 'drag',    // 拖拽功能
  Rotate = 'rotate', // 旋转功能
  Scale = 'scale'    // 缩放功能
}
```

**示例：**
```typescript
// 创建支持拖拽和旋转的组合实例
const mixin = new Mixin(
  document.getElementById('item'),
  {},
  [MixinType.Drag, MixinType.Rotate]
);
```

### 2. 基础手势类

#### Drag 类

提供基本的拖拽功能，支持单指和多指操作。

```typescript
new Drag(element, options);
```

**主要选项：**
- `inertial`: 是否启用惯性拖拽
- `passive`: 是否使用passive事件监听

#### Rotate 类

提供旋转功能，可与其他手势组合使用。

```typescript
new Rotate(element, options);
```

#### Scale 类

提供缩放功能，可与其他手势组合使用。

```typescript
new Scale(element, options);
```

### 3. 工具函数

#### defaultGetPose

获取元素的当前位姿（位置、尺寸等信息）的默认函数。

默认是从元素的style属性中获取位姿信息。

如果需要可以在`new Drag()`时的options中自定义获取位姿的函数。

```typescript
function defaultGetPose(element: HTMLElement): Pose;
```

#### defaultSetPose

将位姿应用到元素上的默认函数。

默认是将位姿信息应用到元素的style属性中。

如果需要可以在`new Drag()`时的options中自定义设置位姿的函数。

```typescript
function defaultSetPose(element: HTMLElement, pose: Pose): void;
```

### 4. 一些类型

#### Options

Options在每个手势类中使用

```typescript

export interface Options {
    // 支持最大的手指数量，默认1
    maxFingerCount?: number
    // 惯性拖拽，默认false
    inertial?: boolean
    // 被动模式，默认false
    // 被动模式下，不主动监听元素事件，而是外部调用trigger方法触发事件
    passive?: boolean
    // 获取当前Pose
    getPose?: (element: HTMLElement) => Pose
    // 设置当前Pose
    setPose?: (element: HTMLElement, pose: Partial<Pose>) => void
    // 在End时单独设置Pose，这可以让前面的setPose成为一种预览，从而提升性能
    setPoseOnEnd?: (element: HTMLElement, pose: Partial<Pose>) => void
}

```

#### Pose

Pose就是元素的位姿信息，包含位置、旋转、尺寸等信息。

```typescript
export interface Pose {
    readonly position: ReadonlyPoint;
    readonly rotation?: number;
    readonly width: number;
    readonly height: number;
    readonly scale?: number;
}
```

## 💡 高级用例

### 自定义事件处理

以Drag实例为例，自定义事件处理逻辑如下：

```typescript
const drag = new Drag(element);
drag.addEventListener(DragOperationType.Start, (fingers) => {
    console.log('当前有', fingers.length, '个触点')
})
drag.addEventListener(DragOperationType.Move, (fingers) => {
    console.log('移动中');
})
drag.addEventListener(DragOperationType.End, (fingers) => {
    console.log('拖拽结束');
})
```

### 多元素协同操作

```typescript
// 创建多个元素的手势实例
const elements = document.querySelectorAll('.draggable');
elements.forEach(element => {
  // 为每个元素创建相同的手势组合
  new Mixin(
    element as HTMLElement,
    {},
    [MixinType.Drag, MixinType.Rotate, MixinType.Scale]
  );
});
```

## 🔧 构建与开发

### 构建命令

项目支持分别构建API库和演示项目：

```bash
# 构建API库（用于发布到npm）
npm run build:lib

# 构建演示项目（用于GitHub Pages）
npm run build:demo

# 构建所有内容
npm run build:all

# 生成TypeScript类型定义
npm run build:types
```

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 运行端到端测试
npm run test:e2e
```

## 📋 许可证

本项目采用MIT许可证。详情请查看LICENSE文件。

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进这个项目！

## 📢 注意事项

- 确保在移动设备上测试多指手势功能
- 对于复杂的手势组合，建议使用Mixin类以获得最佳体验
- 惯性拖拽功能在性能受限设备上可能会有不同表现
- 如有任何问题，请查看示例代码或提交Issue
