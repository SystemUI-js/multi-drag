## ADDED Requirements

### Requirement: 原 Web 包保持现有核心用法可用
系统 MUST 继续让 `@system-ui-js/multi-drag` 包在 DOM/Web 场景下提供既有核心能力与兼容定位。现有公开类、入口或典型使用方式在完成 core 抽离后 SHALL 仍可驱动拖拽、旋转、缩放或其组合行为。

#### Scenario: 现有 Web 用法继续工作
- **WHEN** 已有 Web 使用方按当前公开入口创建 `multi-drag` 实例并绑定元素
- **THEN** 系统 MUST 继续在 DOM 场景下响应手势并产出与原定位一致的核心交互能力

### Requirement: Web 宿主适配与核心算法边界清晰
系统 MUST 将 DOM 事件监听、宿主位姿读写与浏览器对象访问限制在 `@system-ui-js/multi-drag` 包或其 Web 适配层中。原包 SHALL 通过适配层把浏览器输入归一化后交给 core，而不是让 DOM 依赖泄漏回 core 包。

#### Scenario: Web 适配层驱动 core
- **WHEN** 用户在浏览器中触发 pointer 交互
- **THEN** 原包 MUST 先完成事件归一化与宿主状态桥接，再调用 core 能力计算手势结果

### Requirement: 兼容层支持宿主位姿控制扩展
系统 MUST 保留原包在 Web 场景下的宿主位姿读写与结束态写回能力边界，使现有以 `getPose`、`setPose`、`setPoseOnEnd` 或等价方式扩展宿主状态的集成方式继续可用，或提供明确兼容替代。

#### Scenario: 自定义位姿读写继续可集成
- **WHEN** 使用方通过原包提供的位姿读写扩展点接入自定义元素状态管理
- **THEN** 系统 MUST 允许兼容层在手势进行中和结束时按既有职责更新宿主位姿
