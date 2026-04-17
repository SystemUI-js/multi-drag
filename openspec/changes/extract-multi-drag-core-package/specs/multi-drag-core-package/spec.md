## ADDED Requirements

### Requirement: 提供独立发布的核心包入口
系统 MUST 提供可独立构建、测试与发布的 `multi-drag-core` 包入口。该包 SHALL 只暴露平台无关的类型、手势控制器、状态流转能力与公共 API，不得要求消费者依赖 `document`、`HTMLElement`、`PointerEvent` 等 DOM 专属对象。

#### Scenario: 在非 DOM 宿主中导入核心包
- **WHEN** 消费者在不提供浏览器 DOM 全局对象的宿主环境中导入 core 包公开 API
- **THEN** 导入过程 MUST 不因访问 `document`、`window`、`HTMLElement` 或 `PointerEvent` 而失败

### Requirement: 通过归一化输入驱动手势状态流转
系统 MUST 允许消费者使用平台中立的归一化指针输入驱动多指拖拽、旋转、缩放与位姿计算。核心 API SHALL 接收标准化输入并输出可消费的手势阶段、位姿快照或增量结果，而不是直接处理宿主事件对象。

#### Scenario: 使用归一化输入更新手势状态
- **WHEN** 消费者依次提交多个指针的开始、移动与结束输入
- **THEN** core 包 MUST 产出与输入顺序一致的阶段变化和位姿结果，用于宿主渲染或状态更新

### Requirement: 核心计算结果应可独立验证
系统 MUST 将几何计算、惯性推导与手势状态逻辑设计为可在无宿主依赖条件下独立验证的能力。对于相同的初始状态和归一化输入序列，核心结果 SHALL 保持确定性。

#### Scenario: 相同输入得到确定性结果
- **WHEN** 同一组初始位姿与归一化输入序列被重复提交给 core 能力
- **THEN** 系统 MUST 生成一致的位姿或状态输出，便于单元测试与回归验证
