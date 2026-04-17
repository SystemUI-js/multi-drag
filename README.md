# Multi Drag Workspace

`multi-drag` 已拆分为 workspace，多包职责如下：

- `@system-ui-js/multi-drag-core`：平台无关的手势核心，接收归一化输入，输出 pose 结果
- `@system-ui-js/multi-drag`：面向 DOM/Web 的兼容封装，继续提供 `Drag` / `Rotate` / `Scale` / `Mixin`
- `apps/demo`：展示 Web 开箱即用示例与宿主扩展点

## 安装

```bash
yarn install
```

## Workspace 脚本

```bash
yarn dev          # 启动 demo
yarn build        # 构建 core / web / demo
yarn test         # 运行 core + web 单测
yarn test:e2e     # 运行 Playwright E2E
```

## 包职责

### `@system-ui-js/multi-drag-core`

适合 Expo、自定义渲染器、Canvas/WebGL 或需要自行管理宿主状态的场景。

```ts
import {
    GestureController,
    PointerPhase,
    type NormalizedPointerInput
} from '@system-ui-js/multi-drag-core'

const controller = new GestureController({
    features: { drag: true, rotate: true, scale: true }
})

const next = controller.process(input as NormalizedPointerInput, {
    pose,
    anchorCenter
})
```

核心边界始终是：

1. 输入归一化
2. core 计算
3. 宿主应用 pose

### `@system-ui-js/multi-drag`

适合浏览器 DOM 场景，保持原有核心用法：

```ts
import { Drag, Mixin, MixinType } from '@system-ui-js/multi-drag'

new Drag(element)

new Mixin(element, {}, [
    MixinType.Drag,
    MixinType.Rotate,
    MixinType.Scale
])

new Mixin(
    element,
    {},
    [MixinType.Drag, MixinType.Rotate, MixinType.Scale],
    [MixinType.Drag]
)
```

仍支持：

- `getPose`
- `setPose`
- `setPoseOnEnd`

## Demo

```bash
yarn dev
```

Demo 页面包含：

- multi-drag 示例：验证 Web API 兼容层与单指动作配置
- joystick 示例：验证宿主扩展点兼容

## 测试策略

- `packages/multi-drag-core`：纯单测，验证确定性与无 DOM 导入
- `packages/multi-drag`：DOM 集成/兼容测试
- `tests/e2e`：demo smoke tests
