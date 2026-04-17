## 1. Workspace 与包边界调整

- [x] 1.1 将仓库调整为 workspace 结构，拆分出 `packages/multi-drag-core`、`packages/multi-drag` 与 Demo 应用目录。
- [x] 1.2 补齐根目录共享的 TypeScript、构建、测试与 lint 配置，并为两个包定义独立入口、导出与产物配置。

## 2. 抽离平台无关的 core 能力

- [x] 2.1 从现有实现中提取平台无关的类型、位姿模型、几何计算与惯性推导逻辑到 `multi-drag-core`。
- [x] 2.2 在 `multi-drag-core` 中实现基于归一化输入的指针状态流转与 drag / rotate / scale 组合控制器。
- [x] 2.3 为 `multi-drag-core` 增加覆盖确定性计算、状态机流转与多指输入序列的单元测试。

## 3. 重构 Web 兼容层

- [x] 3.1 在 `multi-drag` 包中实现 DOM adapter，集中处理浏览器 pointer 事件监听、输入归一化与宿主位姿读写。
- [x] 3.2 重构现有 `Drag`、`Rotate`、`Scale`、`Mixin` 等公开 API，使其通过 core 控制器驱动并保持现有核心用法可用。
- [x] 3.3 验证并补齐 `getPose`、`setPose`、`setPoseOnEnd` 等宿主扩展点的兼容行为，避免 Web 集成方式回退。
- [x] 3.4 为 DOM adapter 与兼容 API 增加集成/回归测试，覆盖典型 Web 交互路径。

## 4. 更新 Demo 与开发者体验

- [x] 4.1 更新 Demo，分别提供 core 驱动示例与 `multi-drag` Web 封装示例，并清晰标识两者定位差异。
- [x] 4.2 在 core 示例中显式展示“输入归一化 → core 计算 → 宿主状态应用”的边界，而不是让 core 直接读写 DOM。
- [x] 4.3 更新 README、示例说明与开发文档，说明多包结构、包职责与推荐使用方式。

## 5. 构建、发布与收尾校验

- [x] 5.1 确认 `multi-drag-core` 的最终包名与作用域，并将构建/发布脚本统一到新的 workspace 流程中。
- [x] 5.2 调整 CI 或本地校验脚本，确保 core 单测、Web 集成测试与 Demo 构建能分别执行。
- [x] 5.3 完成变更回归验证，确认原 Web 包核心能力可用且 core 包可在无 DOM 宿主中安全导入。
