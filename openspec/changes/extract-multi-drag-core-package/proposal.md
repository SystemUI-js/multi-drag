## Why

当前 `@system-ui-js/multi-drag` 的核心手势计算、状态机与 DOM/Web 适配强耦合，难以复用到 Expo 等非 DOM 环境，也限制了库的长期演进。现在拆出独立 core 包，可以把平台无关能力沉淀为稳定基础，同时保持原包对现有 Web 用户的核心功能不变。

## What Changes

- 新增独立 npm 包 `@system-js-ui/multi-drag-core`，用于承载平台无关的多指拖拽、旋转、缩放、位姿与手势状态等核心能力。
- 重构原 `@system-ui-js/multi-drag` 包，使其继续提供现有 DOM/Web 场景的核心能力，但内部基于抽离后的 core 进行组织。
- 调整仓库结构、构建与发布流程，使 core 包与原包可以独立构建、测试和发布。
- 更新原包 Demo，使其同时展示基于 core 的示例与基于 `multi-drag` 的完整示例，便于对比两者定位与用法。
- 明确 core 包与原包的职责边界，避免未来平台适配逻辑继续污染平台无关能力。

## Capabilities

### New Capabilities
- `multi-drag-core-package`: 提供可独立发布的多指手势核心包，承载平台无关的数据结构、手势计算、状态流转与公共 API。
- `multi-drag-package-compatibility`: 保证原 `@system-ui-js/multi-drag` 包在完成 core 抽离后继续提供既有 DOM/Web 核心功能与兼容定位。
- `multi-drag-demo-showcase`: 提供同时展示 core 与 `multi-drag` 的 Demo 体验，帮助开发者理解两者的职责与使用方式。

### Modified Capabilities
- 无

## Impact

- 受影响代码：`src/drag/*`、`src/index.ts`、`src/demo/*`、构建配置、包发布配置、测试结构。
- 受影响 API：新增 `@system-js-ui/multi-drag-core` 的公开 API；原 `@system-ui-js/multi-drag` 需要保持现有核心能力可用。
- 受影响系统：npm 包产物、Demo 展示、测试与发布流程、仓库目录组织。
- 依赖与协作：需要明确 core 与 DOM/Web 适配层边界，为后续 Expo 或其他平台适配留出稳定扩展点。
